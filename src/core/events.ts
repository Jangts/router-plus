/**
 * Minimal typed event bus.
 */
import type { RouterEvent } from './types.js';

export class EventBus {
  private readonly listeners = new Set<(event: RouterEvent) => void>();

  subscribe(listener: (event: RouterEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: RouterEvent): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch {
        // A failing subscriber must not break navigation or interaction state.
      }
    }
  }
}
