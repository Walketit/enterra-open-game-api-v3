import { Box, TextField, Typography, MenuItem, Button } from '@mui/material';
import type { SignatureParams } from '../types/api';
import { generateNonce, nowSeconds } from '../utils/signatureBuilder';

interface SignatureFormProps {
  params: SignatureParams;
  onChange: (p: SignatureParams) => void;
}

const ALG_OPTIONS = [
  { value: 'ed25519', label: 'ed25519' },
];

export default function SignatureForm({ params, onChange }: SignatureFormProps) {
  const handle = (field: keyof SignatureParams) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...params, [field]: e.target.value });
    };

  const handleNumber = (field: 'created' | 'expires') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = parseInt(e.target.value, 10);
      if (!isNaN(n)) onChange({ ...params, [field]: n });
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
      ? 'expires должен быть больше created'
      : params.expires - params.created > 300
        ? 'expires − created не должен превышать 300 секунд'
        : '';

  const nonceError = params.nonce.length > 128 ? 'Максимум 128 символов' : '';

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
        onChange={handleNumber('created')}
        size="small"
        fullWidth
        type="number"
        helperText="Unix timestamp (секунды)"
      />

      <TextField
        label="expires *"
        value={params.expires}
        onChange={handleNumber('expires')}
        size="small"
        fullWidth
        type="number"
        error={!!createdExpiresError}
        helperText={createdExpiresError || 'Unix timestamp (секунды), max +300 от created'}
      />

      <TextField
        label="nonce *"
        value={params.nonce}
        onChange={handle('nonce')}
        size="small"
        fullWidth
        error={!!nonceError}
        helperText={nonceError || `${params.nonce.length}/128 символов`}
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
        helperText="PEM-ключ. Не сохраняется."
      />
    </Box>
  );
}
