/* Build a Python script */
export function buildPython(
    url: string,
    client: string,
    bodyJson: string,
): string {
    const escapedBody = bodyJson.replace(/\\/g, '\\\\').replace(/"{3}/g, '\\"\\"\\"');

    return `import time
import secrets
import base64
import hashlib
import requests
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# Parameters
URL = "${url}"
CLIENT = "${client}"
PRIVATE_KEY = """YOUR_PRIVATE_KEY""" # Paste your PEM private key here

# Request Body
BODY = """${escapedBody}"""

# Calculate Content-Digest (SHA-512)
body_bytes = BODY.encode("utf-8")
digest_hash = hashlib.sha512(body_bytes).digest()
content_digest = "sha-512=:" + base64.b64encode(digest_hash).decode("utf-8") + ":"

# Generate signature parameters
created = int(time.time())
expires = created + 300
nonce = secrets.token_hex(16)

sig_params_val = f'("@method" "@target-uri" "content-digest");alg="ed25519";created={created};expires={expires};keyid="{CLIENT}";nonce="{nonce}"'

# Assemble Signature Base String
sig_base = (
    f'"@method": POST\\n'
    f'"@target-uri": {URL}\\n'
    f'"content-digest": {content_digest}\\n'
    f'"@signature-params": {sig_params_val}'
)

# Sign using cryptography library (Ed25519)
try:
    # Load private key from PEM
    private_key_obj = serialization.load_pem_private_key(
        PRIVATE_KEY.encode("utf-8"),
        password=None
    )
    
    # Sign
    sig_bytes = private_key_obj.sign(sig_base.encode("utf-8"))
    signature_base64 = base64_encode = base64.b64encode(sig_bytes).decode("utf-8")
except Exception as e:
    print("Failed to load key or sign:", e)
    exit(1)

# Send request
headers = {
    "Content-Type": "application/vnd.api+json",
    "Accept": "application/vnd.api+json",
    "Content-Digest": content_digest,
    "Signature-Input": f"sig1={sig_params_val}",
    "Signature": f"sig1=:{signature_base64}:"
}

try:
    response = requests.post(URL, data=BODY, headers=headers)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Request failed:", e)
`;
}
