// === Kimiko Admin SPA (GitHub API version) ===

import {
  verifyCredentials, decryptPAT, validateToken,
  listEntries, readEntry, writeEntry, deleteEntry as apiDeleteEntry,
  triggerImageGeneration, pollWorkflowStatus,
} from './github-api.mjs';

let langFilter = 'all';

// --- Login ---

async function initLogin() {
  // Check if already authenticated
  if (sessionStorage.getItem('gh_pat')) {
    showApp();
    return;
  }
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const valid = await verifyCredentials(email, password);
      if (!valid) {
        errEl.textContent = 'Invalid email or password.';
        return;
      }

      const pat = await decryptPAT(password);
      sessionStorage.setItem('gh_pat', pat);

      const tokenOk = await validateToken();
      if (!tokenOk) {
        sessionStorage.removeItem('gh_pat');
        errEl.textContent = 'Authentication failed. Please contact the administrator.';
        return;
      }

      showApp();
    } catch (err) {
      errEl.textContent = 'Login failed. Please try again.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  });
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  loadCounts();
  route();
}

function logout() {
  sessionStorage.removeItem('gh_pat');
  location.reload();
}

// --- Router ---

function route() {
  const hash = location.hash.slice(1) || '';
  const parts = hash.split('/');

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.collection === parts[0]);
  });

  if (parts[0] === 'edit' && parts.length === 4) {
    renderEditor(parts[1], parts[2], parts[3]);
  } else if (parts[0] === 'new' && parts.length === 2) {
    renderEditor(parts[1], null, null);
  } else if (['articles', 'herbs', 'courses'].includes(parts[0])) {
    renderList(parts[0]);
  } else {
    showWelcome();
  }
}

window.addEventListener('hashchange', route);

// --- Init ---

