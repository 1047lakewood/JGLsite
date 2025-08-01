const verbose = import.meta.env.DEV || import.meta.env.VITE_VERBOSE_LOGGING === 'true';

export const log = (...args: unknown[]) => {
  if (verbose) console.log(...args);
};

export const warn = (...args: unknown[]) => {
  if (verbose) console.warn(...args);
};

export const error = (...args: unknown[]) => {
  if (verbose) console.error(...args);
};
