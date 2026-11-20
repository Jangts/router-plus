/**
 * Plugin installation order and transactional setup.
 *
 * Static plugins are ordered by `requires` / `before`; dynamic installation cannot pretend to
 * reorder plugins that already ran and therefore rejects unsatisfiable constraints. Each setup
 * records the resources it registered so a failed setup can roll back cleanly.
 */
import type { RouterPlusPlugin, RouterPlusPluginApi } from './types.js';

interface InstalledPlugin {
  readonly plugin: RouterPlusPlugin;
  readonly dispose: () => Promise<void>;
}

export class PluginRegistry {
  private readonly installed = new Map<string, InstalledPlugin>();
  private readonly order: string[] = [];
  private readonly createApi: (record: (dispose: () => void) => void) => RouterPlusPluginApi;
  private installing = false;

  constructor(createApi: (record: (dispose: () => void) => void) => RouterPlusPluginApi) {
    this.createApi = createApi;
  }

  get ready(): boolean {
    return !this.installing;
  }

  ids(): readonly string[] {
    return [...this.order];
  }

  has(id: string): boolean {
    return this.installed.has(id);
  }

  private sort(plugins: readonly RouterPlusPlugin[]): RouterPlusPlugin[] {
    const byId = new Map(plugins.map((plugin) => [plugin.id, plugin]));
    if (byId.size !== plugins.length) throw new Error('Duplicate plugin id');
    const edges = new Map<string, Set<string>>();
    const incoming = new Map<string, number>();
    for (const plugin of plugins) {
      edges.set(plugin.id, new Set());
      incoming.set(plugin.id, 0);
    }
    for (const plugin of plugins) {
      for (const required of plugin.requires ?? []) {
        if (!byId.has(required))
          throw new Error(`Plugin dependency missing: ${plugin.id} -> ${required}`);
        if (!edges.get(required)!.has(plugin.id)) {
          edges.get(required)!.add(plugin.id);
          incoming.set(plugin.id, (incoming.get(plugin.id) ?? 0) + 1);
        }
      }
      for (const target of plugin.before ?? []) {
        if (!byId.has(target))
          throw new Error(`Plugin ordering target missing: ${plugin.id} -> ${target}`);
        if (!edges.get(plugin.id)!.has(target)) {
          edges.get(plugin.id)!.add(target);
          incoming.set(target, (incoming.get(target) ?? 0) + 1);
        }
      }
    }
    const queue = plugins
      .filter((plugin) => (incoming.get(plugin.id) ?? 0) === 0)
      .map((plugin) => plugin.id);
    const result: RouterPlusPlugin[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      result.push(byId.get(id)!);
      for (const next of edges.get(id) ?? []) {
        const count = (incoming.get(next) ?? 0) - 1;
        incoming.set(next, count);
        if (count === 0) queue.push(next);
      }
    }
    if (result.length !== plugins.length) throw new Error('Plugin dependency cycle detected');
    return result;
  }

  private async run(plugin: RouterPlusPlugin): Promise<void> {
    const disposers: (() => void)[] = [];
    const api = this.createApi((dispose) => disposers.push(dispose));
    try {
      const cleanup = await plugin.setup(api);
      const dispose = async () => {
        if (typeof cleanup === 'function') {
          try {
            await cleanup();
          } catch {
            // Cleanup failures must not block uninstalling the remaining plugins.
          }
        }
        for (const release of disposers.reverse()) {
          try {
            release();
          } catch {
            // A single failed release must not leave the registry inconsistent.
          }
        }
      };
      this.installed.set(plugin.id, { plugin, dispose });
      this.order.push(plugin.id);
    } catch (error) {
      for (const release of disposers.reverse()) {
        try {
          release();
        } catch {
          // Ignore rollback failures; the setup error is the primary result.
        }
      }
      throw error;
    }
  }

  async installMany(plugins: readonly RouterPlusPlugin[]): Promise<void> {
    for (const plugin of plugins) {
      if (this.installed.has(plugin.id)) throw new Error(`Plugin already installed: ${plugin.id}`);
    }
    const ordered = this.sort(plugins);
    this.installing = true;
    try {
      for (const plugin of ordered) await this.run(plugin);
    } catch (error) {
      await this.disposeAll();
      throw error;
    } finally {
      this.installing = false;
    }
  }

  async install(plugin: RouterPlusPlugin): Promise<void> {
    if (this.installed.has(plugin.id)) throw new Error(`Plugin already installed: ${plugin.id}`);
    for (const required of plugin.requires ?? []) {
      if (!this.installed.has(required))
        throw new Error(`Plugin dependency missing: ${plugin.id} -> ${required}`);
    }
    for (const target of plugin.before ?? []) {
      if (this.installed.has(target))
        throw new Error(`Cannot reorder plugin installed earlier: ${plugin.id} -> ${target}`);
    }
    this.installing = true;
    try {
      await this.run(plugin);
    } finally {
      this.installing = false;
    }
  }

  private dependentsOf(id: string): string[] {
    return [...this.installed.values()]
      .filter((entry) => entry.plugin.requires?.includes(id))
      .map((entry) => entry.plugin.id);
  }

  async uninstall(id: string, cascade = false): Promise<void> {
    const entry = this.installed.get(id);
    if (!entry) throw new Error(`Plugin not installed: ${id}`);
    const dependents = this.dependentsOf(id);
    if (dependents.length > 0 && !cascade) {
      throw new Error(`Plugin is required by: ${dependents.join(', ')}`);
    }
    if (cascade) {
      for (const dependent of dependents.reverse()) await this.uninstall(dependent, true);
    }
    await entry.dispose();
    this.installed.delete(id);
    const index = this.order.lastIndexOf(id);
    if (index >= 0) this.order.splice(index, 1);
  }

  async disposeAll(): Promise<void> {
    for (const id of [...this.order].reverse()) {
      await this.installed.get(id)?.dispose();
    }
    this.installed.clear();
    this.order.length = 0;
  }
}
