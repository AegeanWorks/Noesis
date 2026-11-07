export interface StartOptions {
  open: boolean;
  check: boolean;
  help: boolean;
  port: number | null;
  host: string | null;
}

export function parseStartArgs(argv: string[]): StartOptions;
export function nodeVersionOk(version: string): boolean;
export function hasDependencies(root?: string): boolean;
