import { Box, TextField, Typography } from '@mui/material';
import type { UrlParams } from '../types/api';

interface UrlParamsFormProps {
  params: UrlParams;
  onChange: (params: UrlParams) => void;
}

export default function UrlParamsForm({ params, onChange }: UrlParamsFormProps) {

  const handleChange =
    (field: keyof UrlParams) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...params, [field]: e.target.value });
      };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" color="text.secondary">
        URL параметры
      </Typography>

      <TextField
        label="Base URL *"
        placeholder="https://api.example.com"
        value={params.baseUrl}
        onChange={handleChange('baseUrl')}
        fullWidth
        size="small"
      />

      <TextField
        label="Game ID *"
        placeholder="0"
        value={params.gameId}
        onChange={handleChange('gameId')}
        fullWidth
        size="small"
      />

      <TextField
        label="Client *"
        placeholder="desktop"
        value={params.client}
        onChange={handleChange('client')}
        fullWidth
        size="small"
      />

      <TextField
        label="Language"
        placeholder="en"
        value={params.language}
        onChange={handleChange('language')}
        fullWidth
        size="small"
        helperText="(необязательно, по умолчанию: en)"
      />
    </Box>
  );
}
