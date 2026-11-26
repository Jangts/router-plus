import { posix } from 'node:path';

// Native platform packages normally pin an exact version. Check those records
// before npm ci; ranged/file/git optional dependencies remain npm's responsibility.
export function optionalLockProblems(lock) {
  const problems = [];
  for (const [location, entry] of Object.entries(lock.packages ?? {})) {
    for (const [name, expected] of Object.entries(entry.optionalDependencies ?? {})) {
      if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(expected)) continue;
      let directory = location,
        found;
      while (true) {
        const candidate =
          posix.basename(directory) === 'node_modules'
            ? undefined
            : lock.packages[posix.join(directory, 'node_modules', name)];
        if (candidate) {
          found = candidate.link ? lock.packages[candidate.resolved] : candidate;
          break;
        }
        if (!directory) break;
        const parent = posix.dirname(directory);
        directory = parent === '.' ? '' : parent;
      }
      if (found?.version !== expected)
        problems.push({
          package: location || '.',
          dependency: name,
          expected,
          actual: found?.version ?? null,
        });
    }
  }
  return problems;
}
