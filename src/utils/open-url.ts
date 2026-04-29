import open from "open";

// Thin wrapper around the `open` package so the rest of the code can stub it
// in tests and so callers don't have to depend on `open` directly.
export async function openUrl(url: string): Promise<void> {
  await open(url);
}
