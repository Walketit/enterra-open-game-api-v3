export interface UrlParams {
  baseUrl: string;
  gameId: string;
  client: string;
  language: string;
}

export interface SessionParams {
  currencyIso: string;
  id: string;
  longLifeLoginToken: '' | 'true' | 'false';
  launchUrlQueryParams: string;
}

export interface PlayerParams {
  id: string;
  nick: string;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  address: string;
  zip: string;
  state: string;
  countryIso: string;
  preferredCurrencyIso: string;
  referralCode: string;
  bonusCode: string;
  tag: string;
  active: '' | 'true' | 'false';
  verified: '' | 'true' | 'false';
  trustedLevel: string;
  avatar: string;
  redeemCode: string;
}

export type SignatureAlg = 'ed25519';

export interface SignatureParams {
  alg: SignatureAlg;
  created: number;
  expires: number;
  nonce: string;
  privateKey: string;
}

export interface GeneratedHeaders {
  'Content-Type': string;
  'Accept': string;
  'Content-Digest': string;
  'Signature-Input': string;
  'Signature': string;
}
