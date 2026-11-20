/**
 * Post-build step for `@jangts/router-plus`.
 *
 * Marks `dist/esm` as ESM so both module formats ship from one TypeScript build.
 */
import { writeFile } from 'node:fs/promises';
await writeFile(new URL('../dist/esm/package.json', import.meta.url), '{"type":"module"}\n');

// CSS and runtime-injected styles share the same maintained source.
const { overlayStyles } = await import('../dist/esm/dom/styles.js');
await writeFile(new URL('../dist/overlay.css', import.meta.url), overlayStyles + '\n');
