import type { UrlParams, SessionParams, PlayerParams, SignatureParams } from '../types/api';

export function getValidationErrors(
  urlParams: UrlParams,
  session: SessionParams,
  player: PlayerParams,
  sigParams: SignatureParams,
  currentTime: number
): string[] {
  const errors: string[] = [];

  if (!urlParams.baseUrl || !urlParams.baseUrl.trim()) {
    errors.push('baseUrl is required (URL Parameters)');
  }
  if (!urlParams.gameId || !urlParams.gameId.trim()) {
    errors.push('gameId is required (URL Parameters)');
  }
  if (!urlParams.client || !urlParams.client.trim()) {
    errors.push('client is required (URL Parameters)');
  }
  if (urlParams.language && urlParams.language.trim() && !/^[a-zA-Z]{2}$/.test(urlParams.language.trim())) {
    errors.push('language must be a 2-letter ISO language code (e.g. en)');
  }

  if (!sigParams.privateKey || !sigParams.privateKey.trim()) {
    errors.push('privateKey is required (Signature Settings)');
  }
  if (!sigParams.alg || !sigParams.alg.trim()) {
    errors.push('alg is required (Signature Settings)');
  }
  if (sigParams.created === undefined || sigParams.created === null || isNaN(sigParams.created)) {
    errors.push('created is required (Signature Settings)');
  }
  if (sigParams.expires === undefined || sigParams.expires === null || isNaN(sigParams.expires)) {
    errors.push('expires is required (Signature Settings)');
  }

  if (sigParams.created !== undefined && sigParams.expires !== undefined && !isNaN(sigParams.created) && !isNaN(sigParams.expires)) {
    if (sigParams.expires <= sigParams.created) {
      errors.push('expires must be greater than created (Signature Settings)');
    } else if (sigParams.expires - sigParams.created > 300) {
      errors.push('expires − created must not exceed 300 seconds (Signature Settings)');
    } else if (sigParams.expires < currentTime) {
      errors.push('Signature has expired. Please click Regenerate in Signature settings');
    }
  }

  if (!sigParams.nonce || !sigParams.nonce.trim()) {
    errors.push('nonce is required (Signature Settings)');
  } else if (sigParams.nonce.length > 128) {
    errors.push('nonce must not exceed 128 characters (Signature Settings)');
  }

  if (!session.currencyIso || !session.currencyIso.trim()) {
    errors.push('session.currencyIso is required (Request Body)');
  } else if (!/^[a-zA-Z]{3}$/.test(session.currencyIso.trim())) {
    errors.push('session.currencyIso must be a 3-letter ISO currency code (e.g. USD)');
  }

  if (session.launchUrlQueryParams && session.launchUrlQueryParams.trim()) {
    try {
      const parsed = JSON.parse(session.launchUrlQueryParams.trim());
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        errors.push('session.launchUrlQueryParams must be a valid JSON object');
      }
    } catch {
      errors.push('session.launchUrlQueryParams is not a valid JSON string');
    }
  }

  if (!player.id || !player.id.trim()) {
    errors.push('player.id is required (Request Body)');
  }
  if (player.countryIso && player.countryIso.trim() && !/^[a-zA-Z]{2}$/.test(player.countryIso.trim())) {
    errors.push('player.countryIso must be a 2-letter ISO country code (e.g. US)');
  }
  if (player.preferredCurrencyIso && player.preferredCurrencyIso.trim() && !/^[a-zA-Z]{3}$/.test(player.preferredCurrencyIso.trim())) {
    errors.push('player.preferredCurrencyIso must be a 3-letter ISO currency code (e.g. EUR)');
  }
  if (player.trustedLevel && player.trustedLevel.trim() && isNaN(Number(player.trustedLevel))) {
    errors.push('player.trustedLevel must be a valid number');
  }

  return errors;
}
