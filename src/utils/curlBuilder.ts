import type { GeneratedHeaders } from '../types/api';

/* Build a cURL from URL, headers, and request body */
export function buildCurl(
  url: string,
  headers: GeneratedHeaders,
  bodyJson: string,
): string {
  const headerLines = Object.entries(headers)
    .map(([k, v]) => `  -H '${k}: ${v}'`)
    .join(' \\\n');

  const escapedBody = bodyJson.replace(/'/g, "'\\''");

  return `curl -X POST '${url}' \\\n${headerLines} \\\n  -d '${escapedBody}'`;
}