function init() {
  document.getElementById('lang-filter').addEventListener('change', (e) => {
    langFilter = e.target.value;
    route();
  });
  document.getElementById('btn-logout').addEventListener('click', logout);
  initLogin();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// --- Entry cache ---
const entryCache = {};

async function loadCounts() {
  for (const col of ['articles', 'herbs', 'courses']) {
    try {
      const entries = await listEntries(col);
      entryCache[col] = entries;
      document.getElementById(`count-${col}`).textContent = entries.length;
    } catch {
      document.getElementById(`count-${col}`).textContent = '?';
    }
  }
}

// --- Toast ---

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

// --- Welcome ---

function showWelcome() {
  const main = document.getElementById('content');
  main.innerHTML = `
    <div class="welcome-screen">
      <h2>Welcome to Kimiko Admin</h2>
      <p>Select a collection from the sidebar to get started.</p>
      <div class="welcome-cards">
        <a href="#articles" class="welcome-card"><span class="welcome-icon">\u{1F4DD}</span><span>Articles</span></a>
        <a href="#herbs" class="welcome-card"><span class="welcome-icon">\u{1F33F}</span><span>Herbs</span></a>
        <a href="#courses" class="welcome-card"><span class="welcome-icon">\u{1F4DA}</span><span>Courses</span></a>
      </div>
    </div>`;
}

// --- List View ---

const COLLECTION_LABELS = { articles: 'Articles', herbs: 'Herbs', courses: 'Courses' };
const COLLECTION_ICONS = { articles: '\u{1F4DD}', herbs: '\u{1F33F}', courses: '\u{1F4DA}' };

async function renderList(collection) {
  const main = document.getElementById('content');
  main.innerHTML = `
    <div class="list-header">
      <h2>${COLLECTION_LABELS[collection]}</h2>
      <a href="#new/${collection}" class="btn-new">+ New Entry</a>
    </div>
    <div class="entry-grid" id="entry-grid">
      <div class="empty-state"><p>Loading...</p></div>
    </div>`;

  try {
    let entries = entryCache[collection];
    if (!entries) {
      entries = await listEntries(collection);
      entryCache[collection] = entries;
    }

    const filtered = langFilter === 'all'
      ? entries
      : entries.filter(e => (e.lang || e._lang) === langFilter);

    filtered.sort((a, b) => {
      if (collection === 'courses') return (a.order || 0) - (b.order || 0);
      if (collection === 'articles') return (b.date || '').localeCompare(a.date || '');
      return (a.title || '').localeCompare(b.title || '');
    });

    const grid = document.getElementById('entry-grid');

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>No entries found.</p><a href="#new/${collection}" class="btn-new">+ Create One</a></div>`;
      return;
    }

    grid.innerHTML = filtered.map(entry => {
      const lang = entry.lang || entry._lang;
      const slug = entry.slug || entry._file?.replace('.md', '');
      const meta = entryMeta(collection, entry);

      return `
        <div class="entry-card" onclick="location.hash='edit/${collection}/${lang}/${slug}'">
          <div class="entry-thumb">
            ${COLLECTION_ICONS[collection]}
          </div>
          <div class="entry-info">
            <div class="entry-title">${esc(entry.title || slug)}</div>
            <div class="entry-meta">
              <span class="lang-badge ${lang}">${lang}</span>
              ${meta}
            </div>
          </div>
          <div class="entry-actions">
            <button class="btn-delete" onclick="event.stopPropagation(); window._deleteEntry('${collection}', '${lang}', '${slug}')" title="Delete">\u{1F5D1}</button>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    document.getElementById('entry-grid').innerHTML = `<div class="empty-state"><p>Error loading entries: ${esc(err.message)}</p></div>`;
  }
}

function entryMeta(collection, entry) {
  if (collection === 'articles') return `<span>${entry.date || ''}</span>`;
  if (collection === 'herbs') return `<span>${esc(entry.scientificName || '')}</span>`;
  if (collection === 'courses') return `<span>${entry.certification || ''}</span><span>\u00A5${(entry.price || 0).toLocaleString()}</span>`;
  return '';
}

window._deleteEntry = async function(collection, lang, slug) {
  if (!confirm(`Delete ${lang}/${slug}? This cannot be undone.`)) return;
  try {
    await apiDeleteEntry(collection, lang, slug);
    toast('Entry deleted! Site will update in ~2 minutes.', 'success');
    delete entryCache[collection];
    loadCounts();
    renderList(collection);
  } catch (err) {
    toast(err.message, 'error');
  }
};

// --- Editor ---

const FIELD_DEFS = {
  articles: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'slug', label: 'Slug', type: 'text', required: true, half: true },
    { key: 'lang', label: 'Language', type: 'select', options: ['en', 'ja'], required: true, half: true },
    { key: 'date', label: 'Date', type: 'date', required: true, half: true },
    { key: 'image', label: 'Image Path', type: 'text', half: true },
    { key: 'excerpt', label: 'Excerpt', type: 'textarea-sm', required: true },
  ],
  herbs: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'nameEn', label: 'English Name', type: 'text', required: true, half: true },
    { key: 'nameJa', label: 'Japanese Name', type: 'text', required: true, half: true },
    { key: 'scientificName', label: 'Scientific Name', type: 'text', required: true, half: true },
    { key: 'slug', label: 'Slug', type: 'text', required: true, half: true },
    { key: 'lang', label: 'Language', type: 'select', options: ['en', 'ja'], required: true, half: true },
    { key: 'image', label: 'Image Path', type: 'text', half: true },
    { key: 'actions', label: 'Actions (comma-separated)', type: 'text', required: true },
  ],
  courses: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'slug', label: 'Slug', type: 'text', required: true, half: true },
    { key: 'lang', label: 'Language', type: 'select', options: ['en', 'ja'], required: true, half: true },
    { key: 'certification', label: 'Certification', type: 'text', required: true, half: true },
    { key: 'order', label: 'Display Order', type: 'number', required: true, half: true },
    { key: 'price', label: 'Price (\u00A5)', type: 'number', required: true, half: true },
    { key: 'textbookPrice', label: 'Textbook Price (\u00A5)', type: 'number', half: true },
    { key: 'sessions', label: 'Sessions', type: 'number', required: true, half: true },
    { key: 'totalHours', label: 'Total Hours', type: 'number', required: true, half: true },
    { key: 'image', label: 'Image Path', type: 'text', half: true },
    { key: 'heroImage', label: 'Hero Image Path', type: 'text', half: true },
    { key: 'description', label: 'Description', type: 'textarea-sm', required: true },
  ],
};

