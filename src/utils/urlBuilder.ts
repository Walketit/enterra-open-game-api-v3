import type { UrlParams } from '../types/api';

export function buildUrl(params: UrlParams): string {
  const { baseUrl, gameId, client, language } = params;

  if (!baseUrl || !gameId || !client) return '';

  const base = baseUrl.replace(/\/$/, '');

  const path = `/apiweb/v3/partner/games/${gameId}:create-session`;

  const query = new URLSearchParams({ client });

  if (language && language.trim()) {
    query.set('language', language.trim());
  }

  return `${base}${path}?${query.toString()}`;
}
