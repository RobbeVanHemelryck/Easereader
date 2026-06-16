const express    = require('express');
const puppeteer  = require('puppeteer');
const path       = require('path');
const https      = require('https');
const http       = require('http');
const fs         = require('fs');
const nodemailer = require('nodemailer');
const multer     = require('multer');
const { v4: uuidv4 } = require('uuid');

const app      = express();
const PORT     = 3000;
const PRIMARY_BASE_URL = 'https://articles.sk';
const FALLBACK_BASE_URL = 'https://1lib.sk';
const DOWNLOAD_BASE_URLS = [PRIMARY_BASE_URL, FALLBACK_BASE_URL];

const DATA_DIR     = process.env.CONFIG_DIR || path.join(__dirname, 'data');
const UPLOADS_DIR  = path.join(DATA_DIR, 'uploads');
const SENDERS_FILE = path.join(DATA_DIR, 'senders.json');
const PROFILES_FILE= path.join(DATA_DIR, 'profiles.json');

// ── Ensure data dirs & seed files exist ─────────────────────────────────────
[DATA_DIR, UPLOADS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
if (!fs.existsSync(SENDERS_FILE))  fs.writeFileSync(SENDERS_FILE,  '[]', 'utf8');
if (!fs.existsSync(PROFILES_FILE)) fs.writeFileSync(PROFILES_FILE, '[]', 'utf8');

// ── JSON helpers ────────────────────────────────────────────────────────────
function readJSON(file)        { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

// ── Multer (profile image uploads) ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, uuidv4() + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Puppeteer browser ────────────────────────────────────────────────────────
let browser = null;
const htmlPreviews = new Map();

function storeHtmlPreview(html, contentType = 'text/html') {
  const id = uuidv4();
  htmlPreviews.set(id, {
    html: String(html || '').slice(0, 500000),
    contentType,
    createdAt: Date.now(),
  });
  return id;
}

function detectHtmlPayload(buffer, contentType = '') {
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('text/html') || ct.includes('application/xhtml+xml')) return true;

  const head = buffer.slice(0, 2048).toString('utf8').trimStart().toLowerCase();
  return head.startsWith('<!doctype html') || head.startsWith('<html') || head.includes('<head');
}

setInterval(() => {
  const cutoff = Date.now() - (30 * 60 * 1000);
  for (const [id, item] of htmlPreviews.entries()) {
    if (item.createdAt < cutoff) htmlPreviews.delete(id);
  }
}, 5 * 60 * 1000);

async function getBrowser() {
  if (!browser || !browser.connected) {
    console.log('Launching browser…');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });
    console.log('Browser ready.');
  }
  return browser;
}

// ── HTTP fetch with redirect follow (returns IncomingMessage) ────────────────
function fetchWithRedirects(url, headers, maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    protocol.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        res.resume();
        resolve(fetchWithRedirects(new URL(res.headers.location, url).href, headers, maxRedirects - 1));
      } else {
        resolve(res);
      }
    }).on('error', reject);
  });
}

// ── Get cookies from Puppeteer context ───────────────────────────────────────
async function getSkCookies() {
  const b = await getBrowser();
  const tmp = await b.newPage();
  try {
    const client = await tmp.createCDPSession();
    const { cookies } = await client.send('Network.getAllCookies');
    await client.detach();
    return cookies
      .filter(c => c.domain && c.domain.includes('.sk'))
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
  } finally {
    await tmp.close().catch(() => {});
  }
}

