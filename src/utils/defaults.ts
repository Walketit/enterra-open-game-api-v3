import type { UrlParams, SessionParams, PlayerParams, SignatureParams } from '../types/api';
import { generateNonce, nowSeconds } from './signatureBuilder';

export const DEFAULT_URL_PARAMS: UrlParams = {
  baseUrl: '',
  gameId: '0',
  client: '',
  language: 'en',
};

export const DEFAULT_SESSION: SessionParams = {
  currencyIso: '',
  id: '',
  longLifeLoginToken: '',
  launchUrlQueryParams: '',
};

export const DEFAULT_PLAYER: PlayerParams = {
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

export function makeDefaultSignature(): SignatureParams {
  const created = nowSeconds();
  return {
    alg: 'ed25519',
    created,
    expires: created + 300,
    nonce: generateNonce(),
    privateKey: '',
  };
}

/* Load configuration from localStorage, excluding private key */
export function loadSavedConfig() {
  try {
    const saved = localStorage.getItem('custom_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load config from localStorage', e);
  }
  return null;
}
