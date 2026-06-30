import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import UrlParamsForm from './components/UrlParamsForm';
import RequestBodyForm from './components/RequestBodyForm';
import SignatureForm from './components/SignatureForm';
import { buildUrl } from './utils/urlBuilder';
import { buildRequestBody } from './utils/requestBodyBuilder';
import { buildHeaders, generateNonce, nowSeconds } from './utils/signatureBuilder';
import { buildCurl } from './utils/curlBuilder';
import { buildPhp } from './utils/phpBuilder';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tabs, Tab } from '@mui/material';
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
  const [activeTab, setActiveTab] = useState<'curl' | 'php'>('curl');

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
        setSigError(e instanceof Error ? e.message : 'Signature generation error');
      });
  }, [sigParams, urlParams.client, generatedUrl, bodyJson]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>

        {/* Left side — all input forms */}
        <Box sx={{
          width: '30%',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          p: 3,
        }}>
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
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Right side — generated output */}
        <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              {/* Tabs - curl or php currently */}
              <Tabs
                value={activeTab}
                onChange={(_, newValue: 'curl' | 'php') => setActiveTab(newValue)}
              >
                <Tab label="cURL" value="curl" sx={{ textTransform: 'none' }} />
                <Tab label="PHP" value="php" sx={{ textTransform: 'none' }} />
              </Tabs>
            </Box>
            {headers && generatedUrl ? (
              <Box sx={{ mt: 1 }}>
                <SyntaxHighlighter
                  language={activeTab === 'curl' ? 'bash' : 'php'}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    borderRadius: '4px',
                    fontSize: '13px',
                    padding: '16px',
                    background: '#1e1e1e',
                  }}
                  wrapLongLines
                  codeTagProps={{
                    style: {
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    },
                  }}
                >
                  {activeTab === 'curl'
                    ? buildCurl(generatedUrl, headers, bodyJson)
                    : buildPhp(generatedUrl, urlParams.client, bodyJson)}
                </SyntaxHighlighter>
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                Please fill in URL and signature parameters to generate the example
              </Typography>
            )}
          </Paper>

          {/* URL */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Generated URL
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
                Please fill in required fields (baseUrl, gameId, client)
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
                  ? 'Fill in URL to generate headers'
                  : 'Enter private key to generate headers'}
              </Typography>
            )}
          </Paper>
        </Box>

      </Box>
    </ThemeProvider>
  );
}

export default App;
