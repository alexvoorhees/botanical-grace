import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src', 'content');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images');

const VALID_COLLECTIONS = ['articles', 'herbs', 'courses'];
const VALID_LANGS = ['en', 'ja'];
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

const app = express();

// --- Basic auth middleware ---

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

function basicAuth(req, res, next) {
  if (!ADMIN_USER || !ADMIN_PASS) return next();

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Kimiko Admin"');
    return res.status(401).send('Authentication required');
  }

  const decoded = Buffer.from(header.slice(6), 'base64').toString();
  const [user, pass] = decoded.split(':');

  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();

  res.set('WWW-Authenticate', 'Basic realm="Kimiko Admin"');
  return res.status(401).send('Invalid credentials');
}

app.use(basicAuth);
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(PROJECT_ROOT, 'public', 'images')));

// --- Validation middleware ---

function validateParams(req, res, next) {
  const { collection, lang, slug } = req.params;
  if (collection && !VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Invalid collection: ${collection}` });
  }
  if (lang && !VALID_LANGS.includes(lang)) {
    return res.status(400).json({ error: `Invalid lang: ${lang}` });
  }
  if (slug && !SLUG_RE.test(slug)) {
    return res.status(400).json({ error: `Invalid slug: ${slug}` });
  }
  next();
}

// --- Frontmatter helpers ---

function parseMarkdown(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  return {
    frontmatter: yaml.load(match[1]) || {},
    body: match[2],
  };
}

function serializeMarkdown(frontmatter, body) {
  const yml = yaml.dump(frontmatter, {
    quotingType: '"',
    forceQuotes: true,
    lineWidth: -1,
    noRefs: true,
  });
  return `---\n${yml}---\n\n${body}`;
}

// --- List entries ---

app.get('/api/content/:collection', validateParams, async (req, res) => {
  const { collection } = req.params;
  const entries = [];

  for (const lang of VALID_LANGS) {
    const dir = path.join(CONTENT_DIR, collection, lang);
    let files;
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const raw = await fs.readFile(path.join(dir, file), 'utf-8');
      const { frontmatter } = parseMarkdown(raw);
      entries.push({ ...frontmatter, _file: file, _lang: lang });
    }
  }

  res.json(entries);
});

// --- Read single entry ---

app.get('/api/content/:collection/:lang/:slug', validateParams, async (req, res) => {
  const { collection, lang, slug } = req.params;
  const filePath = path.join(CONTENT_DIR, collection, lang, `${slug}.md`);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdown(raw);
    res.json({ frontmatter, body });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// --- Create / Update entry ---

app.put('/api/content/:collection/:lang/:slug', validateParams, async (req, res) => {
  const { collection, lang, slug } = req.params;
  const { frontmatter, body } = req.body;

  if (!frontmatter || typeof body !== 'string') {
    return res.status(400).json({ error: 'Missing frontmatter or body' });
  }

  const dir = path.join(CONTENT_DIR, collection, lang);
  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${slug}.md`);
  const content = serializeMarkdown(frontmatter, body);
  await fs.writeFile(filePath, content, 'utf-8');

  res.json({ ok: true, path: filePath });
});

// --- Delete entry ---

app.delete('/api/content/:collection/:lang/:slug', validateParams, async (req, res) => {
  const { collection, lang, slug } = req.params;
  const filePath = path.join(CONTENT_DIR, collection, lang, `${slug}.md`);

  try {
    await fs.unlink(filePath);
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// --- Generate image via Venice AI ---

app.post('/api/generate-image', async (req, res) => {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'VENICE_API_KEY not set in .env' });
  }

  const { prompt, collection, slug } = req.body;
  if (!prompt || !collection || !slug) {
    return res.status(400).json({ error: 'Missing prompt, collection, or slug' });
  }
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: `Invalid collection: ${collection}` });
  }
  if (!SLUG_RE.test(slug)) {
    return res.status(400).json({ error: `Invalid slug: ${slug}` });
  }

  const size = collection === 'herbs' ? '1024x1024' : '1792x1024';

  try {
    const response = await fetch('https://api.venice.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'fluently-xl',
        prompt,
        n: 1,
        size,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: `Venice API error: ${response.status}`, detail: text });
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(502).json({ error: 'No image data in Venice response' });
    }

    const imgDir = path.join(IMAGES_DIR, collection);
    await fs.mkdir(imgDir, { recursive: true });
    const imgPath = path.join(imgDir, `${slug}.png`);
    await fs.writeFile(imgPath, Buffer.from(b64, 'base64'));

    const publicPath = `/Kimiko_Site/images/${collection}/${slug}.png`;
    res.json({ ok: true, path: publicPath, localPath: imgPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start ---

const PORT = 4400;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  🌿 Kimiko Admin running at http://localhost:${PORT}\n`);
  console.log(`  Content dir: ${CONTENT_DIR}`);
  console.log(`  Images dir:  ${IMAGES_DIR}`);
  if (!process.env.VENICE_API_KEY) {
    console.log(`\n  ⚠  VENICE_API_KEY not set — image generation will be disabled`);
    console.log(`     Create a .env file in the project root with: VENICE_API_KEY=your_key\n`);
  }
});
