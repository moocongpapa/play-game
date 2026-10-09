/** Generate a reviewed, reusable speech bank. Dry-run is the default. */
import { mkdir, readFile, writeFile, rename, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { buildSpeechLibrary, type SpeechAssetJob } from './speech-library';
import { speechSynthesisSpec, speechSynthesisKey, normalizeSpokenText, SPEECH_MODEL } from '../src/data/speechSynthesis';
import { AudioBudgetError, generateElevenAudio, getIncludedAudioBudget } from '../src/server/elevenLabsAudio';

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const readBudget = async (key: string) => {
  for (let attempt = 0; ; attempt++) {
    const budget = await getIncludedAudioBudget(key, 12);
    if (budget.reason !== 'unavailable' || attempt === 2) return budget;
    await pause(1000 * (attempt + 1));
  }
};

const root = '.audio-generation/speech';
const destination = 'public/audio/elevenlabs/speech';
const budgetLimit = Number(process.argv.find(arg => arg.startsWith('--budget='))?.split('=')[1] || 20000);
if (!Number.isSafeInteger(budgetLimit) || budgetLimit <= 0) throw new Error('Invalid --budget');
const jobs = await buildSpeechLibrary();
const hashes = new Map<string, string>();
for (const [path, isCatalog] of [[`${destination}/catalog.json`, true], [`${root}/journal.json`, false]] as const) {
  try {
    const data = JSON.parse(await readFile(path, 'utf8'));
    const entries = isCatalog ? data.clips.map((clip: { id: string; sha256: string }) => [clip.id, clip.sha256])
      : Object.entries(data).map(([id, entry]) => [id, (entry as { sha256?: string }).sha256]);
    for (const [id, hash] of entries) if (hash) hashes.set(id, hash);
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
}
const validAudio = (bytes: Uint8Array) => bytes.byteLength > 100 && bytes.byteLength <= 2 * 1024 * 1024 &&
  ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
const saved = async (id: string) => {
  for (const folder of [destination, root]) {
    const bytes = await readFile(`${folder}/${id}.mp3`).catch(() => null);
    if (bytes && validAudio(bytes) && (!hashes.has(id) || createHash('sha256').update(bytes).digest('hex') === hashes.get(id))) return { folder, bytes };
  }
  return null;
};
const pending: SpeechAssetJob[] = [];
for (const job of jobs) if (!(await saved(job.id))) pending.push(job);
const estimate = pending.reduce((sum, job) => sum + job.text.length, 0);
console.log(JSON.stringify({ totalFiles: jobs.length, existingFiles: jobs.length - pending.length, missingFiles: pending.length, estimatedCredits: estimate, budgetLimit }));
if (!process.argv.includes('--generate')) process.exit(0);
if (estimate > budgetLimit) throw new Error('Review the catalog or increase the explicit --budget before generating');

await mkdir(root, { recursive: true });
const env = loadEnv('development', process.cwd(), '');
const key = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
if (!key) throw new Error('Server-only ELEVENLABS_API_KEY is required');
const initial = await readBudget(key);
if (!initial.eligible || initial.remaining < estimate) throw new Error('Insufficient verified included credits; no generation started');
// The batch already reserves its entire conservative cost. Subscription GETs
// have a lower rate limit than TTS: refresh once a minute, debit each local
// reservation immediately, and stop if the billing cycle or plan changes.
let verifiedBudget = { ...initial }, checkedAt = Date.now();
const reserveBudget = async (needed: number) => {
  if (Date.now() - checkedAt >= 60000) {
    const fresh = await readBudget(key);
    if (!fresh.eligible) throw new AudioBudgetError(fresh);
    if (fresh.resetsAt !== initial.resetsAt || fresh.tier !== initial.tier || fresh.limit !== initial.limit) {
      throw new AudioBudgetError({ ...fresh, eligible: false, reason: 'plan_not_supported' });
    }
    verifiedBudget = { ...fresh, remaining: Math.min(fresh.remaining, verifiedBudget.remaining) };
    checkedAt = Date.now();
  }
  const budget = { ...verifiedBudget };
  if (budget.remaining < needed) throw new AudioBudgetError({ ...budget, reason: 'exhausted' });
  verifiedBudget.remaining -= needed;
  return budget;
};
const client = new ElevenLabsClient({ apiKey: key, maxRetries: 0, timeoutInSeconds: 15 });
type HistoryItem = Awaited<ReturnType<typeof client.history.list>>['history'][number];
const history: HistoryItem[] = [];
// Read all history pages per voice; long catalogs may exceed a provider page.
// Only reuse byte-for-byte text with matching synthesis settings.
// A denied history scope aborts instead of risking a duplicate after an interrupted run.
for (const voiceId of new Set(pending.map(job => speechSynthesisSpec(job.characters[0]).voiceId))) {
  let cursor: string | undefined;
  do {
    const page = await client.history.list({ pageSize: 1000, voiceId, modelId: SPEECH_MODEL, source: 'TTS', startAfterHistoryItemId: cursor });
    history.push(...page.history);
    if (page.hasMore && (!page.lastHistoryItemId || page.lastHistoryItemId === cursor)) throw new Error('Incomplete provider history; generation not started');
    cursor = page.hasMore ? page.lastHistoryItemId : undefined;
  } while (cursor);
}
type JournalEntry = { state: 'started' | 'saved'; sha256?: string };
const journalPath = `${root}/journal.json`;
let journal: Record<string, JournalEntry>;
try { journal = JSON.parse(await readFile(journalPath, 'utf8')); }
catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') journal = {}; else throw error; }
let writing = Promise.resolve();
const persist = () => {
  const content = JSON.stringify(journal);
  writing = writing.then(async () => { await writeFile(`${journalPath}.tmp`, content); await rename(`${journalPath}.tmp`, journalPath); });
  return writing;
};
const findHistory = (job: SpeechAssetJob) => {
  const spec = speechSynthesisSpec(job.characters[0]);
  const expected = { stability: spec.voiceSettings.stability, similarity_boost: spec.voiceSettings.similarityBoost,
    style: spec.voiceSettings.style, speed: spec.voiceSettings.speed, use_speaker_boost: spec.voiceSettings.useSpeakerBoost };
  return history.find(item => item.voiceId === spec.voiceId && item.modelId === spec.modelId &&
    item.outputFormat === spec.outputFormat && normalizeSpokenText(item.text || '') === job.text &&
    Object.entries(expected).every(([name, value]) => item.settings?.[name] === value));
};
let index = 0, generated = 0, recovered = 0, reserved = 0, failure: unknown;
const uncertain: string[] = [];
process.on('SIGINT', () => { failure = new Error('Generation paused; saved files will be reused on the next run'); });
const worker = async () => {
  while (!failure) {
    const job = pending[index++];
    if (!job) return;
    try {
      let bytes: Uint8Array;
      const prior = findHistory(job);
      if (prior) {
        bytes = new Uint8Array(await new Response(await client.history.getAudio(prior.historyItemId)).arrayBuffer());
        recovered++;
      } else {
        if (journal[job.id]) { uncertain.push(job.id); continue; }
        reserved += job.text.length;
        if (reserved > budgetLimit) throw new Error('Batch credit ceiling reached');
        journal[job.id] = { state: 'started' }; await persist();
        for (let attempt = 0; ; attempt++) {
          try {
            bytes = new Uint8Array(await generateElevenAudio(key, { text: job.text, characterId: job.characters[0] }, () => reserveBudget(job.text.length)));
            break;
          } catch (error) {
            // Only this error proves the generation POST was never sent. All other
            // interruptions remain journaled for history recovery, never automatic retry.
            if (error instanceof AudioBudgetError) {
              if (error.budget.reason === 'unavailable' && attempt < 2) {
                await pause(15000 * (attempt + 1));
                continue;
              }
              delete journal[job.id]; await persist();
            }
            throw error;
          }
        }
        generated++;
      }
      if (!validAudio(bytes)) throw new Error(`Invalid MP3 for ${job.id}`);
      const target = `${root}/${job.id}.mp3`;
      await writeFile(`${target}.tmp`, bytes); await rename(`${target}.tmp`, target);
      journal[job.id] = { state: 'saved', sha256: createHash('sha256').update(bytes).digest('hex') }; await persist();
      if ((generated + recovered) % 20 === 0) console.log(JSON.stringify({ saved: generated + recovered, remainingFiles: pending.length - generated - recovered, reservedCredits: reserved }));
    } catch (error) { failure = error; }
  }
};
// Two bounded workers; allowance reads are shared independently of TTS traffic.
await Promise.all([worker(), worker()]);
await writing;
await mkdir(destination, { recursive: true });
const catalog: Array<SpeechAssetJob & { bytes: number; sha256: string }> = [];
for (const job of jobs) {
  const clip = await saved(job.id);
  if (!clip) continue;
  if (clip.folder !== destination) await copyFile(`${clip.folder}/${job.id}.mp3`, `${destination}/${job.id}.mp3`);
  catalog.push({ ...job, bytes: clip.bytes.length, sha256: createHash('sha256').update(clip.bytes).digest('hex') });
}
await writeFile(`${destination}/catalog.json`, JSON.stringify({ version: 1, clips: catalog }, null, 2) + '\n');
await writeFile('src/data/generatedSpeechManifest.ts', '// Generated from saved, validated speech files. Do not hand-edit.\n' +
  `export const GENERATED_SPEECH_REQUESTS: Readonly<Record<string, string>> = ${JSON.stringify(Object.fromEntries(catalog.map(item => [speechSynthesisKey(item.text, item.characters[0], item.language), item.id])), null, 2)};\n` +
  `export const GENERATED_SPEECH_FILES: ReadonlySet<string> = new Set(Object.values(GENERATED_SPEECH_REQUESTS));\nexport const GENERATED_SPEECH_COUNT = ${catalog.length};\n`);
const final = await readBudget(key);
console.log(JSON.stringify({ published: catalog.length, generated, recovered,
  creditsUsed: final.reason === 'unavailable' ? null : initial.remaining - final.remaining,
  remaining: final.reason === 'unavailable' ? null : final.remaining, budgetStatus: final.reason }));
if (failure) { console.error(failure instanceof Error ? failure.message : 'Generation interrupted'); process.exitCode = 1; }
if (uncertain.length) { console.error(`Uncertain earlier requests require history recovery before retrying: ${uncertain.join(', ')}`); process.exitCode = 1; }
