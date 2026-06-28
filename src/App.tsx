import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { createTheme } from '@mui/material/styles';
import UrlParamsForm from './components/UrlParamsForm';
import RequestBodyForm from './components/RequestBodyForm';
import SignatureForm from './components/SignatureForm';
import { buildUrl } from './utils/urlBuilder';
import { buildRequestBody } from './utils/requestBodyBuilder';
import { buildHeaders, generateNonce, nowSeconds } from './utils/signatureBuilder';
import type {
  UrlParams,
  SessionParams,
  PlayerParams,
  SignatureParams,
  GeneratedHeaders,
} from './types/api';


const theme = createTheme({ palette: { mode: 'dark' } });

const DEFAULT_URL_PARAMS: UrlParams = {
  baseUrl: '',
  gameId: '0',
  client: '',
  language: 'en',
};

const DEFAULT_SESSION: SessionParams = {
  currencyIso: '',
  id: '',
  longLifeLoginToken: '',
  launchUrlQueryParams: '',
};

const DEFAULT_PLAYER: PlayerParams = {
  id: '',
  nick: '',
  name: '',
  email: '',
  phoneNumber: '',
  city: '',
  address: '',
  zip: '',
  state: '',
  countryIso: '',
  preferredCurrencyIso: '',
  referralCode: '',
  bonusCode: '',
  tag: '',
  active: '',
  verified: '',
  trustedLevel: '',
  avatar: '',
  redeemCode: '',
};

function makeDefaultSignature(): SignatureParams {
  const created = nowSeconds();
  return {
    alg: 'ed25519',
    created,
    expires: created + 300,
    nonce: generateNonce(),
    privateKey: '',
  };
}

function App() {
  const [urlParams, setUrlParams] = useState<UrlParams>(DEFAULT_URL_PARAMS);
  const [session, setSession] = useState<SessionParams>(DEFAULT_SESSION);
  const [player, setPlayer] = useState<PlayerParams>(DEFAULT_PLAYER);
  const [sigParams, setSigParams] = useState<SignatureParams>(makeDefaultSignature);

  const [headers, setHeaders] = useState<GeneratedHeaders | null>(null);
  const [sigError, setSigError] = useState<string>('');

  const generatedUrl = buildUrl(urlParams);
  const requestBody = buildRequestBody(session, player);
  const bodyJson = JSON.stringify(requestBody, null, 2);

  useEffect(() => {
    if (!sigParams.privateKey || !generatedUrl) {
      setHeaders(null);
      setSigError('');
      return;
    }

    buildHeaders(sigParams, urlParams.client, generatedUrl, bodyJson)
      .then((h) => {
        setHeaders(h);
        setSigError('');
      })
      .catch((e: unknown) => {
        setHeaders(null);
        setSigError(e instanceof Error ? e.message : 'Ошибка генерации подписи');
      });
  }, [sigParams, urlParams.client, generatedUrl, bodyJson]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left side — all input forms */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <UrlParamsForm params={urlParams} onChange={setUrlParams} />
              <Divider />
              <RequestBodyForm
                session={session}
                player={player}
                onSessionChange={setSession}
                onPlayerChange={setPlayer}
              />
              <Divider />
              <SignatureForm params={sigParams} onChange={setSigParams} />
            </Box>
          </Grid>

          {/* Right side — generated output */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                maxHeight: '100vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                position: 'sticky',
                top: 24,
              }}
            >
              {/* URL */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Сформированный URL
                </Typography>
                {generatedUrl ? (
                  <Typography
                    component="pre"
                    sx={{
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
                    Заполните обязательные поля (baseUrl, gameId, client)
                  </Typography>
                )}
              </Paper>

              {/* Request Body */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Request Body (JSON)
                </Typography>
                <Typography
                  component="pre"
                  sx={{ fontSize: '16px', whiteSpace: 'pre-wrap', mt: 1 }}
                >
                  {bodyJson}
                </Typography>
              </Paper>

              {/* Headers */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  HTTP Headers
                </Typography>

                {sigError && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {sigError}
                  </Typography>
                )}

                {headers ? (
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '16px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      overflowX: 'hidden',
                      mt: 1,
                    }}
                  >
                    {Object.entries(headers)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\n')}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    {sigParams.privateKey
                      ? 'Заполните URL для генерации заголовков'
                      : 'Введите приватный ключ для генерации заголовков'}
                  </Typography>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
