import type { SignatureParams, GeneratedHeaders } from '../types/api';

/* Convert PEM string to ArrayBuffer for Web Crypto API */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN[\s\S]*?-----/, '')
    .replace(/-----END[\s\S]*?-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/* SHA-512 hash of body -> "sha-512=:<base64>:" */
async function computeContentDigest(bodyJson: string): Promise<string> {
  const data = new TextEncoder().encode(bodyJson);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return `sha-512=:${hashBase64}:`;
}

/* Import PEM private key for signing */
async function importPrivateKey(pem: string, alg: SignatureParams['alg']): Promise<CryptoKey> {
  const keyData = pemToArrayBuffer(pem);

  if (alg === 'ed25519') {
    return crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'Ed25519' },
      false,
      ['sign'],
    );
  } else {
    return crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSA-PSS', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  }
}

/* Build the signature params value */
function buildSignatureParamsValue(sig: SignatureParams, keyid: string): string {
  return `("@method" "@target-uri" "content-digest");alg="${sig.alg}";created=${sig.created};expires=${sig.expires};keyid="${keyid}";nonce="${sig.nonce}"`;
}

/* Build the signature base string (what gets signed) */
function buildSignatureBase(
  targetUri: string,
  contentDigest: string,
  signatureParamsValue: string,
): string {
  return [
    `"@method": POST`,
    `"@target-uri": ${targetUri}`,
    `"content-digest": ${contentDigest}`,
    `"@signature-params": ${signatureParamsValue}`,
  ].join('\n');
}

/* Main function: compute all headers */
export async function buildHeaders(
  sig: SignatureParams,
  keyid: string,
  targetUri: string,
  bodyJson: string,
): Promise<GeneratedHeaders> {
  const contentDigest = await computeContentDigest(bodyJson);
  const signatureParamsValue = buildSignatureParamsValue(sig, keyid);
  const signatureBase = buildSignatureBase(targetUri, contentDigest, signatureParamsValue);

  const key = await importPrivateKey(sig.privateKey, sig.alg);

  const algorithm = sig.alg === 'ed25519'
    ? 'Ed25519'
    : { name: 'RSA-PSS', saltLength: 32 };
  const signatureBuffer = await crypto.subtle.sign(
    algorithm,
    key,
    new TextEncoder().encode(signatureBase),
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return {
    'Content-Type': 'application/vnd.api+json',
    'Accept': 'application/vnd.api+json',
    'Content-Digest': contentDigest,
    'Signature-Input': `sig1=${signatureParamsValue}`,
    'Signature': `sig1=:${signatureBase64}:`,
  };
}

/* Generate a random nonce */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .slice(0, 128);
}

/* Current Unix timestamp in seconds */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
