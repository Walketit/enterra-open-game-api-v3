import { Box, TextField, Typography, Divider, MenuItem } from '@mui/material';
import type { SessionParams, PlayerParams } from '../types/api';

interface RequestBodyFormProps {
  session: SessionParams;
  player: PlayerParams;
  onSessionChange: (s: SessionParams) => void;
  onPlayerChange: (p: PlayerParams) => void;
}

const BOOL_OPTIONS = [
  { value: '', label: 'not set' },
  { value: 'true', label: 'true' },
  { value: 'false', label: 'false' },
];

const isJsonInvalid = (val: string): boolean => {
  const trimmed = val.trim();
  if (!trimmed) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return !(typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed));
  } catch {
    return true;
  }
};

const isEmailInvalid = (val: string): boolean => {
  const trimmed = val.trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !emailRegex.test(trimmed);
};

const isPhoneInvalid = (val: string): boolean => {
  const trimmed = val.trim();
  if (!trimmed) return false;
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  return !phoneRegex.test(trimmed);
};

const isCurrencyIsoInvalid = (val: string): boolean => {
  const trimmed = val.trim();
  if (!trimmed) return false;
  return !/^[a-zA-Z]{3}$/.test(trimmed);
};

const isCountryIsoInvalid = (val: string): boolean => {
  const trimmed = val.trim();
  if (!trimmed) return false;
  return !/^[a-zA-Z]{2}$/.test(trimmed);
};

export default function RequestBodyForm({
  session,
  player,
  onSessionChange,
  onPlayerChange,
}: RequestBodyFormProps) {
  const handleSession =
    (field: keyof SessionParams) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSessionChange({ ...session, [field]: e.target.value });
      };

  const handlePlayer =
    (field: keyof PlayerParams) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onPlayerChange({ ...player, [field]: e.target.value });
      };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Session */}
      <Typography variant="h6" color="text.secondary">
        Session
      </Typography>

      <TextField
        label="mode"
        value="real"
        size="small"
        fullWidth
        disabled
        helperText="Required, fixed value"
      />

      <TextField
        label="currencyIso *"
        placeholder="USD"
        value={session.currencyIso}
        onChange={handleSession('currencyIso')}
        size="small"
        fullWidth
        error={!session.currencyIso.trim() || isCurrencyIsoInvalid(session.currencyIso)}
        helperText={!session.currencyIso.trim() ? "currencyIso is required (e.g. USD)" : isCurrencyIsoInvalid(session.currencyIso) ? "Must be a 3-letter ISO code (e.g. USD)" : ""}
      />

      <TextField
        label="id"
        placeholder="session-id"
        value={session.id}
        onChange={handleSession('id')}
        size="small"
        fullWidth
      />

      <TextField
        select
        label="longLifeLoginToken"
        value={session.longLifeLoginToken}
        onChange={handleSession('longLifeLoginToken')}
        size="small"
        fullWidth
      >
        {BOOL_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="launchUrlQueryParams"
        placeholder='{"key": "value"}'
        value={session.launchUrlQueryParams}
        onChange={handleSession('launchUrlQueryParams')}
        size="small"
        fullWidth
        multiline
        minRows={2}
        error={isJsonInvalid(session.launchUrlQueryParams)}
        helperText={isJsonInvalid(session.launchUrlQueryParams) ? "Invalid JSON object format (e.g. {\"key\": \"value\"})" : "Optional: requires valid JSON object"}
      />

      <Divider />

      {/* Player */}
      <Typography variant="h6" color="text.secondary">
        Player
      </Typography>

      <TextField
        label="id *"
        placeholder="ext-user-42"
        value={player.id}
        onChange={handlePlayer('id')}
        size="small"
        fullWidth
        error={!player.id.trim()}
        helperText={!player.id.trim() ? "player.id is required (e.g. ext-user-42)" : ""}
      />

      <TextField
        label="Email"
        placeholder="user@example.com"
        value={player.email}
        onChange={handlePlayer('email')}
        size="small"
        fullWidth
        error={isEmailInvalid(player.email)}
        helperText={isEmailInvalid(player.email) ? "Invalid email address format" : ""}
      />

      <TextField
        label="Phone Number"
        placeholder="+1234567890"
        value={player.phoneNumber}
        onChange={handlePlayer('phoneNumber')}
        size="small"
        fullWidth
        error={isPhoneInvalid(player.phoneNumber)}
        helperText={isPhoneInvalid(player.phoneNumber) ? "Invalid phone number format (7-20 digits)" : ""}
      />

      <TextField
        label="Country ISO"
        placeholder="US"
        value={player.countryIso}
        onChange={handlePlayer('countryIso')}
        size="small"
        fullWidth
        error={isCountryIsoInvalid(player.countryIso)}
        helperText={isCountryIsoInvalid(player.countryIso) ? "Must be a 2-letter ISO country code (e.g. US)" : ""}
      />

      <TextField
        label="Preferred Currency ISO"
        placeholder="EUR"
        value={player.preferredCurrencyIso}
        onChange={handlePlayer('preferredCurrencyIso')}
        size="small"
        fullWidth
        error={isCurrencyIsoInvalid(player.preferredCurrencyIso)}
        helperText={isCurrencyIsoInvalid(player.preferredCurrencyIso) ? "Must be a 3-letter ISO currency code (e.g. EUR)" : ""}
      />

      {( /* parameters are the same, so I combined them */
        [
          ['nick', 'Nick'],
          ['name', 'Name'],
          ['city', 'City'],
          ['address', 'Address'],
          ['zip', 'ZIP'],
          ['state', 'State'],
          ['referralCode', 'Referral Code'],
          ['bonusCode', 'Bonus Code'],
          ['tag', 'Tag'],
          ['avatar', 'Avatar'],
          ['redeemCode', 'Redeem Code'],
        ] as [keyof PlayerParams, string][]
      ).map(([field, label]) => (
        <TextField
          key={field}
          label={label}
          value={player[field] as string}
          onChange={handlePlayer(field)}
          size="small"
          fullWidth
        />
      ))}

      {(
        [
          ['active', 'Active'],
          ['verified', 'Verified'],
        ] as [keyof PlayerParams, string][]
      ).map(([field, label]) => (
        <TextField
          key={field}
          select
          label={label}
          value={player[field] as string}
          onChange={handlePlayer(field)}
          size="small"
          fullWidth
        >
          {BOOL_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      ))}

      <TextField
        label="trustedLevel"
        placeholder="0"
        value={player.trustedLevel}
        onChange={handlePlayer('trustedLevel')}
        size="small"
        fullWidth
        type="number"
        error={player.trustedLevel.trim() !== '' && isNaN(Number(player.trustedLevel))}
        helperText={player.trustedLevel.trim() !== '' && isNaN(Number(player.trustedLevel)) ? "Must be a valid number" : "Optional: numeric value"}
      />
    </Box>
  );
}
