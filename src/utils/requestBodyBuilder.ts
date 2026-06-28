import type { SessionParams, PlayerParams } from '../types/api';

function parseBool(val: '' | 'true' | 'false'): boolean | undefined {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
}

function parseNumber(val: string): number | undefined {
  if (val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function parseJson(val: string): object | undefined {
  if (!val.trim()) return undefined;
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/* Remove params with undefined values from body */
function removeUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')
  );
}

export function buildRequestBody(
  session: SessionParams,
  player: PlayerParams
): object {
  const sessionObj = removeUndefined({
    mode: 'real',
    currencyIso: session.currencyIso || undefined,
    id: session.id || undefined,
    longLifeLoginToken: parseBool(session.longLifeLoginToken),
    launchUrlQueryParams: parseJson(session.launchUrlQueryParams),
  });

  const playerObj = removeUndefined({
    id: player.id || undefined,
    nick: player.nick || undefined,
    name: player.name || undefined,
    email: player.email || undefined,
    phoneNumber: player.phoneNumber || undefined,
    city: player.city || undefined,
    address: player.address || undefined,
    zip: player.zip || undefined,
    state: player.state || undefined,
    countryIso: player.countryIso || undefined,
    preferredCurrencyIso: player.preferredCurrencyIso || undefined,
    referralCode: player.referralCode || undefined,
    bonusCode: player.bonusCode || undefined,
    tag: player.tag || undefined,
    active: parseBool(player.active),
    verified: parseBool(player.verified),
    trustedLevel: parseNumber(player.trustedLevel),
    avatar: player.avatar || undefined,
    redeemCode: player.redeemCode || undefined,
  });

  return {
    data: {
      attributes: {
        session: sessionObj,
        player: playerObj,
      },
    },
  };
}
