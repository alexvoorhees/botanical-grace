// === Kimiko Admin SPA (GitHub API version) ===

import {
  verifyCredentials, decryptPAT, validateToken,
  listEntries, readEntry, writeEntry, deleteEntry as apiDeleteEntry,
  triggerImageGeneration, pollWorkflowStatus, triggerTranslation,
} from './github-api.mjs';

let langFilter = 'all';
let uiLang = localStorage.getItem('admin_ui_lang') || 'ja';

// --- Translations ---
const I18N = {
  ja: {
    // Login
    loginTitle: 'Kimiko 管理画面',
    loginSubtitle: 'ボタニカルグレイス8',
    emailLabel: 'メールアドレス',
    passwordLabel: 'パスワード',
    loginBtn: 'ログイン',
    loggingIn: 'ログイン中...',
    invalidCredentials: 'メールアドレスまたはパスワードが正しくありません。',
    authFailed: '認証に失敗しました。管理者にお問い合わせください。',
    loginFailed: 'ログインに失敗しました。もう一度お試しください。',
    showPassword: 'パスワードを表示',
    hidePassword: 'パスワードを非表示',
    // Sidebar
    articles: '記事',
    herbs: 'ハーブ',
    courses: 'コース',
    langFilterLabel: 'コンテンツ言語:',
    langAll: 'すべて',
    langEn: '英語',
    langJa: '日本語',
    logout: 'ログアウト',
    uiLangToggle: 'English',
    // Welcome
    welcomeTitle: 'Kimiko 管理画面へようこそ',
    welcomeText: 'サイドバーからコレクションを選んでください。',
    // List
    newEntry: '＋ 新規作成',
    loading: '読み込み中...',
    noEntries: 'エントリーが見つかりません。',
    createOne: '＋ 作成する',
    errorLoading: 'エントリーの読み込みエラー:',
    deleteConfirm: (lang, slug) => `${lang}/${slug} を削除しますか？この操作は取り消せません。`,
    entryDeleted: 'エントリーを削除しました！サイトは約2分で更新されます。',
    delete: '削除',
    // Editor
    newLabel: '新規',
    editLabel: '編集',
    articleSingular: '記事',
    herbSingular: 'ハーブ',
    courseSingular: 'コース',
    back: '戻る',
    bodyLabel: '本文（Markdown）',
    saveEntry: '保存',
    cancel: 'キャンセル',
    saving: '保存中...',
    saved: '保存しました！サイトは約2分で更新されます。',
    saveFailed: '保存に失敗しました:',
    required: 'は必須です',
    mustBeNumber: 'は数値でなければなりません',
    langAndSlugRequired: '言語とスラッグは必須です。',
    // Image generation
    generateImage: '画像を生成',
    imagePromptLabel: '画像プロンプト',
    triggeringGeneration: '画像生成を開始中...',
    workflowRunning: 'ワークフロー実行中... 10秒ごとに確認しています。',
    imageGenerated: '画像が生成されました！次のデプロイ後にサイトに表示されます（約2分）。',
    imageGenFailed: '画像生成に失敗しました',
    imageGenNote: '画像生成はGitHub Actionsで実行されます。1〜2分かかり、次のデプロイ後にサイトに反映されます。',
    enterPrompt: '画像プロンプトを入力してください',
    setSlugFirst: '先にスラッグを設定してください',
    stillRunning: 'まだ実行中です。GitHub Actionsでステータスを確認してください。',
    viewDetails: '詳細を見る',
    // Translation
    saveAndTranslate: '保存して英語翻訳を作成',
    translationTriggered: '英語翻訳を開始しました...',
    translationSuccess: '英語翻訳が作成されました！次のデプロイ後にサイトに反映されます。',
    translationFailed: '翻訳に失敗しました:',
    translationRunning: '翻訳中... 10秒ごとに確認しています。',
    translationStillRunning: 'まだ翻訳中です。GitHub Actionsでステータスを確認してください。',
    saveFirstRequired: '先にエントリーを保存してください。',
    // Field labels
    fieldTitle: 'タイトル',
    fieldSlug: 'スラッグ',
    fieldLang: '言語',
    fieldDate: '日付',
    fieldImage: '画像パス',
    fieldExcerpt: '抜粋',
    fieldNameEn: '英語名',
    fieldNameJa: '日本語名',
    fieldScientificName: '学名',
    fieldActions: '効能（カンマ区切り）',
    fieldSubtitle: 'サブタイトル',
    fieldCertification: '資格',
    fieldOrder: '表示順',
    fieldPrice: '価格（¥）',
    fieldTextbookPrice: '教材費（¥）',
    fieldSessions: '回数',
    fieldTotalHours: '合計時間',
    fieldHeroImage: 'ヒーロー画像パス',
    fieldDescription: '説明',
  },
  en: {
    loginTitle: 'Kimiko Admin',
    loginSubtitle: 'Botanical Grace 8',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    loginBtn: 'Log In',
    loggingIn: 'Logging in...',
    invalidCredentials: 'Invalid email or password.',
    authFailed: 'Authentication failed. Please contact the administrator.',
    loginFailed: 'Login failed. Please try again.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    articles: 'Articles',
    herbs: 'Herbs',
    courses: 'Courses',
    langFilterLabel: 'Content language:',
    langAll: 'All',
    langEn: 'English',
    langJa: 'Japanese',
    logout: 'Log Out',
    uiLangToggle: '日本語',
    welcomeTitle: 'Welcome to Kimiko Admin',
    welcomeText: 'Select a collection from the sidebar to get started.',
    newEntry: '+ New Entry',
    loading: 'Loading...',
    noEntries: 'No entries found.',
    createOne: '+ Create One',
    errorLoading: 'Error loading entries:',
    deleteConfirm: (lang, slug) => `Delete ${lang}/${slug}? This cannot be undone.`,
    entryDeleted: 'Entry deleted! Site will update in ~2 minutes.',
    delete: 'Delete',
    newLabel: 'New',
    editLabel: 'Edit',
    articleSingular: 'Article',
    herbSingular: 'Herb',
    courseSingular: 'Course',
    back: 'Back',
    bodyLabel: 'Body (Markdown)',
    saveEntry: 'Save Entry',
    cancel: 'Cancel',
    saving: 'Saving...',
    saved: 'Saved! Site will update in ~2 minutes.',
    saveFailed: 'Save failed:',
    required: ' is required',
    mustBeNumber: ' must be a number',
    langAndSlugRequired: 'Language and slug are required.',
    generateImage: 'Generate Image',
    imagePromptLabel: 'Image Prompt',
    triggeringGeneration: 'Triggering image generation...',
    workflowRunning: 'Workflow running... checking status every 10s.',
    imageGenerated: 'Image generated! It will appear on the site after the next deploy (~2 min).',
    imageGenFailed: 'Image generation failed',
    imageGenNote: 'Image generation runs via GitHub Actions. It takes 1-2 minutes and the image will appear on the site after the next deploy.',
    enterPrompt: 'Enter an image prompt',
    setSlugFirst: 'Set a slug first',
    stillRunning: 'Still running. Check GitHub Actions for status.',
    viewDetails: 'View details',
    saveAndTranslate: 'Save & Create English Translation',
    translationTriggered: 'Starting English translation...',
    translationSuccess: 'English translation created! It will appear on the site after the next deploy.',
    translationFailed: 'Translation failed:',
    translationRunning: 'Translating... checking status every 10s.',
    translationStillRunning: 'Still translating. Check GitHub Actions for status.',
    saveFirstRequired: 'Please save the entry first.',
    fieldTitle: 'Title',
    fieldSlug: 'Slug',
    fieldLang: 'Language',
    fieldDate: 'Date',
    fieldImage: 'Image Path',
    fieldExcerpt: 'Excerpt',
    fieldNameEn: 'English Name',
    fieldNameJa: 'Japanese Name',
    fieldScientificName: 'Scientific Name',
    fieldActions: 'Actions (comma-separated)',
    fieldSubtitle: 'Subtitle',
    fieldCertification: 'Certification',
    fieldOrder: 'Display Order',
    fieldPrice: 'Price (¥)',
    fieldTextbookPrice: 'Textbook Price (¥)',
    fieldSessions: 'Sessions',
    fieldTotalHours: 'Total Hours',
    fieldHeroImage: 'Hero Image Path',
    fieldDescription: 'Description',
  },
};

