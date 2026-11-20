/**
 * `@jangts/router-plus/testing` entry: memory connection, host and fake bridge.
 */
export {
  createMemoryConnection,
  type MemoryConnection,
  type MemoryConnectionOptions,
} from './memory-connection.js';
export { createMemoryHost, type MemoryHost } from './memory-host.js';
export { createFakeBridge, type FakeBridge } from './fake-bridge.js';
