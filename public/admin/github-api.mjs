// === GitHub Contents API Wrapper ===

const OWNER = 'alexvoorhees';
const REPO = 'Kimiko_Site';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;
const BRANCH = 'main';

function getToken() { return sessionStorage.getItem('gh_pat'); }

function headers() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Accept': 'application/vnd.github.v3+json',
  };
}

// --- Auth: encrypted PAT decryption via Web Crypto ---

const ENCRYPTED_PAT = {
  salt: 'IrZvvZ2dFMTClbnR6zBvOQ==',
  iv: 'qlUz8yEz6wrYsRN1',
  tag: 'bHO5HmBmVK8vPyIFhGNh1A==',
  data: 's75GC1eN+lsaMUVBCjDjlpvg7w7+6doar/mTlTeUiNzhncxWM/8Hk9iiPmMoj3quTQp2aag3KbontibHXw5HxJ5UEL3qC4f0CeKWtyOYU+RzCR5fAfoKjIZklyBt',
};

const EMAIL_HASH = '1b8e1db42870dd2239ca9ac253a84ee918532778a4085f31bc0964d4f55cebe2';
const PASS_HASH = '09e0a5695a2d5db4e14ac252fcabf90678d392837c3a89ee74d6dbfa066984c6';

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export async function verifyCredentials(email, password) {
  const [eHash, pHash] = await Promise.all([sha256(email), sha256(password)]);
  return eHash === EMAIL_HASH && pHash === PASS_HASH;
}

export async function decryptPAT(password) {
  const salt = b64ToBytes(ENCRYPTED_PAT.salt);
  const iv = b64ToBytes(ENCRYPTED_PAT.iv);
  const tag = b64ToBytes(ENCRYPTED_PAT.tag);
  const data = b64ToBytes(ENCRYPTED_PAT.data);

  // Combine ciphertext + auth tag (AES-GCM expects them concatenated)
  const ciphertext = new Uint8Array(data.length + tag.length);
  ciphertext.set(data);
  ciphertext.set(tag, data.length);

  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

export async function validateToken() {
  const res = await fetch(`${API}`, { headers: headers() });
  return res.ok;
}

// --- UTF-8 safe base64 ---

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

// --- Frontmatter parse/serialize ---

export function parseMarkdown(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };

  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let inArray = false;

  for (const line of lines) {
    // Array item
    if (inArray && /^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').replace(/^"|"$/g, '');
      fm[currentKey].push(val);
      continue;
    }
    inArray = false;

    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;

    const [, key, rawVal] = kv;
    currentKey = key;

    if (rawVal === '') {
      // Could be start of array
      fm[key] = [];
      inArray = true;
      continue;
    }

    // Unquote strings
    let val = rawVal.replace(/^"|"$/g, '');

    // Try number
    if (/^\d+(\.\d+)?$/.test(val)) {
      fm[key] = Number(val);
    } else {
      fm[key] = val;
    }
  }

  return { frontmatter: fm, body: match[2] };
}

export function serializeMarkdown(frontmatter, body) {
  let yml = '';
  for (const [key, val] of Object.entries(frontmatter)) {
    if (val === undefined || val === null || val === '') continue;

    if (Array.isArray(val)) {
      yml += `${key}:\n`;
      for (const item of val) {
        yml += `  - "${item}"\n`;
      }
    } else if (typeof val === 'number') {
      yml += `${key}: ${val}\n`;
    } else {
      yml += `${key}: "${String(val).replace(/"/g, '\\"')}"\n`;
    }
  }
  return `---\n${yml}---\n\n${body}`;
}

// --- Content CRUD ---

// SHA cache: { "collection/lang/slug": sha }
const shaCache = {};

function shaKey(collection, lang, slug) {
  return `${collection}/${lang}/${slug}`;
}

