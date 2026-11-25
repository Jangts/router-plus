/** Per-fixture cleanup, including partial initialization failures. */
export function createCleanup() {
  const releases: Array<() => unknown> = [];
  let pending: Promise<void> | undefined;
  return {
    add(release: () => unknown) {
      releases.push(release);
    },
    dispose(): Promise<void> {
      return (pending ??= (async () => {
        const errors: unknown[] = [];
        for (const release of releases.reverse()) {
          try {
            await release();
          } catch (error) {
            errors.push(error);
          }
        }
        if (errors.length) throw new AggregateError(errors, 'Test fixture cleanup failed');
      })());
    },
    async fail(error: unknown): Promise<never> {
      try {
        await this.dispose();
      } catch (cleanup) {
        throw new AggregateError([error, cleanup], 'Test fixture initialization failed');
      }
      throw error;
    },
  };
}
