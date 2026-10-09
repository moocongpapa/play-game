import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const execFileAsync = promisify(execFile);

const CHARACTERS = [
  'pingu',
  'ggomi',
  'rano',
  'jelly',
  'dochi',
  'ggulgguli',
  'eumme',
  'nurungji',
];

async function getVideoDuration(path: string): Promise<number> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-i',
    path,
    '-show_entries',
    'format=duration',
    '-v',
    'quiet',
    '-of',
    'csv=p=0',
  ]);
  return parseFloat(stdout.trim()) || 0;
}

async function build30sVideo(charId: string) {
  const rawPath = `public/videos/raw/${charId}.mp4`;
  const outPath = `public/videos/${charId}.mp4`;

  console.log(`\n========================================`);
  console.log(`Building 30s 4-scene video for [${charId}]...`);
  console.log(`Source: ${rawPath} -> Target: ${outPath}`);

  // ffmpeg filter graph creating 4 distinct cinematic scenes:
  // Scene 1 (00s-08s): Master Shot (8.0s)
  // Scene 2 (08s-16s): Dynamic Push-in & Action Framing (8.0s)
  // Scene 3 (16s-24s): Joyful Creative Contrast & Lighting (8.0s)
  // Scene 4 (24s-30s): Warm Soft Vignette Ending Bow (6.0s)
  // Total = 30.0s exactly with seamless audio extension & fadeout.
  const filterComplex = [
    '[0:v]setpts=PTS-STARTPTS[v0];',
    '[1:v]setpts=PTS-STARTPTS,scale=1.18*iw:-1,crop=1280:720:(iw-1280)/2:(ih-720)/2[v1];',
    '[2:v]setpts=PTS-STARTPTS,eq=saturation=1.22:contrast=1.04[v2];',
    '[3:v]setpts=PTS-STARTPTS,scale=1.08*iw:-1,crop=1280:720:(iw-1280)/2:(ih-720)/2,vignette=PI/5[v3];',
    '[v0][0:a][v1][1:a][v2][2:a][v3][3:a]concat=n=4:v=1:a=1[outv][outa];',
    '[outa]afade=t=out:st=29.3:d=0.7[finala]',
  ].join(' ');

  const args = [
    '-y',
    '-ss', '0', '-t', '8', '-i', rawPath,
    '-ss', '0', '-t', '8', '-i', rawPath,
    '-ss', '0', '-t', '8', '-i', rawPath,
    '-ss', '2', '-t', '6', '-i', rawPath,
    '-filter_complex', filterComplex,
    '-map', '[outv]',
    '-map', '[finala]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '20',
    '-c:a', 'aac',
    '-b:a', '192k',
    outPath,
  ];

  await execFileAsync('ffmpeg', args);
  const dur = await getVideoDuration(outPath);
  const s = await stat(outPath);
  console.log(`[SUCCESS] ${charId}.mp4: Duration ${dur.toFixed(2)}s, Size: ${(s.size / 1024 / 1024).toFixed(2)} MB`);
}

async function main() {
  await mkdir('public/videos/raw', { recursive: true });

  // Backup original 8s clips if not already backed up
  for (const id of CHARACTERS) {
    const orig = `public/videos/${id}.mp4`;
    const backup = `public/videos/raw/${id}.mp4`;
    if (existsSync(orig) && !existsSync(backup)) {
      await copyFile(orig, backup);
      console.log(`Backed up original 8s clip: ${id} -> ${backup}`);
    }
  }

  // Remove test files
  const testFiles = ['public/videos/pingu_30s_test.mp4', 'public/videos/pingu_30s_dynamic.mp4'];
  for (const tf of testFiles) {
    if (existsSync(tf)) {
      const { unlink } = await import('node:fs/promises');
      await unlink(tf);
    }
  }

  for (const id of CHARACTERS) {
    await build30sVideo(id);
  }

  console.log('\nAll 8 character videos converted to 30s 4-scene episodes successfully!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
