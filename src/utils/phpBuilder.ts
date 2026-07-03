/* Build a PHP script */
export function buildPhp(
    url: string,
    client: string,
    bodyJson: string,
): string {
    const escapedBody = bodyJson
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");

    return `<?php

// Parameters
$url = '${url}';
$client = '${client}';
$privateKey = "YOUR_PRIVATE_KEY"; // Paste your PEM private key here

// Request Body
$body = '${escapedBody}';

// Calculate Content-Digest (SHA-512)
$hash = hash('sha512', $body, true);
$contentDigest = 'sha-512=:' . base64_encode($hash) . ':';

// Generate signature parameters
$created = time();
$expires = $created + 300;
$nonce = bin2hex(random_bytes(16));

$sigParamsVal = '("@method" "@target-uri" "content-digest");alg="ed25519";created=' . $created . ';expires=' . $expires . ';keyid="' . $client . '";nonce="' . $nonce . '"';

// Assemble Signature Base String
$sigBase = "\\"@method\\": POST\\n" .
           "\\"@target-uri\\": " . $url . "\\n" .
           "\\"content-digest\\": " . $contentDigest . "\\n" .
           "\\"@signature-params\\": " . $sigParamsVal;

// Sign using Sodium extension (Ed25519)
$pkey = openssl_pkey_get_private($privateKey);
if ($pkey === false) {
    die("Invalid PEM private key format\\n");
}
$details = openssl_pkey_get_details($pkey);
if ($details === false || !isset($details['ed25519']['priv'])) {
    die("Failed to extract Ed25519 private key seed\\n");
}
$rawSeed = $details['ed25519']['priv'];

// In Sodium, a signing key is generated from the 32-byte seed
$keyPair = sodium_crypto_sign_seed_keypair($rawSeed);
$secretKey = sodium_crypto_sign_secretkey($keyPair);

$signature = sodium_crypto_sign_detached($sigBase, $secretKey);
$signatureBase64 = base64_encode($signature);

// Send request
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => [
            'Content-Type: application/vnd.api+json',
            'Accept: application/vnd.api+json',
            'Content-Digest: ' . $contentDigest,
            'Signature-Input: sig1=' . $sigParamsVal,
            'Signature: sig1=:' . $signatureBase64 . ':',
        ],
        'content' => $body,
        'ignore_errors' => true,
    ],
];

$context = stream_context_create($options);
$response = file_get_contents($url, false, $context);

if ($response === false) {
    echo "Request failed\\n";
} else {
    echo $response;
}
`;
}
