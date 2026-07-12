'use strict';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractSourceResults(base) {
  const seen = new Set();
  return Array.from(document.querySelectorAll('a[href^="/md5/"]'))
    .map(link => {
      const match = link.getAttribute('href')?.match(/^\/md5\/([a-f0-9]{32})$/i);
      if (!match || seen.has(match[1]) || !link.textContent?.trim()) return null;
      const item = link.closest('.flex.pt-3.pb-3') || link.parentElement?.parentElement?.parentElement;
      if (!item) return null;
      const meta = Array.from(item.querySelectorAll('div'))
        .map(el => (el.textContent || '').trim())
        .filter(text => /\bEPUB\b/i.test(text) && /[·Â]/.test(text))
        .sort((a, b) => a.length - b.length)[0] || '';
      if (!/\bEPUB\b/i.test(meta)) return null;
      seen.add(match[1]);
      const detailLinks = Array.from(item.querySelectorAll('a[href^="/search?q="]'));
      const parts = meta.split(/\s*[·Â]\s*/).map(s => s.trim()).filter(Boolean);
      const year = parts.find(p => /^\d{4}$/.test(p)) || '';
      const filesize = parts.find(p => /^\d+(?:\.\d+)?\s*(?:KB|MB|GB)$/i.test(p)) || '';
      return {
        title: link.textContent.trim(),
        author: detailLinks[0]?.textContent?.trim() || '',
        publisher: detailLinks[1]?.textContent?.trim() || '',
        language: parts[0] || '', year, extension: 'EPUB', filesize,
        rating: '', quality: '',
        cover: item.querySelector('img')?.getAttribute('src') || '',
        dl: match[1].toLowerCase(), strategy: 'source',
        url: new URL(link.getAttribute('href'), base).href,
      };
    }).filter(Boolean);
}

class BookDownloadStrategy {
  constructor(name) { this.name = name; }
  isValidDownloadId() { return false; }
  async search() { throw new Error('search() must be implemented'); }
  async download() { throw new Error('download() must be implemented'); }
}

class LegacyBookDownloadStrategy extends BookDownloadStrategy {
  constructor({ search, download }) {
    super('legacy');
    this.searchBooks = search;
    this.downloadBook = download;
  }
  isValidDownloadId(id) { return /^\/dl\/[A-Za-z0-9_-]+$/.test(id || ''); }
  search(query) { return this.searchBooks(query); }
  download(id, title) { return this.downloadBook(id, title); }
}

class SourceBookDownloadStrategy extends BookDownloadStrategy {
  constructor({ source, getBrowser, fetchWithRedirects, onProgress = () => {} }) {
    super('source');
    this.baseUrl = normalizeSource(source);
    this.getBrowser = getBrowser;
    this.fetchWithRedirects = fetchWithRedirects;
    this.onProgress = onProgress;
  }

  isValidDownloadId(id) { return /^[a-f0-9]{32}$/i.test(id || ''); }

  async newPage() {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(DEFAULT_USER_AGENT);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    return page;
  }

