// Demo-only artificial latency for stakeholder walkthroughs.
// Remove this helper once saves are backed by real API timing.
export const DEMO_SAVE_DELAY_MS = 2500;

export function waitForDemoSaveDelay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, DEMO_SAVE_DELAY_MS);
  });
}

export async function runWithDemoSaveDelay<T>(action: () => Promise<T> | T): Promise<T> {
  const [result] = await Promise.all([
    Promise.resolve(action()),
    waitForDemoSaveDelay(),
  ]);

  return result;
}