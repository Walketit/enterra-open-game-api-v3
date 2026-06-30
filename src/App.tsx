import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box, Typography, Paper, Divider, Alert } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import UrlParamsForm from './components/UrlParamsForm';
import RequestBodyForm from './components/RequestBodyForm';
import SignatureForm from './components/SignatureForm';
import { buildUrl } from './utils/urlBuilder';
import { buildRequestBody } from './utils/requestBodyBuilder';
import { buildHeaders, generateNonce, nowSeconds } from './utils/signatureBuilder';
import { buildCurl } from './utils/curlBuilder';
import { buildPhp } from './utils/phpBuilder';
import { buildPython } from './utils/pythonBuilder';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Tabs, Tab, Tooltip, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
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
  /* State management */
  const [urlParams, setUrlParams] = useState<UrlParams>(DEFAULT_URL_PARAMS);
  const [session, setSession] = useState<SessionParams>(DEFAULT_SESSION);
  const [player, setPlayer] = useState<PlayerParams>(DEFAULT_PLAYER);
  const [sigParams, setSigParams] = useState<SignatureParams>(makeDefaultSignature);

  const [headers, setHeaders] = useState<GeneratedHeaders | null>(null);
  const [sigError, setSigError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'curl' | 'php' | 'python' | 'link'>('curl');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* Request data construction */
  const generatedUrl = buildUrl(urlParams);
  const requestBody = buildRequestBody(session, player);
  const bodyJson = JSON.stringify(requestBody, null, 2);

  /* Compute ed25519 HTTP signature */
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

  /* UI layout */
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
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Generated requests - curl, php, python, or link */}
              <Tabs
                value={activeTab}
                onChange={(_, newValue: 'curl' | 'php' | 'python' | 'link') => setActiveTab(newValue)}
              >
                <Tab label="cURL" value="curl" sx={{ textTransform: 'none' }} />
                <Tab label="PHP" value="php" sx={{ textTransform: 'none' }} />
                <Tab label="Python" value="python" sx={{ textTransform: 'none' }} />
                <Tab label="Link" value="link" sx={{ textTransform: 'none' }} />
              </Tabs>
              {headers && generatedUrl && (
                <Tooltip title={copiedId === activeTab ? 'Copied!' : 'Copy to clipboard'}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      let text = '';
                      if (activeTab === 'curl') text = buildCurl(generatedUrl, headers, bodyJson);
                      else if (activeTab === 'php') text = buildPhp(generatedUrl, urlParams.client, bodyJson);
                      else if (activeTab === 'python') text = buildPython(generatedUrl, urlParams.client, bodyJson);
                      else if (activeTab === 'link') text = generatedUrl;
                      handleCopy(text, activeTab);
                    }}
                  >
                    {copiedId === activeTab ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            {headers && generatedUrl ? (
              <Box sx={{ mt: 1 }}>
                {activeTab !== 'link' ? (
                  <SyntaxHighlighter
                    language={activeTab === 'curl' ? 'bash' : activeTab === 'php' ? 'php' : 'python'}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderRadius: '4px',
                      fontSize: '16px',
                      padding: '16px',
                      background: '#00000000',
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
                      : activeTab === 'php'
                        ? buildPhp(generatedUrl, urlParams.client, bodyJson)
                        : buildPython(generatedUrl, urlParams.client, bodyJson)}
                  </SyntaxHighlighter>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity="warning" sx={{ borderRadius: '4px', fontSize: '16px', }}>
                      URL itself is not a complete request. To execute, headers and body are also required.
                    </Alert>
                    <Box
                      sx={{
                        background: '#000000',
                        p: 2,
                        borderRadius: '4px',
                        wordBreak: 'break-all',
                        fontSize: '16px',
                        color: '#ffffffff',
                      }}
                    >
                      {generatedUrl}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                Please fill in URL and signature parameters to generate the example
              </Typography>
            )}
          </Paper>

          {/* URL */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Generated URL
              </Typography>
              {generatedUrl && (
                <Tooltip title={copiedId === 'plain-url' ? 'Copied!' : 'Copy URL'}>
                  <IconButton size="small" onClick={() => handleCopy(generatedUrl, 'plain-url')}>
                    {copiedId === 'plain-url' ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Request Body (JSON)
              </Typography>
              <Tooltip title={copiedId === 'plain-body' ? 'Copied!' : 'Copy JSON Body'}>
                <IconButton size="small" onClick={() => handleCopy(bodyJson, 'plain-body')}>
                  {copiedId === 'plain-body' ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
            <Typography
              component="pre"
              sx={{ fontSize: '16px', whiteSpace: 'pre-wrap', mt: 1 }}
            >
              {bodyJson}
            </Typography>
          </Paper>

          {/* Headers */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                HTTP Headers
              </Typography>
              {headers && (
                <Tooltip title={copiedId === 'all-headers' ? 'Copied!' : 'Copy All Headers'}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const allText = Object.entries(headers)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('\n');
                      handleCopy(allText, 'all-headers');
                    }}
                  >
                    {copiedId === 'all-headers' ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {sigError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {sigError}
              </Typography>
            )}

            {headers ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                {Object.entries(headers).map(([k, v]) => {
                  const keyLower = k.toLowerCase();
                  const isTargetHeader = ['signature-input', 'signature', 'content-digest'].includes(keyLower);
                  return (
                    <Box
                      key={k}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #4d4d4dff',
                        pb: 1,
                        '&:last-child': { borderBottom: 'none', pb: 0 }
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: '16px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          pr: 2,
                        }}
                      >
                        <strong>{k}:</strong> {v}
                      </Box>
                      {isTargetHeader && (
                        <Tooltip title={copiedId === k ? 'Copied!' : `Copy ${k}`}>
                          <IconButton size="small" onClick={() => handleCopy(v, k)}>
                            {copiedId === k ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
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