async function renderEditor(collection, lang, slug) {
  const isNew = !lang || !slug;
  const main = document.getElementById('content');
  let frontmatter = {};
  let body = '';

  main.innerHTML = `<div class="empty-state"><p>Loading...</p></div>`;

  if (!isNew) {
    try {
      const data = await readEntry(collection, lang, slug);
      frontmatter = data.frontmatter;
      body = data.body;
    } catch (err) {
      main.innerHTML = `<p>Error: ${esc(err.message)}</p>`;
      return;
    }
  } else {
    frontmatter.lang = 'en';
    if (collection === 'articles') {
      frontmatter.date = new Date().toISOString().slice(0, 10);
    }
  }

  const fields = FIELD_DEFS[collection] || [];

  main.innerHTML = `
    <div class="form-header">
      <a href="#${collection}" class="btn-back">\u2190 Back</a>
      <h2>${isNew ? 'New' : 'Edit'} ${COLLECTION_LABELS[collection].slice(0, -1)}</h2>
    </div>
    <div class="edit-form">
      <div class="form-grid">
        ${fields.map(f => renderField(f, frontmatter)).join('')}
        ${renderImagePanel(collection, frontmatter)}
        <div class="form-group full">
          <label for="field-body">Body (Markdown)</label>
          <textarea id="field-body" class="body-editor">${esc(body)}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-save" id="btn-save">Save Entry</button>
        <a href="#${collection}" class="btn-cancel">Cancel</a>
      </div>
    </div>`;

  // Auto-slug from title
  const titleEl = document.getElementById('field-title');
  const slugEl = document.getElementById('field-slug');
  if (titleEl && slugEl && isNew) {
    titleEl.addEventListener('input', () => {
      slugEl.value = titleEl.value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    });
  }

  document.getElementById('btn-save').addEventListener('click', () => saveEntry(collection, isNew));

  const genBtn = document.getElementById('btn-generate-image');
  if (genBtn) {
    genBtn.addEventListener('click', () => generateImage(collection));
  }
}

function renderField(field, data) {
  const val = field.key === 'actions' && Array.isArray(data[field.key])
    ? data[field.key].join(', ')
    : (data[field.key] ?? '');
  const cls = field.half ? 'form-group' : 'form-group full';
  const req = field.required ? ' required' : '';

  if (field.type === 'select') {
    const opts = field.options.map(o =>
      `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`
    ).join('');
    return `<div class="${cls}"><label for="field-${field.key}">${field.label}</label><select id="field-${field.key}"${req}>${opts}</select></div>`;
  }

  if (field.type === 'textarea-sm') {
    return `<div class="${cls}"><label for="field-${field.key}">${field.label}</label><textarea id="field-${field.key}" rows="3"${req}>${esc(String(val))}</textarea></div>`;
  }

  const inputType = field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text';
  return `<div class="${cls}"><label for="field-${field.key}">${field.label}</label><input type="${inputType}" id="field-${field.key}" value="${esc(String(val))}"${req}></div>`;
}

function renderImagePanel(collection, frontmatter) {
  if (collection === 'courses') return '';

  const promptTemplate = collection === 'herbs'
    ? `${frontmatter.nameEn || frontmatter.title || '[Herb name]'} (${frontmatter.scientificName || '[Scientific name]'}) with distinctive flowers and leaves. Elegant botanical watercolor illustration on a clean off-white (#FAFAF5) background. Soft naturalistic style with gentle shadows. Minimalist composition, no text or labels.`
    : `[Describe the scene relevant to this article]. Wellness aesthetic. Elegant botanical watercolor illustration on a clean off-white (#FAFAF5) background. Soft naturalistic style with gentle shadows. Minimalist composition, no text or labels.`;

  return `
    <div class="form-group full">
      <details class="image-panel">
        <summary>\u{1F3A8} Generate Image</summary>
        <div class="image-panel-content">
          <label style="font-size:0.75rem;font-weight:600;color:var(--text-muted);margin-top:0.5rem;display:block;">Image Prompt</label>
          <textarea id="image-prompt">${esc(promptTemplate)}</textarea>
          <button class="btn-generate" id="btn-generate-image">\u{1F3A8} Generate Image</button>
          <div id="image-gen-status"></div>
          <p class="image-gen-note">Image generation runs via GitHub Actions. It takes 1-2 minutes and the image will appear on the site after the next deploy.</p>
        </div>
      </details>
    </div>`;
}

