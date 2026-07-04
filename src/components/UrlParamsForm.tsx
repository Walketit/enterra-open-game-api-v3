import { memo } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import type { UrlParams } from '../types/api';

interface UrlParamsFormProps {
  params: UrlParams;
  onChange: (params: UrlParams) => void;
}

const UrlParamsForm = memo(function UrlParamsForm({ params, onChange }: UrlParamsFormProps) {

  const handleChange =
    (field: keyof UrlParams) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...params, [field]: e.target.value });
      };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" color="text.secondary">
        URL Parameters
      </Typography>

      <TextField
        label="Base URL *"
        placeholder="https://api.example.com"
        value={params.baseUrl}
        onChange={handleChange('baseUrl')}
        fullWidth
        size="small"
        error={!params.baseUrl.trim()}
        helperText={!params.baseUrl.trim() ? "Base URL is required" : ""}
      />

      <TextField
        label="Game ID *"
        placeholder="0"
        value={params.gameId}
        onChange={handleChange('gameId')}
        fullWidth
        size="small"
        error={!params.gameId.trim()}
        helperText={!params.gameId.trim() ? "Game ID is required" : ""}
      />

      <TextField
        label="Client *"
        placeholder="desktop"
        value={params.client}
        onChange={handleChange('client')}
        fullWidth
        size="small"
        error={!params.client.trim()}
        helperText={!params.client.trim() ? "Client name is required" : ""}
      />

      <TextField
        label="Language"
        placeholder="en"
        value={params.language}
        onChange={handleChange('language')}
        fullWidth
        size="small"
        error={params.language.trim() !== '' && !/^[a-zA-Z]{2}$/.test(params.language.trim())}
        helperText={params.language.trim() !== '' && !/^[a-zA-Z]{2}$/.test(params.language.trim()) ? "Must be a 2-letter ISO language code (e.g. en)" : "(optional, default: en)"}
      />
    </Box>
  );
});

export default UrlParamsForm;