function t(key) { return I18N[uiLang]?.[key] ?? I18N.en[key] ?? key; }

// Map FIELD_DEFS label keys to i18n keys
const FIELD_LABEL_MAP = {
  'Title': 'fieldTitle', 'Slug': 'fieldSlug', 'Language': 'fieldLang',
  'Date': 'fieldDate', 'Image Path': 'fieldImage', 'Excerpt': 'fieldExcerpt',
  'English Name': 'fieldNameEn', 'Japanese Name': 'fieldNameJa',
  'Scientific Name': 'fieldScientificName', 'Actions (comma-separated)': 'fieldActions',
  'Subtitle': 'fieldSubtitle', 'Certification': 'fieldCertification',
  'Display Order': 'fieldOrder', 'Price (¥)': 'fieldPrice',
  'Textbook Price (¥)': 'fieldTextbookPrice', 'Sessions': 'fieldSessions',
  'Total Hours': 'fieldTotalHours', 'Hero Image Path': 'fieldHeroImage',
  'Description': 'fieldDescription',
};

function fieldLabel(englishLabel) {
  const key = FIELD_LABEL_MAP[englishLabel];
  return key ? t(key) : englishLabel;
}

// --- SVG Icons ---
const ICONS = {
  articles: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  herbs: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21c3-3 6-6 6-12"/><path d="M12 9c0-3 2.5-6 6-7.5C18.5 5 16 9 12 9z"/><path d="M12 9c0-3-2.5-6-6-7.5C5.5 5 8 9 12 9z"/></svg>',
  courses: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="13" y2="11"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
  palette: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.21-1.01-.54-1.37-.33-.36-.46-.85-.46-1.13 0-1.1.9-2 2-2h2.36c3.08 0 5.64-2.56 5.64-5.64C23 5.82 18.14 2 12 2z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="9.5" cy="7.5" r="1.5"/><circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  logout: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
};