  async search(query) {
    let page;
    try {
      page = await this.newPage();
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(query).replace(/%20/g, '+')}`;
      console.log(`[source:search] query=${JSON.stringify(query)} url=${url}`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.waitForSelector('a[href^="/md5/"]', { timeout: 20000 }).catch(() => {});
      const results = await page.evaluate(extractSourceResults, this.baseUrl);
      console.log(`[source:search] found ${results.length} EPUB book(s)`);
      results.forEach(book => console.log(`[source:search] book id=${book.dl} title=${JSON.stringify(book.title)}`));
      return results;
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }

  async download(id) {
    if (!this.isValidDownloadId(id)) throw new Error('Invalid download id');
    let page;
    try {
      page = await this.newPage();
      const url = `${this.baseUrl}/slow_download/${id}/0/0`;
      console.log(`[source:download] book id=${id} slow-download-url=${url}`);
      const pageResponse = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      if (!pageResponse || !pageResponse.ok()) {
        const isBrowserCheck = pageResponse?.status() === 403 && await page.evaluate(() =>
          document.title === 'DDoS-Guard'
          || (document.body?.innerText || '').includes('Checking your browser before accessing'));
        if (!isBrowserCheck) {
          throw new Error(`Download page returned HTTP ${pageResponse?.status() || 'unknown'}`);
        }
        console.log('[source:download] browser verification encountered; waiting for the source to continue');
        await page.waitForFunction(() => document.body
          && document.title
          && document.title !== 'DDoS-Guard'
          && !document.body.innerText.includes('Checking your browser before accessing'), {
          timeout: 60000,
          polling: 500,
        });
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 30000 }).catch(() => {});
      }
      this.onProgress({
        stage: 'download_page_loaded', bookId: id,
        message: `Download page loaded for ${id}`,
      });

      const downloadReady = await page.evaluate(() => Array.from(document.querySelectorAll('a'))
        .some(a => /download now/i.test(a.textContent || '') && a.href));
      if (!downloadReady) {
        // Give client-side countdown code one render cycle before reading it.
        await new Promise(resolve => setTimeout(resolve, 500));
        const timer = await page.evaluate(() => {
          const timerElements = Array.from(document.querySelectorAll(
            '[id*="countdown" i], [class*="countdown" i], [id*="timer" i], [class*="timer" i]'
          ));
          const texts = timerElements.map(el => el.textContent || '');
          texts.push(document.body?.innerText || '');
          for (const text of texts) {
            let match = text.match(/\b(\d{1,2}):(\d{2})\b/);
            if (match) return { seconds: (Number(match[1]) * 60) + Number(match[2]), text: match[0] };
            match = text.match(/(?:wait|download(?: is)? available in|download in)[^\d]{0,40}(\d+)\s*(seconds?|secs?|minutes?|mins?)/i)
              || text.match(/\b(\d+)\s*(seconds?|secs?|minutes?|mins?)\s*(?:remaining|left)\b/i);
            if (match) {
              const amount = Number(match[1]);
              return { seconds: /min/i.test(match[2]) ? amount * 60 : amount, text: match[0].trim() };
            }
          }
          return null;
        });
        if (timer) {
          console.log(`[source:download] timer encountered; waiting ${timer.seconds} second(s) (${JSON.stringify(timer.text)})`);
          this.onProgress({
            stage: 'timer', bookId: id, waitSeconds: timer.seconds,
            message: `Waiting ${timer.seconds} second${timer.seconds === 1 ? '' : 's'} before download`,
          });
        } else {
          console.log('[source:download] download is not ready; waiting for timer to elapse (duration not exposed in page text)');
        }
      }

      // The source replaces its countdown with this link. Waiting on the actual
      // link avoids guessing how long a particular request has been delayed.
      await page.waitForFunction(() => Array.from(document.querySelectorAll('a'))
        .some(a => /download now/i.test(a.textContent || '') && a.href), { timeout: 10 * 60 * 1000, polling: 500 });
      const href = await page.evaluate(() => Array.from(document.querySelectorAll('a'))
        .find(a => /download now/i.test(a.textContent || '') && a.href).href);
      console.log(`[source:download] book id=${id} download-url=${href}`);

      console.log(`[source:download] clicking "Download now" for book id=${id}`);
      this.onProgress({
        stage: 'download_started', bookId: id,
        message: `Download started for ${id}`,
      });
      // target="_blank" downloads may be handled in a separate browser target,
      // so only briefly check this page before using the authenticated HTTP fallback.
      const responsePromise = page.waitForResponse(r => r.url() === href || r.url().startsWith(href), { timeout: 5000 }).catch(() => null);
      await page.evaluate(() => Array.from(document.querySelectorAll('a'))
        .find(a => /download now/i.test(a.textContent || '') && a.href).click());
      const response = await responsePromise;
      if (response && response.ok()) {
        try {
          const buffer = await response.buffer();
          const contentType = response.headers()['content-type'] || 'application/epub+zip';
          console.log(`[source:download] completed status=${response.status()} bytes=${buffer.length} content-type=${contentType}`);
          this.onProgress({
            stage: 'download_finished', bookId: id, bytes: buffer.length,
            message: `Download finished for ${id}`,
          });
          return { buffer, contentType, baseUrl: this.baseUrl };
        } catch (_) { /* Browser-managed downloads are fetched below. */ }
      }

      const cookies = (await page.cookies(href)).map(c => `${c.name}=${c.value}`).join('; ');
      console.log(`[source:download] fetching resolved download endpoint directly after browser-managed response`);
      const fileRes = await this.fetchWithRedirects(href, {
        Cookie: cookies, 'User-Agent': DEFAULT_USER_AGENT, Referer: url, Accept: '*/*',
      });
      if (fileRes.statusCode >= 400) throw new Error(`Remote HTTP ${fileRes.statusCode}`);
      const chunks = [];
      for await (const chunk of fileRes) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const contentType = fileRes.headers['content-type'] || 'application/epub+zip';
      console.log(`[source:download] completed status=${fileRes.statusCode} bytes=${buffer.length} content-type=${contentType}`);
      this.onProgress({
        stage: 'download_finished', bookId: id, bytes: buffer.length,
        message: `Download finished for ${id}`,
      });
      return { buffer, contentType, baseUrl: this.baseUrl };
    } finally {
      if (page) await page.close().catch(() => {});
    }
  }
}

function normalizeSource(source) {
  const raw = String(source || '').trim();
  if (!raw) throw new Error('SOURCE is required for the source download strategy');
  const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  if (url.protocol !== 'https:') throw new Error('SOURCE must use HTTPS');
  if (url.username || url.password || url.search || url.hash || (url.pathname && url.pathname !== '/')) {
    throw new Error('SOURCE must be a hostname, without a path, query, or credentials');
  }
  return url.origin;
}

module.exports = { BookDownloadStrategy, LegacyBookDownloadStrategy, SourceBookDownloadStrategy, normalizeSource, extractSourceResults };
