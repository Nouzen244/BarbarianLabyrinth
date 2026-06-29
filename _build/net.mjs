// Shared networking helper: routes Node fetch through the local system proxy.
import { ProxyAgent, setGlobalDispatcher } from 'undici';

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:2080';
if (PROXY) {
  setGlobalDispatcher(new ProxyAgent(PROXY));
  console.error('[net] using proxy ' + PROXY);
}

export async function getText(url, tries = 6) {
  let lastErr;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'ClaudeCode-RPGMV' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } catch (e) {
      lastErr = e;
      console.error(`  [${i}/${tries}] ${url} -> ${e.message}`);
      await new Promise(r => setTimeout(r, 600 * i));
    }
  }
  throw new Error('FAILED ' + url + ' : ' + lastErr.message);
}

export async function getJSON(url, tries = 6) {
  return JSON.parse(await getText(url, tries));
}