// --- Login ---

async function initLogin() {
  // Check if already authenticated
  if (sessionStorage.getItem('gh_pat')) {
    showApp();
    return;
  }
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';

  // Password show/hide toggle
  const pwToggle = document.getElementById('password-toggle');
  const pwInput = document.getElementById('login-password');
  if (pwToggle && pwInput) {
    pwToggle.addEventListener('click', () => {
      const show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      pwToggle.querySelector('.icon-eye-open').style.display = show ? 'none' : '';
      pwToggle.querySelector('.icon-eye-closed').style.display = show ? '' : 'none';
      pwToggle.setAttribute('aria-label', show ? t('hidePassword') : t('showPassword'));
    });
  }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = t('loggingIn');

    try {
      const valid = await verifyCredentials(email, password);
      if (!valid) {
        errEl.textContent = t('invalidCredentials');
        return;
      }

      const pat = await decryptPAT(password);
      sessionStorage.setItem('gh_pat', pat);

      const tokenOk = await validateToken();
      if (!tokenOk) {
        sessionStorage.removeItem('gh_pat');
        errEl.textContent = t('authFailed');
        return;
      }

      showApp();
    } catch (err) {
      errEl.textContent = t('loginFailed');
    } finally {
      btn.disabled = false;
      btn.textContent = t('loginBtn');
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

function updateSidebarLang() {
  // Update nav labels
  document.querySelector('[data-collection="articles"] .nav-label').textContent = t('articles');
  document.querySelector('[data-collection="herbs"] .nav-label').textContent = t('herbs');
  document.querySelector('[data-collection="courses"] .nav-label').textContent = t('courses');

  // Update sidebar header
  document.querySelector('.sidebar-header h1').textContent = t('loginTitle');
  document.querySelector('.sidebar-header p').textContent = t('loginSubtitle');

  // Update lang filter
  document.querySelector('.lang-filter label').textContent = t('langFilterLabel');
  const filterSelect = document.getElementById('lang-filter');
  filterSelect.options[0].textContent = t('langAll');
  filterSelect.options[1].textContent = t('langEn');
  filterSelect.options[2].textContent = t('langJa');

  // Update logout button
  document.getElementById('btn-logout').textContent = t('logout');

  // Update UI lang toggle
  document.getElementById('btn-ui-lang').textContent = t('uiLangToggle');

  // Update login screen if visible
  const loginTitle = document.querySelector('.login-card h1');
  if (loginTitle) {
    loginTitle.textContent = t('loginTitle');
    document.querySelector('.login-subtitle').textContent = t('loginSubtitle');
    document.querySelector('[for="login-email"]').textContent = t('emailLabel');
    document.querySelector('[for="login-password"]').textContent = t('passwordLabel');
    const loginBtn = document.getElementById('login-btn');
    if (!loginBtn.disabled) loginBtn.textContent = t('loginBtn');
  }
}

function toggleUiLang() {
  uiLang = uiLang === 'ja' ? 'en' : 'ja';
  localStorage.setItem('admin_ui_lang', uiLang);
  updateSidebarLang();
  route(); // re-render current view
}

function init() {
  document.getElementById('lang-filter').addEventListener('change', (e) => {
    langFilter = e.target.value;
    route();
  });
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('btn-ui-lang').addEventListener('click', toggleUiLang);
  updateSidebarLang();
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
      <h2>${t('welcomeTitle')}</h2>
      <p>${t('welcomeText')}</p>
      <div class="welcome-cards">
        <a href="#articles" class="welcome-card"><span class="welcome-icon">${ICONS.articles}</span><span>${t('articles')}</span></a>
        <a href="#herbs" class="welcome-card"><span class="welcome-icon">${ICONS.herbs}</span><span>${t('herbs')}</span></a>
        <a href="#courses" class="welcome-card"><span class="welcome-icon">${ICONS.courses}</span><span>${t('courses')}</span></a>
      </div>
    </div>`;
}

// --- List View ---

function collectionLabel(col) { return t(col); }
const COLLECTION_SINGULARS = { articles: 'articleSingular', herbs: 'herbSingular', courses: 'courseSingular' };
const COLLECTION_ICONS = { articles: ICONS.articles, herbs: ICONS.herbs, courses: ICONS.courses };

async function renderList(collection) {
  const main = document.getElementById('content');
  main.innerHTML = `
    <div class="list-header">
      <h2>${collectionLabel(collection)}</h2>
      <a href="#new/${collection}" class="btn-new">${t('newEntry')}</a>
    </div>
    <div class="entry-grid" id="entry-grid">
      <div class="empty-state"><p>${t('loading')}</p></div>
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
      grid.innerHTML = `<div class="empty-state"><p>${t('noEntries')}</p><a href="#new/${collection}" class="btn-new">${t('createOne')}</a></div>`;
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
            <button class="btn-delete" onclick="event.stopPropagation(); window._deleteEntry('${collection}', '${lang}', '${slug}')" title="${t('delete')}">${ICONS.trash}</button>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    document.getElementById('entry-grid').innerHTML = `<div class="empty-state"><p>${t('errorLoading')} ${esc(err.message)}</p></div>`;
  }
}

function entryMeta(collection, entry) {
  if (collection === 'articles') return `<span>${entry.date || ''}</span>`;
  if (collection === 'herbs') return `<span>${esc(entry.scientificName || '')}</span>`;
  if (collection === 'courses') return `<span>${entry.certification || ''}</span><span>\u00A5${(entry.price || 0).toLocaleString()}</span>`;
  return '';
}

window._deleteEntry = async function(collection, lang, slug) {
  if (!confirm(t('deleteConfirm')(lang, slug))) return;
  try {
    await apiDeleteEntry(collection, lang, slug);
    toast(t('entryDeleted'), 'success');
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

  main.innerHTML = `<div class="empty-state"><p>${t('loading')}</p></div>`;

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
    frontmatter.lang = 'ja';
    if (collection === 'articles') {
      frontmatter.date = new Date().toISOString().slice(0, 10);
    }
  }

  const fields = FIELD_DEFS[collection] || [];

  const singularKey = COLLECTION_SINGULARS[collection];
  const label = `${isNew ? t('newLabel') : t('editLabel')} ${t(singularKey)}`;

  main.innerHTML = `
    <div class="form-header">
      <a href="#${collection}" class="btn-back">${ICONS.back} ${t('back')}</a>
      <h2>${label}</h2>
    </div>
    <div class="edit-form">
      <div class="form-grid">
        ${fields.map(f => renderField(f, frontmatter)).join('')}
        ${renderImagePanel(collection, frontmatter)}
        <div class="form-group full">
          <label for="field-body">${t('bodyLabel')}</label>
          <textarea id="field-body" class="body-editor">${esc(body)}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-save" id="btn-save">${t('saveEntry')}</button>
        ${!isNew && frontmatter.lang === 'ja' ? `<button class="btn-translate" id="btn-translate">${t('saveAndTranslate')}</button>` : ''}
        <a href="#${collection}" class="btn-cancel">${t('cancel')}</a>
      </div>
      <div id="translate-status"></div>
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

  const translateBtn = document.getElementById('btn-translate');
  if (translateBtn) {
    translateBtn.addEventListener('click', () => saveAndTranslate(collection, isNew));
  }

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
  const label = fieldLabel(field.label);

  if (field.type === 'select') {
    const opts = field.options.map(o =>
      `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`
    ).join('');
    return `<div class="${cls}"><label for="field-${field.key}">${label}</label><select id="field-${field.key}"${req}>${opts}</select></div>`;
  }

  if (field.type === 'textarea-sm') {
    return `<div class="${cls}"><label for="field-${field.key}">${label}</label><textarea id="field-${field.key}" rows="3"${req}>${esc(String(val))}</textarea></div>`;
  }

  const inputType = field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text';
  return `<div class="${cls}"><label for="field-${field.key}">${label}</label><input type="${inputType}" id="field-${field.key}" value="${esc(String(val))}"${req}></div>`;
}

function renderImagePanel(collection, frontmatter) {
  if (collection === 'courses') return '';

  const promptTemplate = collection === 'herbs'
    ? `${frontmatter.nameEn || frontmatter.title || '[Herb name]'} (${frontmatter.scientificName || '[Scientific name]'}) with distinctive flowers and leaves. Elegant botanical watercolor illustration on a clean off-white (#FAFAF5) background. Soft naturalistic style with gentle shadows. Minimalist composition, no text or labels.`
    : `[Describe the scene relevant to this article]. Wellness aesthetic. Elegant botanical watercolor illustration on a clean off-white (#FAFAF5) background. Soft naturalistic style with gentle shadows. Minimalist composition, no text or labels.`;

  return `
    <div class="form-group full">
      <details class="image-panel">
        <summary>${ICONS.palette} ${t('generateImage')}</summary>
        <div class="image-panel-content">
          <label style="font-size:0.75rem;font-weight:600;color:var(--text-muted);margin-top:0.5rem;display:block;">${t('imagePromptLabel')}</label>
          <textarea id="image-prompt">${esc(promptTemplate)}</textarea>
          <button class="btn-generate" id="btn-generate-image">${ICONS.palette} ${t('generateImage')}</button>
          <div id="image-gen-status"></div>
          <p class="image-gen-note">${t('imageGenNote')}</p>
        </div>
      </details>
    </div>`;
}

async function generateImage(collection) {
  const btn = document.getElementById('btn-generate-image');
  const status = document.getElementById('image-gen-status');
  const prompt = document.getElementById('image-prompt').value.trim();
  const slug = document.getElementById('field-slug')?.value.trim();

  if (!prompt) { toast(t('enterPrompt'), 'error'); return; }
  if (!slug) { toast(t('setSlugFirst'), 'error'); return; }

  btn.disabled = true;
  status.innerHTML = `<div class="generating-spinner"><div class="spinner"></div>${t('triggeringGeneration')}</div>`;

  try {
    await triggerImageGeneration(collection, slug, prompt);

    // Update image path field
    const imgField = document.getElementById('field-image');
    if (imgField) imgField.value = `/Kimiko_Site/images/${collection}/${slug}.png`;

    status.innerHTML = `<div class="generating-spinner"><div class="spinner"></div>${t('workflowRunning')}</div>`;

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
            status.innerHTML = `<p style="color:var(--sage-600);font-size:0.8125rem;">${t('imageGenerated')}</p>`;
            toast(t('imageGenerated'), 'success');
          } else {
            status.innerHTML = `<p style="color:#c44;font-size:0.8125rem;">${t('imageGenFailed')}. <a href="${run.url}" target="_blank">${t('viewDetails')}</a></p>`;
            toast(t('imageGenFailed'), 'error');
          }
          btn.disabled = false;
        }
      } catch { /* ignore poll errors */ }

      if (attempts >= maxAttempts) {
        clearInterval(poll);
        status.innerHTML = `<p style="font-size:0.8125rem;">${t('stillRunning')}</p>`;
        btn.disabled = false;
      }
    }, 10000);

  } catch (err) {
    status.innerHTML = '';
    toast(`${t('imageGenFailed')}: ${err.message}`, 'error');
    btn.disabled = false;
  }
}

