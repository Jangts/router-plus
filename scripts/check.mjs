/** Check this standalone package's lockfile, source imports and public ESM/CJS entries after build. */
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optionalLockProblems } from './optional-locks.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../package.json', import.meta.url));
const { preProcessFile } = require('typescript');
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
for (const filename of ['pnpm-lock.yaml', 'yarn.lock', 'bun.lock', 'bun.lockb']) {
  await assert.rejects(access(path.join(root, filename)), `Use only package-lock.json: ${filename}`);
}
const dependencies = {
  ...manifest.dependencies,
  ...manifest.peerDependencies,
  ...manifest.devDependencies,
};
assert.equal(manifest.name, '@jangts/router-plus');
assert.equal(manifest.workspaces, undefined);
assert.equal(lock.packages[''].name, manifest.name);
assert.equal(lock.packages[''].version, manifest.version);
assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies);
assert.deepEqual(lock.packages[''].peerDependencies, manifest.peerDependencies);
assert.deepEqual(optionalLockProblems(lock), []);
assert.ok(!Object.values(lock.packages).some((entry) => entry.link));

/** Walk maintained sources and reject undeclared dependencies or imports outside the SDK. */
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await inspect(filename);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
      const { importedFiles } = preProcessFile(await readFile(filename, 'utf8'), true, true);
      for (const { fileName: target } of importedFiles) {
        if (target.startsWith('.')) {
          assert.ok(
            !path.relative(root, path.resolve(path.dirname(filename), target)).startsWith('..'),
            `Package escape: ${filename}: ${target}`,
          );
        } else {
          assert.ok(
            Object.keys(dependencies).some(
              (name) => target === name || target.startsWith(name + '/'),
            ),
            `Undeclared dependency: ${filename}: ${target}`,
          );
        }
      }
    }
  }
}

await inspect(path.join(root, 'src'));
for (const [entry, target] of Object.entries(manifest.exports)) {
  if (typeof target === 'string') {
    await access(path.join(root, target));
    continue;
  }
  await access(path.join(root, target.types));
  const specifier = manifest.name + (entry === '.' ? '' : entry.slice(1));
  assert.deepEqual(
    Object.keys(await import(specifier)).sort(),
    Object.keys(require(specifier)).sort(),
    `Module formats differ: ${specifier}`,
  );
}
console.log(
  `Package passed: ${manifest.name}@${manifest.version}, ${Object.keys(manifest.exports).length} public entries, standalone lock and isolated imports`,
);
