import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { writeFile, mkdir, stat } from 'node:fs/promises';
import { CHARACTER_VIDEOS } from '../src/data/characterVideoData';
import type { CharacterId } from '../src/types';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is required to generate videos.');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function fileExistsAndNotEmpty(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.size > 100000; // at least 100KB
  } catch {
    return false;
  }
}

async function pollAndDownload(opName: string, outputPath: string) {
  console.log(`Polling operation: ${opName} -> ${outputPath}...`);
  const op = new GenerateVideosOperation();
  op.name = opName;

  let attempts = 0;
  while (true) {
    attempts++;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    if (updated.done) {
      if (updated.error) {
        throw new Error(`Video generation error: ${JSON.stringify(updated.error)}`);
      }
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) throw new Error('No video URI returned in operation response');

      console.log(`Downloading video for ${outputPath} from: ${uri}...`);
      const response = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey! },
      });
      if (!response.ok) throw new Error(`Download failed with status ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(outputPath, buffer);
      console.log(`[SUCCESS] Saved video to ${outputPath} (${buffer.length} bytes)`);
      return;
    }

    if (attempts % 4 === 0) {
      console.log(`[${outputPath}] Processing... (${attempts * 5}s elapsed)`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function generateVideoForCharacter(characterId: CharacterId): Promise<void> {
  const outputPath = `public/videos/${characterId}.mp4`;
  if (await fileExistsAndNotEmpty(outputPath)) {
    console.log(`[SKIP] Video for ${characterId} already exists at ${outputPath}`);
    return;
  }

  const data = CHARACTER_VIDEOS[characterId];
  if (!data) throw new Error(`Unknown character: ${characterId}`);
  if (!data.videoPrompt) throw new Error(`No video prompt configured for: ${characterId}`);

  console.log(`\n========================================`);
  console.log(`Initiating Veo generation for [${characterId}] (${data.title})...`);
  console.log(`========================================\n`);

  const modelName = process.env.VEO_MODEL || 'veo-3.1-lite-generate-preview';
  const operation = await ai.models.generateVideos({
    model: modelName,
    source: {
      prompt: data.videoPrompt,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9',
    },
  });

  console.log(`Operation initiated for ${characterId}: ${operation.name}`);
  await pollAndDownload(operation.name, outputPath);
}

async function main() {
  await mkdir('public/videos', { recursive: true });
  const target = process.argv[2] || 'all';

  const allIds: CharacterId[] = [
    'pingu',
    'ggomi',
    'rano',
    'jelly',
    'dochi',
    'ggulgguli',
    'eumme',
    'nurungji',
  ];

  if (target === 'all') {
    // Filter out already generated characters
    const pending: CharacterId[] = [];
    for (const id of allIds) {
      if (!(await fileExistsAndNotEmpty(`public/videos/${id}.mp4`))) {
        pending.push(id);
      } else {
        console.log(`Already completed: ${id}`);
      }
    }

    console.log(`Pending characters to generate: ${pending.join(', ')}`);

    // Process in batches of 2 to balance concurrency and rate limits
    const batchSize = 2;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      console.log(`\n>>> Starting batch ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`);
      await Promise.all(
        batch.map((id) =>
          generateVideoForCharacter(id).catch((err) => {
            console.error(`[ERROR] Failed to generate ${id}:`, err?.message || err);
          })
        )
      );
    }
  } else {
    await generateVideoForCharacter(target as CharacterId);
  }

  console.log('\nAll generation tasks finished!');
}

main().catch((err) => {
  console.error('Fatal error in main:', err);
  process.exit(1);
});
