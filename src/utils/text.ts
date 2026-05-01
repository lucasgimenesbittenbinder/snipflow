export type TruncatedSnippet = {
  lines: string[];
  truncated: boolean;
};

type TruncateSnippetOptions = {
  maxLineLength?: number;
  maxLines?: number;
};

export function previewContent(content: string): string {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > 80 ? `${compact.slice(0, 77)}...` : compact;
}

function truncateLine(line: string, maxLineLength: number): string {
  const normalized = line.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLineLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(maxLineLength - 3, 0))}...`;
}

export function truncateSnippet(
  content: string,
  options: TruncateSnippetOptions = {}
): TruncatedSnippet {
  const maxLines = options.maxLines ?? 5;
  const maxLineLength = options.maxLineLength ?? 88;
  const lines = content.split(/\r?\n/);

  return {
    lines: lines.slice(0, maxLines).map((line) => truncateLine(line, maxLineLength)),
    truncated: lines.length > maxLines
  };
}

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}
