import {
  Box,
  TextField,
  Typography,
  Divider,
  MenuItem,
} from '@mui/material';
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
        helperText="Valid JSON object"
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
      />

      {( /* parameters are the same, so I combined them */
        [
          ['nick', 'Nick'],
          ['name', 'Name'],
          ['email', 'Email'],
          ['phoneNumber', 'Phone Number'],
          ['city', 'City'],
          ['address', 'Address'],
          ['zip', 'ZIP'],
          ['state', 'State'],
          ['countryIso', 'Country ISO'],
          ['preferredCurrencyIso', 'Preferred Currency ISO'],
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
        helperText="Number"
      />
    </Box>
  );
}
