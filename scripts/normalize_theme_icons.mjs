import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.cwd());
const ICONS_DIR = path.join(ROOT, 'public', 'icons', 'style');
const BACKUP_DIR = path.join(ROOT, 'scripts', '_icon_backup', 'style');

const TARGET_SIZE = 96; // keep some detail, will be scaled down in UI
// Padding was useful when icons were clipped into circles.
// Now we show icons without circles — keep padding at 0 so the icon looks large.
const PADDING_RATIO = 0.0;

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true });
}

function isWebpFile(name) {
	return name.toLowerCase().endsWith('.webp');
}

function clampInt(n) {
	return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

async function normalizeWebp(filePath, fileName) {
	const input = await fs.readFile(filePath);

	// Backup (once)
	const backupPath = path.join(BACKUP_DIR, fileName);
	try {
		await fs.access(backupPath);
	} catch {
		await fs.writeFile(backupPath, input);
	}

	const img = sharp(input, { failOn: 'none' }).ensureAlpha();

	// 1) trim transparent/flat borders
	const trimmed = img.trim();
	const meta = await trimmed.metadata();
	const w = meta.width ?? 0;
	const h = meta.height ?? 0;
	if (!w || !h) return { fileName, skipped: true, reason: 'no metadata' };

	// 2) make square by extending
	const maxSide = Math.max(w, h);
	const left = clampInt((maxSide - w) / 2);
	const right = clampInt(maxSide - w - left);
	const top = clampInt((maxSide - h) / 2);
	const bottom = clampInt(maxSide - h - top);

	const squared = trimmed.extend({
		left,
		right,
		top,
		bottom,
		background: { r: 0, g: 0, b: 0, alpha: 0 },
	});

	// 3) add padding so circle mask doesn't “bite” the icon
	const pad = clampInt(maxSide * PADDING_RATIO);
	const padded = squared.extend({
		left: pad,
		right: pad,
		top: pad,
		bottom: pad,
		background: { r: 0, g: 0, b: 0, alpha: 0 },
	});

	// 4) resize to a consistent square
	const out = await padded
		.resize(TARGET_SIZE, TARGET_SIZE, { fit: 'contain' })
		.webp({ quality: 92, effort: 5, alphaQuality: 100 })
		.toBuffer();

	await fs.writeFile(filePath, out);
	return { fileName, skipped: false, size: `${TARGET_SIZE}x${TARGET_SIZE}` };
}

async function main() {
	await ensureDir(BACKUP_DIR);

	const entries = await fs.readdir(ICONS_DIR, { withFileTypes: true });
	const files = entries
		.filter((e) => e.isFile() && isWebpFile(e.name))
		.map((e) => e.name)
		.sort();

	if (files.length === 0) {
		console.log('[normalize_theme_icons] No .webp files found in', ICONS_DIR);
		return;
	}

	console.log('[normalize_theme_icons] Found', files.length, 'files');
	for (const name of files) {
		const filePath = path.join(ICONS_DIR, name);
		const res = await normalizeWebp(filePath, name);
		if (res.skipped) console.log(' -', name, 'SKIP:', res.reason);
		else console.log(' -', name, 'OK', res.size);
	}

	console.log('[normalize_theme_icons] Backup dir:', BACKUP_DIR);
}

await main();

