type ConsoleMethod = "log" | "warn" | "error" | "info";

/**
 * Captures calls to a console method during the callback. Works in both LLRT and Node
 * (since we can't use jest.spyOn with the LLRT test runner).
 */
export const captureConsole = async (method: ConsoleMethod, fn: () => void | Promise<void>) => {
  const captured: string[] = [];
  const original = console[method];
  console[method] = (...args: unknown[]) => captured.push(args.map(String).join(" "));
  try {
    await fn();
  } finally {
    console[method] = original;
  }
  return captured;
};