// --- Save ---

async function saveEntryAndReturn(collection, isNew) {
  const fields = FIELD_DEFS[collection];
  const frontmatter = {};

  for (const f of fields) {
    const el = document.getElementById(`field-${f.key}`);
    if (!el) continue;
    let val = el.value.trim();

    if (f.required && !val) {
      toast(`${fieldLabel(f.label)}${t('required')}`, 'error');
      el.focus();
      return false;
    }

    if (f.type === 'number' && val !== '') {
      val = Number(val);
      if (isNaN(val)) { toast(`${fieldLabel(f.label)}${t('mustBeNumber')}`, 'error'); el.focus(); return false; }
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
    toast(t('langAndSlugRequired'), 'error');
    return false;
  }

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = t('saving');

  try {
    await writeEntry(collection, lang, slug, frontmatter, body);
    toast(t('saved'), 'success');
    delete entryCache[collection];
    loadCounts();

    if (isNew) {
      location.hash = `edit/${collection}/${lang}/${slug}`;
    }
    return true;
  } catch (err) {
    toast(`${t('saveFailed')} ${err.message}`, 'error');
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = t('saveEntry');
  }
}

async function saveEntry(collection, isNew) {
  await saveEntryAndReturn(collection, isNew);
}

// --- Save & Translate ---

async function saveAndTranslate(collection, isNew) {
  // First save the entry
  const saved = await saveEntryAndReturn(collection, isNew);
  if (!saved) return;

  const slug = document.getElementById('field-slug')?.value.trim();
  if (!slug) { toast(t('saveFirstRequired'), 'error'); return; }

  const btn = document.getElementById('btn-translate');
  const status = document.getElementById('translate-status');
  btn.disabled = true;
  status.innerHTML = `<div class="generating-spinner"><div class="spinner"></div>${t('translationTriggered')}</div>`;

  try {
    await triggerTranslation(collection, slug);
    status.innerHTML = `<div class="generating-spinner"><div class="spinner"></div>${t('translationRunning')}</div>`;

    let attempts = 0;
    const maxAttempts = 30;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const run = await pollWorkflowStatus('translate.yml');
        if (run && run.status === 'completed') {
          clearInterval(poll);
          if (run.conclusion === 'success') {
            status.innerHTML = `<p style="color:var(--sage-600);font-size:0.8125rem;">${t('translationSuccess')}</p>`;
            toast(t('translationSuccess'), 'success');
            delete entryCache[collection];
            loadCounts();
          } else {
            status.innerHTML = `<p style="color:#c44;font-size:0.8125rem;">${t('translationFailed')} <a href="${run.url}" target="_blank">${t('viewDetails')}</a></p>`;
            toast(t('translationFailed'), 'error');
          }
          btn.disabled = false;
        }
      } catch { /* ignore poll errors */ }

      if (attempts >= maxAttempts) {
        clearInterval(poll);
        status.innerHTML = `<p style="font-size:0.8125rem;">${t('translationStillRunning')}</p>`;
        btn.disabled = false;
      }
    }, 10000);

  } catch (err) {
    status.innerHTML = '';
    toast(`${t('translationFailed')} ${err.message}`, 'error');
    btn.disabled = false;
  }
}

// --- Utilities ---

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
