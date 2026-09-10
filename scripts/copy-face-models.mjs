/**
 * Copies the face-api.js model weights needed for browser-side face detection
 * and descriptor extraction into public/models, so they can be served as
 * static assets.
 *
 * Only three of the bundled models are used:
 *   - tiny_face_detector  (~189 KB) single-face detector, fast on mobile
 *   - face_landmark_68    (~350 KB) alignment landmarks
 *   - face_recognition    (~6.3 MB) 128-d descriptor extractor
 *
 * The remaining models (SSD MobileNet, age/gender, expression, tiny landmarks)
 * are intentionally skipped to keep the payload small.
 */
import { cp, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', '@vladmandic', 'face-api', 'model');
const target = join(root, 'public', 'models');

const models = [
    'tiny_face_detector_model',
    'face_landmark_68_model',
    'face_recognition_model',
];

const exists = async (path) => {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
};

if (!(await exists(source))) {
    console.error(
        `[face-models] Source directory not found: ${source}\n` +
            'Run `npm install` first, then re-run this script.',
    );
    process.exit(1);
}

await mkdir(target, { recursive: true });

let copied = 0;

for (const model of models) {
    const files = [`${model}.bin`, `${model}-weights_manifest.json`];

    for (const file of files) {
        const from = join(source, file);

        if (!(await exists(from))) {
            console.error(`[face-models] Missing expected file: ${file}`);
            process.exit(1);
        }

        await cp(from, join(target, file));
        copied++;
    }
}

console.log(`[face-models] Copied ${copied} files to public/models`);
