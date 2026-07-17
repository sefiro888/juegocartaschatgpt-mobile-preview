import { readdir, rename, stat, unlink } from 'node:fs/promises';
import { extname, join, parse, resolve } from 'node:path';
import sharp from 'sharp';

const artDirectory = resolve('public/assets/cards/art');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const targetSize = 640;
const webpQuality = 84;

const entries = await readdir(artDirectory, { withFileTypes: true });
const sources = entries
  .filter((entry) => entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase()))
  .map((entry) => join(artDirectory, entry.name));

let bytesBefore = 0;
let bytesAfter = 0;
let optimizedCount = 0;

for (const sourcePath of sources) {
  const source = parse(sourcePath);
  const outputPath = join(artDirectory, `${source.name}.webp`);
  const temporaryPath = join(artDirectory, `${source.name}.optimized.webp`);
  const sourceInfo = await stat(sourcePath);
  const metadata = await sharp(sourcePath).metadata();
  bytesBefore += sourceInfo.size;

  if (
    extname(sourcePath).toLowerCase() === '.webp'
    && (metadata.width ?? 0) <= targetSize
    && (metadata.height ?? 0) <= targetSize
  ) {
    bytesAfter += sourceInfo.size;
    continue;
  }

  await sharp(sourcePath)
    .resize(targetSize, targetSize, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: webpQuality, effort: 6, smartSubsample: true })
    .toFile(temporaryPath);

  if (sourcePath === outputPath) {
    await unlink(sourcePath);
  } else {
    try {
      await unlink(outputPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await unlink(sourcePath);
  }

  await rename(temporaryPath, outputPath);
  bytesAfter += (await stat(outputPath)).size;
  optimizedCount++;
}

const toMegabytes = (bytes) => (bytes / (1024 * 1024)).toFixed(1);
console.log(
  `Checked ${sources.length} card images, optimized ${optimizedCount}: `
  + `${toMegabytes(bytesBefore)} MB -> ${toMegabytes(bytesAfter)} MB.`,
);
