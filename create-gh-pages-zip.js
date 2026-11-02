import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { ZipArchive } = require('archiver');

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');
const outputFile = path.join(publicDir, 'razao-xp-github-pages.zip');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist. Run npm run build first.');
  process.exit(1);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function addDirectoryToZip(dir, zip, baseDir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(baseDir, fullPath);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      addDirectoryToZip(fullPath, zip, baseDir);
    } else {
      zip.append(fs.createReadStream(fullPath), { name: relPath });
    }
  }
}

const output = fs.createWriteStream(outputFile);
const zip = new ZipArchive({ zlib: { level: 9 } });

zip.pipe(output);
addDirectoryToZip(distDir, zip, distDir);

zip.finalize().then(() => {
  console.log(`Successfully created ${outputFile}`);
}).catch(err => {
  console.error('Failed to create zip', err);
});
