import { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Container, Typography, Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import { createTheme } from '@mui/material/styles';
import UrlParamsForm from './components/UrlParamsForm';
import type { UrlParams } from './types/api';
import { buildUrl } from './utils/urlBuilder';

const theme = createTheme({ palette: { mode: 'dark' } });

const DEFAULT_PARAMS: UrlParams = {
  baseUrl: '',
  gameId: '0',
  client: '',
  language: 'en',
};

function App() {
  const [urlParams, setUrlParams] = useState<UrlParams>(DEFAULT_PARAMS);
  const generatedUrl = buildUrl(urlParams);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Left — parameters */}
          <Grid size={{ xs: 12, md: 6 }}>
            <UrlParamsForm params={urlParams} onChange={setUrlParams} />
          </Grid>

          {/* Right — generated URL */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Сформированный URL
              </Typography>
              {generatedUrl ? (
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    mt: 1,
                  }}
                >
                  {generatedUrl}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                  Заполните обязательные поля слева
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