export async function listEntries(collection) {
  const entries = [];

  for (const lang of ['en', 'ja']) {
    const res = await fetch(`${API}/contents/src/content/${collection}/${lang}`, { headers: headers() });
    if (!res.ok) continue;

    const files = await res.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));

    // Fetch each file's content in parallel
    const fetches = mdFiles.map(async (f) => {
      const fRes = await fetch(f.url, { headers: headers() });
      if (!fRes.ok) return null;
      const fData = await fRes.json();
      const raw = base64ToUtf8(fData.content.replace(/\n/g, ''));
      const { frontmatter } = parseMarkdown(raw);
      const slug = f.name.replace('.md', '');
      shaCache[shaKey(collection, lang, slug)] = fData.sha;
      return { ...frontmatter, _lang: lang, _file: f.name };
    });

    const results = await Promise.all(fetches);
    entries.push(...results.filter(Boolean));
  }

  return entries;
}

export async function readEntry(collection, lang, slug) {
  const res = await fetch(
    `${API}/contents/src/content/${collection}/${lang}/${slug}.md`,
    { headers: headers() }
  );

  if (!res.ok) {
    if (res.status === 401) {
      sessionStorage.removeItem('gh_pat');
      location.reload();
    }
    throw new Error(`Not found (${res.status})`);
  }

  const data = await res.json();
  const raw = base64ToUtf8(data.content.replace(/\n/g, ''));
  shaCache[shaKey(collection, lang, slug)] = data.sha;

  return { ...parseMarkdown(raw), sha: data.sha };
}

export async function writeEntry(collection, lang, slug, frontmatter, body) {
  const content = serializeMarkdown(frontmatter, body);
  const encoded = utf8ToBase64(content);
  const path = `src/content/${collection}/${lang}/${slug}.md`;
  const sha = shaCache[shaKey(collection, lang, slug)] || null;

  const payload = {
    message: `admin: ${sha ? 'update' : 'create'} ${collection}/${lang}/${slug}`,
    content: encoded,
    branch: BRANCH,
  };
  if (sha) payload.sha = sha;

  const res = await fetch(`${API}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      sessionStorage.removeItem('gh_pat');
      location.reload();
    }
    if (res.status === 409) {
      throw new Error('Conflict: file was modified elsewhere. Refresh and try again.');
    }
    throw new Error(err.message || `Save failed (${res.status})`);
  }

  const data = await res.json();
  shaCache[shaKey(collection, lang, slug)] = data.content.sha;
  return data;
}

export async function deleteEntry(collection, lang, slug) {
  const path = `src/content/${collection}/${lang}/${slug}.md`;
  let sha = shaCache[shaKey(collection, lang, slug)];

  // If no cached SHA, fetch it
  if (!sha) {
    const res = await fetch(`${API}/contents/${path}`, { headers: headers() });
    if (!res.ok) throw new Error('File not found');
    const data = await res.json();
    sha = data.sha;
  }

  const res = await fetch(`${API}/contents/${path}`, {
    method: 'DELETE',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `admin: delete ${collection}/${lang}/${slug}`,
      sha,
      branch: BRANCH,
    }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      sessionStorage.removeItem('gh_pat');
      location.reload();
    }
    throw new Error(`Delete failed (${res.status})`);
  }

  delete shaCache[shaKey(collection, lang, slug)];
}

// --- Image generation via GitHub Actions ---

export async function triggerImageGeneration(collection, slug, prompt) {
  const res = await fetch(`${API}/actions/workflows/generate-image.yml/dispatches`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref: BRANCH,
      inputs: { collection, slug, prompt },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Workflow trigger failed (${res.status})`);
  }

  return true;
}

export async function pollWorkflowStatus(workflow = 'generate-image.yml') {
  // Get the most recent workflow run
  const res = await fetch(
    `${API}/actions/workflows/${workflow}/runs?per_page=1`,
    { headers: headers() }
  );

  if (!res.ok) return null;
  const data = await res.json();
  if (!data.workflow_runs?.length) return null;

  const run = data.workflow_runs[0];
  return {
    status: run.status,       // queued, in_progress, completed
    conclusion: run.conclusion, // success, failure, null
    url: run.html_url,
  };
}

export async function triggerTranslation(collection, slug) {
  const res = await fetch(`${API}/actions/workflows/translate.yml/dispatches`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref: BRANCH,
      inputs: { collection, slug },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Translation trigger failed (${res.status})`);
  }

  return true;
}
