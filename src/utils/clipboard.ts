import clipboard from "clipboardy";

export async function readClipboard(): Promise<string> {
  return clipboard.read();
}

export async function writeClipboard(content: string): Promise<void> {
  await clipboard.write(content);
}
