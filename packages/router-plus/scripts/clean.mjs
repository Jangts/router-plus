/** Remove only this package's generated output before compiling both module formats. */
import { rm } from 'node:fs/promises';
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
