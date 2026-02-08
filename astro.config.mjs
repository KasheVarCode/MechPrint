// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';

// https://astro.build/config
function readCname() {
  try {
    const cnameUrl = new URL('./CNAME', import.meta.url);
    const cnamePath = fs.existsSync(cnameUrl) ? cnameUrl : null;
    if (!cnamePath) return null;
    const value = fs.readFileSync(cnameUrl, 'utf8').trim();
    return value || null;
  } catch {
    return null;
  }
}

const cname = readCname();
const site =
  process.env.ASTRO_SITE ??
  (cname ? `https://${cname}` : undefined);

// Для GitHub Pages (и прочих хостингов под подпапкой) задаём ASTRO_BASE,
// например "/<repo>/". По умолчанию "/" (корень домена).
const base = process.env.ASTRO_BASE ?? '/';

export default defineConfig({
  site,
  base,
});
