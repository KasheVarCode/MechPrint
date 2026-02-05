const isIpLike = (hostname: string) => /^[0-9.]+$/.test(hostname);

/**
 * Возвращает "базовый домен" для поддоменов app/b2b/api.
 * Правило: убираем `www.` и, если текущий хост уже на одном из известных поддоменов,
 * убираем и его (app./b2b./api.), иначе оставляем хост как есть.
 *
 * Примеры:
 * - www.domain.com -> domain.com
 * - app.domain.com -> domain.com
 * - mechprint.vercel.app -> mechprint.vercel.app
 */
export function getBaseDomain(hostname: string): string {
	const clean = hostname.trim().toLowerCase();
	if (!clean) return clean;
	if (isIpLike(clean)) return clean;

	const parts = clean.split('.').filter(Boolean);
	if (parts[0] === 'www') parts.shift();

	const knownSubdomains = new Set(['app', 'b2b', 'api']);
	if (knownSubdomains.has(parts[0])) parts.shift();

	return parts.join('.');
}

export function buildSubdomainUrl(params: {
	subdomain: string;
	hostname: string;
	protocol: string; // "http:" | "https:"
	fallbackUrl?: string;
}): string {
	const base = getBaseDomain(params.hostname);

	// На локалке/по IP оставляем фоллбек, т.к. app.localhost чаще не резолвится.
	if (base === 'localhost' || isIpLike(base)) return params.fallbackUrl ?? '#';

	const protocol = params.protocol || 'https:';
	return `${protocol}//${params.subdomain}.${base}`;
}

