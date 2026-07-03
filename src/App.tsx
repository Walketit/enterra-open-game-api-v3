import { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import UrlParamsForm from './components/UrlParamsForm';
import RequestBodyForm from './components/RequestBodyForm';
import SignatureForm from './components/SignatureForm';
import GeneratedOutput from './components/GeneratedOutput';
import { buildUrl } from './utils/urlBuilder';
import { buildRequestBody } from './utils/requestBodyBuilder';
import { buildHeaders, nowSeconds } from './utils/signatureBuilder';
import type {
  UrlParams,
  SessionParams,
  PlayerParams,
  SignatureParams,
  GeneratedHeaders,
} from './types/api';
import {
  DEFAULT_URL_PARAMS,
  DEFAULT_SESSION,
  DEFAULT_PLAYER,
  makeDefaultSignature,
  loadSavedConfig,
} from './utils/defaults';
import { getValidationErrors } from './utils/validation';

const theme = createTheme({ palette: { mode: 'dark' } });

function App() {
  /* State management */
  const savedConfig = loadSavedConfig();

  const [urlParams, setUrlParams] = useState<UrlParams>(savedConfig?.urlParams || DEFAULT_URL_PARAMS);
  const [session, setSession] = useState<SessionParams>(savedConfig?.session || DEFAULT_SESSION);
  const [player, setPlayer] = useState<PlayerParams>(savedConfig?.player || DEFAULT_PLAYER);
  const [sigParams, setSigParams] = useState<SignatureParams>(() => {
    const defaultSig = makeDefaultSignature();
    if (savedConfig?.sigParams) {
      return {
        ...defaultSig,
        alg: savedConfig.sigParams.alg || defaultSig.alg,
        created: savedConfig.sigParams.created || defaultSig.created,
        expires: savedConfig.sigParams.expires || defaultSig.expires,
        nonce: savedConfig.sigParams.nonce || defaultSig.nonce,
      };
    }
    return defaultSig;
  });

  const [signedData, setSignedData] = useState<{
    bodyJson: string;
    headers: GeneratedHeaders;
  } | null>(null);
  const [sigError, setSigError] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(nowSeconds());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(nowSeconds());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  /* Export current config as a JSON file, excluding private key */
  const handleExport = async () => {
    const config = {
      urlParams,
      session,
      player,
      sigParams: {
        alg: sigParams.alg,
        created: sigParams.created,
        expires: sigParams.expires,
        nonce: sigParams.nonce,
      }
    };
    const jsonString = JSON.stringify(config, null, 2);

    if ('showSaveFilePicker' in window) {
      try {
        const options = {
          suggestedName: 'custom_api_config.json',
          types: [{
            description: 'JSON Configuration File',
            accept: {
              'application/json': ['.json'],
            },
          }],
        };
        const handle = await (window as any).showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.warn('Native file picker failed/unsupported, using fallback', err);
      }
    }

    /* Fallback method for unsupported browsers */
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "custom_api_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  /* Import config from a JSON file */
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content);

        /* Check if the parsed object contains at least one of config sections */
        const hasAtLeastOneSection = config && typeof config === 'object' &&
          ('urlParams' in config || 'session' in config || 'player' in config || 'sigParams' in config);

        if (!hasAtLeastOneSection) {
          alert('Invalid configuration file structure: missing application sections.');
          return;
        }

        /* Load URL parameters */
        if (config.urlParams && typeof config.urlParams === 'object') {
          setUrlParams(prev => ({
            baseUrl: typeof config.urlParams.baseUrl === 'string' ? config.urlParams.baseUrl : prev.baseUrl,
            gameId: typeof config.urlParams.gameId === 'string' ? config.urlParams.gameId : prev.gameId,
            client: typeof config.urlParams.client === 'string' ? config.urlParams.client : prev.client,
            language: typeof config.urlParams.language === 'string' ? config.urlParams.language : prev.language,
          }));
        }

        /* Load session parameters */
        if (config.session && typeof config.session === 'object') {
          setSession(config.session);
        }

        /* Load player parameters */
        if (config.player && typeof config.player === 'object') {
          setPlayer(config.player);
        }

        /* Load signature parameters */
        if (config.sigParams && typeof config.sigParams === 'object') {
          setSigParams(prev => ({
            ...prev,
            alg: typeof config.sigParams.alg === 'string' ? config.sigParams.alg : prev.alg,
            created: typeof config.sigParams.created === 'number' ? config.sigParams.created : prev.created,
            expires: typeof config.sigParams.expires === 'number' ? config.sigParams.expires : prev.expires,
            nonce: typeof config.sigParams.nonce === 'string' ? config.sigParams.nonce : prev.nonce,
          }));
        }
      } catch (err) {
        alert('Failed to parse configuration file: invalid JSON format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  /* Clear config, reset state and clear localStorage */
  const handleClear = () => {
    setUrlParams(DEFAULT_URL_PARAMS);
    setSession(DEFAULT_SESSION);
    setPlayer(DEFAULT_PLAYER);
    setSigParams(makeDefaultSignature());
    localStorage.removeItem('custom_config');
  };

  /* Autosave config to localStorage on change, excluding private key */
  useEffect(() => {
    const configToSave = {
      urlParams,
      session,
      player,
      sigParams: {
        alg: sigParams.alg,
        created: sigParams.created,
        expires: sigParams.expires,
        nonce: sigParams.nonce,
      }
    };
    localStorage.setItem('custom_config', JSON.stringify(configToSave));
  }, [urlParams, session, player, sigParams.alg, sigParams.created, sigParams.expires, sigParams.nonce]);

  const validationErrors = getValidationErrors(urlParams, session, player, sigParams, currentTime);
  const hasErrors = validationErrors.length > 0;

  /* Request data construction */
  const generatedUrl = buildUrl(urlParams);
  const requestBody = buildRequestBody(session, player);
  const bodyJson = JSON.stringify(requestBody, null, 2);

  /* Compute ed25519 HTTP signature */
  useEffect(() => {
    let active = true;

    if (!sigParams.privateKey || !generatedUrl) {
      setSignedData(null);
      setSigError('');
      return;
    }

    const bodyToSign = bodyJson;

    buildHeaders(sigParams, urlParams.client, generatedUrl, bodyToSign)
      .then((h) => {
        if (!active) return;
        setSignedData({ bodyJson: bodyToSign, headers: h });
        setSigError('');
      })
      .catch((e: unknown) => {
        if (!active) return;
        setSignedData(null);
        setSigError(e instanceof Error ? e.message : 'Signature generation error');
      });

    return () => {
      active = false;
    };
  }, [sigParams, urlParams.client, generatedUrl, bodyJson]);

  /* UI layout */
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-container">

        {/* Left side — all input forms */}
        <Box className="sidebar-sticky">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Config toolbar */}
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Configuration Manager
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleExport}
                  sx={{ flex: 1, textTransform: 'none' }}
                >
                  Export
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  component="label"
                  sx={{ flex: 1, textTransform: 'none' }}
                >
                  Import
                  <input type="file" accept=".json" hidden onChange={handleImport} />
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleClear}
                  sx={{ flex: 1, textTransform: 'none' }}
                >
                  Clear
                </Button>
              </Box>
            </Paper>

            <UrlParamsForm params={urlParams} onChange={setUrlParams} />
            <Divider />
            <RequestBodyForm
              session={session}
              player={player}
              onSessionChange={setSession}
              onPlayerChange={setPlayer}
            />
            <Divider />
            <SignatureForm params={sigParams} onChange={setSigParams} keyError={sigError} />
          </Box>
        </Box>

        <GeneratedOutput
          hasErrors={hasErrors}
          validationErrors={validationErrors}
          generatedUrl={generatedUrl}
          headers={signedData ? signedData.headers : null}
          bodyJson={signedData ? signedData.bodyJson : bodyJson}
          sigError={sigError}
          sigParams={sigParams}
          urlParams={urlParams}
        />

      </Box>
    </ThemeProvider>
  );
}

export default App;