async function generateImage(collection) {
  const btn = document.getElementById('btn-generate-image');
  const status = document.getElementById('image-gen-status');
  const prompt = document.getElementById('image-prompt').value.trim();
  const slug = document.getElementById('field-slug')?.value.trim();

  if (!prompt) { toast('Enter an image prompt', 'error'); return; }
  if (!slug) { toast('Set a slug first', 'error'); return; }

  btn.disabled = true;
  status.innerHTML = '<div class="generating-spinner"><div class="spinner"></div>Triggering image generation...</div>';

  try {
    await triggerImageGeneration(collection, slug, prompt);

    // Update image path field
    const imgField = document.getElementById('field-image');
    if (imgField) imgField.value = `/Kimiko_Site/images/${collection}/${slug}.png`;

    status.innerHTML = '<div class="generating-spinner"><div class="spinner"></div>Workflow running... checking status every 10s.</div>';

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    const poll = setInterval(async () => {
      attempts++;
      try {
        const run = await pollWorkflowStatus();
        if (run && run.status === 'completed') {
          clearInterval(poll);
          if (run.conclusion === 'success') {
            status.innerHTML = '<p style="color:var(--sage-600);font-size:0.8125rem;">Image generated! It will appear on the site after the next deploy (~2 min).</p>';
            toast('Image generated!', 'success');
          } else {
            status.innerHTML = `<p style="color:#c44;font-size:0.8125rem;">Workflow failed. <a href="${run.url}" target="_blank">View details</a></p>`;
            toast('Image generation failed', 'error');
          }
          btn.disabled = false;
        }
      } catch { /* ignore poll errors */ }

      if (attempts >= maxAttempts) {
        clearInterval(poll);
        status.innerHTML = '<p style="font-size:0.8125rem;">Still running. Check GitHub Actions for status.</p>';
        btn.disabled = false;
      }
    }, 10000);

  } catch (err) {
    status.innerHTML = '';
    toast(`Image generation failed: ${err.message}`, 'error');
    btn.disabled = false;
  }
}

// --- Save ---

async function saveEntry(collection, isNew) {
  const fields = FIELD_DEFS[collection];
  const frontmatter = {};

  for (const f of fields) {
    const el = document.getElementById(`field-${f.key}`);
    if (!el) continue;
    let val = el.value.trim();

    if (f.required && !val) {
      toast(`${f.label} is required`, 'error');
      el.focus();
      return;
    }

    if (f.type === 'number' && val !== '') {
      val = Number(val);
      if (isNaN(val)) { toast(`${f.label} must be a number`, 'error'); el.focus(); return; }
    }

    if (f.key === 'actions') {
      val = val.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (val !== '' && val !== undefined) {
      frontmatter[f.key] = val;
    }
  }

  const body = document.getElementById('field-body').value;
  const lang = frontmatter.lang;
  const slug = frontmatter.slug;

  if (!lang || !slug) {
    toast('Language and slug are required', 'error');
    return;
  }

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    await writeEntry(collection, lang, slug, frontmatter, body);
    toast('Saved! Site will update in ~2 minutes.', 'success');
    delete entryCache[collection];
    loadCounts();

    if (isNew) {
      location.hash = `edit/${collection}/${lang}/${slug}`;
    }
  } catch (err) {
    toast(`Save failed: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Entry';
  }
}

// --- Utilities ---

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
