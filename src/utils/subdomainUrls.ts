const isIpLike = (hostname: string) => /^[0-9.]+$/.test(hostname);

export function getBaseDomain(hostname: string): string {
	const clean = hostname.trim().toLowerCase();
	if (!clean) return clean;
	if (clean === 'localhost' || isIpLike(clean)) return clean;

	const parts = clean.split('.').filter(Boolean);
	if (parts[0] === 'www') parts.shift();
	if (parts.length <= 2) return parts.join('.');
	return parts.slice(-2).join('.');
}

export function buildSubdomainUrl(params: {
	subdomain: string;
	hostname: string;
	protocol: string; // "http:" | "https:"
	fallbackUrl?: string;
}): string {
	const base = getBaseDomain(params.hostname);

	// На локалке/по IP оставляем фоллбек (или #), т.к. app.localhost чаще не резолвится.
	if (base === 'localhost' || isIpLike(base)) return params.fallbackUrl ?? '#';

	const protocol = params.protocol || 'https:';
	return `${protocol}//${params.subdomain}.${base}`;
}

