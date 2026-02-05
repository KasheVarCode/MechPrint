import { getBaseDomain } from '../utils/subdomainUrls';

const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value);

function resolveSubdomainUrl(subdomain: string): string | null {
	const envBase = (import.meta.env.PUBLIC_BASE_DOMAIN as string | undefined)?.trim();
	const base = envBase || getBaseDomain(window.location.hostname);
	if (!base || base === 'localhost') return null;

	const protocol = window.location.protocol || 'https:';
	return `${protocol}//${subdomain}.${base}`;
}

function applySubdomainLinks() {
	const anchors = document.querySelectorAll<HTMLAnchorElement>('a[data-subdomain-link]');
	for (const a of anchors) {
		const subdomain = a.dataset.subdomainLink?.trim();
		if (!subdomain) continue;

		const explicit = a.dataset.subdomainUrl?.trim();
		const url = explicit && isAbsoluteHttpUrl(explicit) ? explicit : resolveSubdomainUrl(subdomain);
		if (!url) continue;

		a.href = url;
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', applySubdomainLinks, { once: true });
} else {
	applySubdomainLinks();
}

