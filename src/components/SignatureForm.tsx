import { useState, useEffect, memo } from 'react';
import { Box, TextField, Typography, MenuItem, Button } from '@mui/material';
import type { SignatureParams } from '../types/api';
import { generateNonce, nowSeconds } from '../utils/signatureBuilder';

interface SignatureFormProps {
  params: SignatureParams;
  onChange: (p: SignatureParams) => void;
  keyError?: string;
}

const ALG_OPTIONS = [
  { value: 'ed25519', label: 'ed25519' },
];

const SignatureForm = memo(function SignatureForm({ params, onChange, keyError }: SignatureFormProps) {
  /* Timer to check signature expiration in real time */
  const [currentTime, setCurrentTime] = useState(nowSeconds());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(nowSeconds());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handle = (field: keyof SignatureParams) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...params, [field]: e.target.value });
    };

  /* Update 'nonce', 'created' and 'expires' all at once */
  const regenerate = () => {
    const created = nowSeconds();
    onChange({
      ...params,
      created,
      expires: created + 300,
      nonce: generateNonce(),
    });
  };

  const createdExpiresError =
    params.expires <= params.created
      ? 'expires must be greater than created'
      : params.expires - params.created > 300
        ? 'expires − created must not exceed 300 seconds'
        : '';

  const isExpired = currentTime > params.expires;
  const nonceError = params.nonce.length > 128 ? 'Maximum 128 characters' : '';

  const isPrivateKeyEmpty = !params.privateKey.trim();
  const hasKeyError = !isPrivateKeyEmpty && !!keyError;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="text.secondary">
          Signature
        </Typography>
        <Button variant="outlined" size="small" onClick={regenerate}>
          Regenerate
        </Button>
      </Box>

      <TextField
        select
        label="alg *"
        value={params.alg}
        onChange={handle('alg')}
        size="small"
        fullWidth
        error={!params.alg.trim()}
        helperText={!params.alg.trim() ? "Signature algorithm is required" : ""}
      >
        {ALG_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="created *"
        value={params.created}
        size="small"
        fullWidth
        type="number"
        disabled
        error={!params.created || isNaN(params.created) || isExpired}
        helperText={(!params.created || isNaN(params.created)) ? "Created timestamp is required" : isExpired ? "Signature has expired" : "Generated automatically"}
      />

      <TextField
        label="expires *"
        value={params.expires}
        size="small"
        fullWidth
        type="number"
        disabled
        error={(!params.expires || isNaN(params.expires)) || !!createdExpiresError || isExpired}
        helperText={(!params.expires || isNaN(params.expires)) ? "Expires timestamp is required" : isExpired ? "Expired! Click Regenerate to refresh" : "Generated automatically (created + 300s)"}
      />

      <TextField
        label="nonce *"
        value={params.nonce}
        size="small"
        fullWidth
        disabled
        error={!params.nonce.trim() || !!nonceError}
        helperText={!params.nonce.trim() ? "Nonce token is required" : `Generated automatically (${params.nonce.length}/128 chars)`}
      />

      <TextField
        label="privateKey *"
        placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
        value={params.privateKey}
        onChange={handle('privateKey')}
        size="small"
        fullWidth
        multiline
        minRows={4}
        error={isPrivateKeyEmpty || hasKeyError}
        helperText={
          isPrivateKeyEmpty
            ? "Private key PEM is required to sign requests"
            : hasKeyError
              ? `Key Format Error: ${keyError}`
              : "Paste your PEM private key here"
        }
      />
    </Box>
  );
});

export default SignatureForm;