async function findMirrorDlByTitle(baseUrl, title) {
  if (!title || !title.trim()) return null;

  let page;
  try {
    const b = await getBrowser();
    page = await b.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    const url = `${baseUrl}/s/${encodeURIComponent(title)}/?extensions%5B0%5D=EPUB`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForSelector('z-bookcard', { timeout: 15000 }).catch(() => {});

    const candidates = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('z-bookcard'))
        .filter(c => (c.getAttribute('extension') || '').toLowerCase() === 'epub')
        .map(c => ({
          title: c.querySelector('[slot="title"]')?.textContent?.trim() || '',
          dl: c.getAttribute('download') || '',
        }))
        .filter(c => /^\/dl\/[A-Za-z0-9_-]+$/.test(c.dl));
    });

    if (!candidates.length) return null;
    const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const target = norm(title);
    const exact = candidates.find(c => norm(c.title) === target);
    if (exact) return exact.dl;
    const partial = candidates.find(c => norm(c.title).includes(target) || target.includes(norm(c.title)));
    return (partial || candidates[0]).dl;
  } catch {
    return null;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ── Download EPUB to buffer ──────────────────────────────────────────────────
async function fetchDownloadFromBase(dlPath, baseUrl, cookieStr) {
  if (!dlPath || !/^\/dl\/[A-Za-z0-9_-]+$/.test(dlPath)) throw new Error('Invalid download path');
  const fileRes = await fetchWithRedirects(`${baseUrl}${dlPath}`, {
    'Cookie':          cookieStr,
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer':         baseUrl + '/',
    'Accept':          '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  });
  if (fileRes.statusCode >= 400) throw new Error(`Remote HTTP ${fileRes.statusCode}`);
  return new Promise((resolve, reject) => {
    const chunks = [];
    fileRes.on('data', c => chunks.push(c));
    fileRes.on('end',  () => resolve({
      buffer: Buffer.concat(chunks),
      contentType: fileRes.headers['content-type'] || '',
      baseUrl,
    }));
    fileRes.on('error', reject);
  });
}

async function downloadToBuffer(dlPath, title = '') {
  if (!dlPath || !/^\/dl\/[A-Za-z0-9_-]+$/.test(dlPath)) throw new Error('Invalid download path');

  const cookieStr = await getSkCookies();
  const htmlResults = [];
  const errors = [];

  for (const baseUrl of DOWNLOAD_BASE_URLS) {
    try {
      const result = await fetchDownloadFromBase(dlPath, baseUrl, cookieStr);
      if (detectHtmlPayload(result.buffer, result.contentType)) {
        htmlResults.push(result);
        continue;
      }
      return result;
    } catch (err) {
      if (baseUrl === FALLBACK_BASE_URL && /^Remote HTTP 404/.test(err.message) && title) {
        const mirrorDl = await findMirrorDlByTitle(FALLBACK_BASE_URL, title);
        if (mirrorDl) {
          try {
            const mirrorResult = await fetchDownloadFromBase(mirrorDl, FALLBACK_BASE_URL, cookieStr);
            if (detectHtmlPayload(mirrorResult.buffer, mirrorResult.contentType)) {
              htmlResults.push(mirrorResult);
            } else {
              return mirrorResult;
            }
            continue;
          } catch (innerErr) {
            errors.push({ baseUrl, message: innerErr.message });
            continue;
          }
        }
      }
      errors.push({ baseUrl, message: err.message });
    }
  }

  if (htmlResults.length === DOWNLOAD_BASE_URLS.length) {
    const htmlPreviewIds = htmlResults.map(r => storeHtmlPreview(r.buffer.toString('utf8'), r.contentType));
    const mirrorNames = DOWNLOAD_BASE_URLS.map(u => new URL(u).host).join(', ');
    const allHtmlError = new Error(`Download blocked by source website on all mirrors (${mirrorNames}).`);
    allHtmlError.code = 'ALL_MIRRORS_HTML';
    allHtmlError.htmlPreviewIds = htmlPreviewIds;
    throw allHtmlError;
  }

  const allFailedError = new Error(errors.length ? `Download failed: ${errors.map(e => `${e.baseUrl} -> ${e.message}`).join(' | ')}` : 'Download failed');
  allFailedError.code = 'DOWNLOAD_FAILED';
  throw allFailedError;
}

// ── Build nodemailer transport for a sender ──────────────────────────────────
function buildTransport(sender) {
  return nodemailer.createTransport({
    host:   sender.host,
    port:   parseInt(sender.port, 10) || 587,
    secure: !!sender.secure,
    auth:   { user: sender.user, pass: sender.password },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH & DOWNLOAD (existing)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) return res.json({ results: [] });

  let page;
  try {
    const b = await getBrowser();
    page = await b.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    const url = `${PRIMARY_BASE_URL}/s/${encodeURIComponent(query)}/?extensions%5B0%5D=EPUB`;
    console.log(`Searching: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForSelector('z-bookcard', { timeout: 20000 }).catch(() => {});

    const results = await page.evaluate((base) => {
      return Array.from(document.querySelectorAll('z-bookcard'))
        .filter(c => (c.getAttribute('extension') || '').toLowerCase() === 'epub')
        .map(card => {
          const href = card.getAttribute('href') || '';
          return {
            title:     card.querySelector('[slot="title"]')?.textContent?.trim() || '(no title)',
            author:    card.querySelector('[slot="author"]')?.textContent?.trim() || '',
            publisher: card.getAttribute('publisher') || '',
            language:  card.getAttribute('language')  || '',
            year:      card.getAttribute('year')       || '',
            extension: card.getAttribute('extension')  || '',
            filesize:  card.getAttribute('filesize')   || '',
            rating:    card.getAttribute('rating')     || '',
            quality:   card.getAttribute('quality')    || '',
            cover:     card.querySelector('img')?.getAttribute('data-src') || '',
            dl:        card.getAttribute('download')   || '',
            url:       href.startsWith('http') ? href : base + href,
          };
        });
    }, PRIMARY_BASE_URL);

    res.json({ results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

app.get('/api/download', async (req, res) => {
  const dlPath = req.query.dl;
  const title  = (req.query.title || 'ebook').trim();

  if (!dlPath || !/^\/dl\/[A-Za-z0-9_-]+$/.test(dlPath)) {
    return res.status(400).json({ error: 'Invalid download path' });
  }
  const safeName = title.replace(/[^\w\s\-()']/g, '').trim().replace(/\s+/g, '_').substring(0, 100) || 'ebook';

  try {
    const download = await downloadToBuffer(dlPath, title);
    res.setHeader('Content-Type', download.contentType || 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.epub"`);
    res.setHeader('Content-Length', String(download.buffer.length));
    res.end(download.buffer);
  } catch (err) {
    console.error('Download error:', err.message);
    if (!res.headersSent) {
      if (err.code === 'ALL_MIRRORS_HTML') {
        return res.status(429).json({
          error: 'Download blocked by source website on all mirrors (articles.sk and 1lib.sk).',
          htmlPreviewId: err.htmlPreviewIds?.[0] || null,
          htmlPreviewIds: err.htmlPreviewIds || [],
        });
      }
      res.status(500).json({ error: err.message });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SENDERS CRUD
// ═══════════════════════════════════════════════════════════════════════════

const SENSITIVE = ['password'];

function stripSensitive(sender) {
  const s = { ...sender };
  SENSITIVE.forEach(k => { if (k in s) s[k] = '••••••'; });
  return s;
}

app.get('/api/senders', (req, res) => {
  res.json(readJSON(SENDERS_FILE).map(stripSensitive));
});

app.post('/api/senders', (req, res) => {
  const { label, host, port, secure, user, password } = req.body;
  if (!label || !user) return res.status(400).json({ error: 'label and user are required' });
  if (!host || !password) return res.status(400).json({ error: 'host and password required for SMTP' });

  const senders = readJSON(SENDERS_FILE);
  const sender = {
    id: uuidv4(),
    type: 'smtp',
    label,
    user,
    host,
    port: port || 587,
    secure: !!secure,
    password,
  };
  senders.push(sender);
  writeJSON(SENDERS_FILE, senders);
  res.json(stripSensitive(sender));
});

app.put('/api/senders/:id', (req, res) => {
  const senders = readJSON(SENDERS_FILE);
  const idx = senders.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Sender not found' });

  const update = { ...req.body };
  delete update.type;
  // Never let the client blank out a stored secret with the mask
  SENSITIVE.forEach(k => { if (update[k] === '••••••') delete update[k]; });
  const next = { ...senders[idx], ...update, id: senders[idx].id, type: 'smtp' };
  if (!next.label || !next.user || !next.host || !next.password) {
    return res.status(400).json({ error: 'label, user, host and password are required' });
  }
  senders[idx] = next;
  writeJSON(SENDERS_FILE, senders);
  res.json(stripSensitive(senders[idx]));
});

app.delete('/api/senders/:id', (req, res) => {
  let senders = readJSON(SENDERS_FILE);
  const exists = senders.some(s => s.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Sender not found' });
  senders = senders.filter(s => s.id !== req.params.id);
  writeJSON(SENDERS_FILE, senders);
  // Remove any profile that uses this sender
  const profiles = readJSON(PROFILES_FILE).filter(p => p.senderId !== req.params.id);
  writeJSON(PROFILES_FILE, profiles);
  res.json({ ok: true });
});

app.post('/api/senders/:id/test', async (req, res) => {
  const { destEmail } = req.body;
  if (!destEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destEmail)) {
    return res.status(400).json({ error: 'A valid destination email is required' });
  }
  const senders = readJSON(SENDERS_FILE);
  const sender  = senders.find(s => s.id === req.params.id);
  if (!sender) return res.status(404).json({ error: 'Sender not found' });

  try {
    const transport = buildTransport(sender);
    await transport.sendMail({
      from:    `"Ebook Search" <${sender.user}>`,
      to:      destEmail,
      subject: `Test from ${sender.user}`,
      text:    `This is a test email from the Ebook Search app.\nSender: ${sender.label} (SMTP)`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Sender test error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PROFILES CRUD
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/profiles', (req, res) => {
  const profiles = readJSON(PROFILES_FILE);
  const senders  = readJSON(SENDERS_FILE);
  res.json(profiles.map(p => ({
    ...p,
    senderLabel: senders.find(s => s.id === p.senderId)?.label || '(deleted)',
  })));
});

app.post('/api/profiles', upload.single('image'), (req, res) => {
  const { name, destEmail, senderId } = req.body;
  if (!name || !destEmail || !senderId) return res.status(400).json({ error: 'name, destEmail and senderId are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destEmail)) return res.status(400).json({ error: 'Invalid destEmail' });

  const senders = readJSON(SENDERS_FILE);
  if (!senders.find(s => s.id === senderId)) return res.status(400).json({ error: 'Unknown senderId' });

  const profiles = readJSON(PROFILES_FILE);
  const profile = {
    id: uuidv4(),
    name,
    destEmail,
    senderId,
    imagePath: req.file ? `/uploads/${req.file.filename}` : null,
  };
  profiles.push(profile);
  writeJSON(PROFILES_FILE, profiles);
  const senderLabel = senders.find(s => s.id === senderId)?.label || '';
  res.json({ ...profile, senderLabel });
});

app.put('/api/profiles/:id', upload.single('image'), (req, res) => {
  const profiles = readJSON(PROFILES_FILE);
  const idx = profiles.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Profile not found' });

  const { name, destEmail, senderId } = req.body;
  if (destEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destEmail)) return res.status(400).json({ error: 'Invalid destEmail' });

  // If new image uploaded, delete old one
  if (req.file && profiles[idx].imagePath) {
    const oldFile = path.join(UPLOADS_DIR, path.basename(profiles[idx].imagePath));
    fs.unlink(oldFile, () => {});
  }

  profiles[idx] = {
    ...profiles[idx],
    ...(name      ? { name }      : {}),
    ...(destEmail ? { destEmail } : {}),
    ...(senderId  ? { senderId }  : {}),
    ...(req.file  ? { imagePath: `/uploads/${req.file.filename}` } : {}),
  };
  writeJSON(PROFILES_FILE, profiles);
  const senders = readJSON(SENDERS_FILE);
  res.json({ ...profiles[idx], senderLabel: senders.find(s => s.id === profiles[idx].senderId)?.label || '' });
});

app.delete('/api/profiles/:id', (req, res) => {
  let profiles = readJSON(PROFILES_FILE);
  const target = profiles.find(p => p.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Profile not found' });
  // Delete image file if present
  if (target.imagePath) {
    const file = path.join(UPLOADS_DIR, path.basename(target.imagePath));
    fs.unlink(file, () => {});
  }
  profiles = profiles.filter(p => p.id !== req.params.id);
  writeJSON(PROFILES_FILE, profiles);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
// SEND (download + email)
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/send', async (req, res) => {
  const { dl, title, profileId } = req.body;
  if (!dl || !profileId) return res.status(400).json({ error: 'dl and profileId are required' });

  const profiles = readJSON(PROFILES_FILE);
  const profile  = profiles.find(p => p.id === profileId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const senders = readJSON(SENDERS_FILE);
  const sender  = senders.find(s => s.id === profile.senderId);
  if (!sender)  return res.status(404).json({ error: 'Sender not found' });

  const safeName = (title || 'ebook').replace(/[^\w\s\-()']/g, '').trim().replace(/\s+/g, '_').substring(0, 100) || 'ebook';

  try {
    console.log(`Sending "${safeName}.epub" to ${profile.destEmail} via ${sender.label}…`);
    const download  = await downloadToBuffer(dl, title || '');
    const buffer    = download.buffer;

    const transport = buildTransport(sender);

    await transport.sendMail({
      from:        `"Ebook Search" <${sender.user}>`,
      to:          profile.destEmail,
      subject:     `Book: ${title || safeName}`,
      text:        `Your ebook "${title || safeName}" is attached.`,
      attachments: [{ filename: `${safeName}.epub`, content: buffer, contentType: 'application/epub+zip' }],
    });

    console.log(`Sent "${safeName}.epub" to ${profile.destEmail}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Send error:', err.message);
    if (err.code === 'ALL_MIRRORS_HTML') {
      return res.status(429).json({
        error: 'Download blocked by source website on all mirrors (articles.sk and 1lib.sk).',
        htmlPreviewId: err.htmlPreviewIds?.[0] || null,
        htmlPreviewIds: err.htmlPreviewIds || [],
      });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug/html/:id', (req, res) => {
  const item = htmlPreviews.get(req.params.id);
  if (!item) {
    return res.status(404).type('text/plain').send('HTML preview not found or expired.');
  }
  res.setHeader('Content-Type', item.contentType || 'text/html; charset=utf-8');
  res.send(item.html);
});

// ═══════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => console.log(`Ebook search running at http://localhost:${PORT}`));

process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit();
});
