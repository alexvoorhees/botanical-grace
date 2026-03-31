// === Kimiko Admin SPA (GitHub API version) ===

import {
  verifyCredentials, decryptPAT, validateToken,
  listEntries, readEntry, writeEntry, deleteEntry as apiDeleteEntry,
  triggerImageGeneration, pollWorkflowStatus, triggerTranslation,
} from './github-api.mjs';

let uiLang = localStorage.getItem('admin_ui_lang') || 'ja';
const GOATCOUNTER_CODE = 'botanicalgrace';

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
    welcomeGreetingMorning: 'おはようございます、きみこ先生',
    welcomeGreetingAfternoon: 'こんにちは、きみこ先生',
    welcomeGreetingEvening: 'こんばんは、きみこ先生',
    welcomeStatsTitle: 'サイト訪問者',
    welcomeStatsLoading: '読み込み中...',
    welcomeStatsError: '統計を取得できませんでした',
    welcomeStatsDetail: '詳細を見る →',
    // List
    newEntry: '＋ 新規作成',
    loading: '読み込み中...',
    noEntries: 'エントリーが見つかりません。',
    createOne: '＋ 作成する',
    errorLoading: 'エントリーの読み込みエラー:',
    deleteConfirm: (lang, slug) => `${slug} を削除しますか？この操作は取り消せません。`,
    deleteBothConfirm: (slug) => `${slug} の日本語版・英語版の両方を削除しますか？この操作は取り消せません。`,
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
    imagePromptPlaceholder: '記事に関連するシーンを説明してください（例：ハーブティーを淹れている様子）',
    imageStyleNote: '水彩ボタニカルスタイルは自動で適用されます。シーンの説明だけ入力してください。',
    enterPrompt: '画像の説明を入力してください',
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
    creatingLangVersion: '{lang}版を新規作成します。内容を入力して保存してください。',
    viewOnSite: 'サイトで見る',
    unsavedChanges: '保存されていない変更があります。このまま移動しますか？',
    // Markdown toolbar
    mdBold: '太字',
    mdItalic: '斜体',
    mdH2: '見出し2',
    mdH3: '見出し3',
    mdList: 'リスト',
    mdLink: 'リンク',
    mdBoldPlaceholder: '太字テキスト',
    mdItalicPlaceholder: '斜体テキスト',
    mdHeadingPlaceholder: '見出し',
    mdListPlaceholder: 'リスト項目',
    mdLinkText: 'リンクテキスト',
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
    welcomeGreetingMorning: 'Good morning, Kimiko-sensei',
    welcomeGreetingAfternoon: 'Good afternoon, Kimiko-sensei',
    welcomeGreetingEvening: 'Good evening, Kimiko-sensei',
    welcomeStatsTitle: 'Site Visitors',
    welcomeStatsLoading: 'Loading...',
    welcomeStatsError: 'Could not load stats',
    welcomeStatsDetail: 'View details →',
    newEntry: '+ New Entry',
    loading: 'Loading...',
    noEntries: 'No entries found.',
    createOne: '+ Create One',
    errorLoading: 'Error loading entries:',
    deleteConfirm: (lang, slug) => `Delete ${slug}? This cannot be undone.`,
    deleteBothConfirm: (slug) => `Delete both Japanese and English versions of ${slug}? This cannot be undone.`,
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
    imagePromptPlaceholder: 'Describe the scene for this article (e.g., a person brewing herbal tea)',
    imageStyleNote: 'Watercolor botanical style is applied automatically. Just describe the scene.',
    enterPrompt: 'Enter a scene description',
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
    creatingLangVersion: 'Creating new {lang} version. Enter content and save.',
    viewOnSite: 'View on site',
    unsavedChanges: 'You have unsaved changes. Leave anyway?',
    mdBold: 'Bold',
    mdItalic: 'Italic',
    mdH2: 'Heading 2',
    mdH3: 'Heading 3',
    mdList: 'List',
    mdLink: 'Link',
    mdBoldPlaceholder: 'bold text',
    mdItalicPlaceholder: 'italic text',
    mdHeadingPlaceholder: 'Heading',
    mdListPlaceholder: 'List item',
    mdLinkText: 'link text',
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
  externalLink: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
};

// --- Unsaved changes tracking ---
let formDirty = false;

function markDirty() { formDirty = true; }
function clearDirty() { formDirty = false; }

function confirmLeave() {
  if (!formDirty) return true;
  return confirm(t('unsavedChanges'));
}

// Warn on tab close/refresh
window.addEventListener('beforeunload', (e) => {
  if (formDirty) { e.preventDefault(); }
});

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

let previousHash = '';

function route() {
  const hash = location.hash.slice(1) || '';
  const parts = hash.split('/');

  // Check for unsaved changes when navigating away from editor
  if (formDirty && previousHash !== hash) {
    if (!confirm(t('unsavedChanges'))) {
      // Restore the previous hash without triggering another hashchange
      history.replaceState(null, '', '#' + previousHash);
      return;
    }
    clearDirty();
  }
  previousHash = hash;

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
  // Update nav labels (guard against null in case DOM isn't ready)
  const articlesNav = document.querySelector('[data-collection="articles"] .nav-label');
  const herbsNav = document.querySelector('[data-collection="herbs"] .nav-label');
  const coursesNav = document.querySelector('[data-collection="courses"] .nav-label');
  if (articlesNav) articlesNav.textContent = t('articles');
  if (herbsNav) herbsNav.textContent = t('herbs');
  if (coursesNav) coursesNav.textContent = t('courses');

  // Update logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.textContent = t('logout');

  // Update UI lang toggle
  const uiLangBtn = document.getElementById('btn-ui-lang');
  if (uiLangBtn) uiLangBtn.textContent = t('uiLangToggle');

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
      // Count unique slugs, not total files
      const slugs = new Set(entries.map(e => e.slug || e._file?.replace('.md', '')));
      document.getElementById(`count-${col}`).textContent = slugs.size;
    } catch {
      document.getElementById(`count-${col}`).textContent = '?';
    }
  }
}

/** Group entries by slug, merging ja/en versions */
function groupBySlug(entries) {
  const map = {};
  for (const entry of entries) {
    const slug = entry.slug || entry._file?.replace('.md', '');
    const lang = entry.lang || entry._lang;
    if (!map[slug]) map[slug] = { slug, langs: {} };
    map[slug].langs[lang] = entry;
  }
  return Object.values(map);
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t('welcomeGreetingMorning');
  if (hour < 17) return t('welcomeGreetingAfternoon');
  return t('welcomeGreetingEvening');
}

function getSeasonalEmoji() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return '🌸';
  if (month >= 5 && month <= 7) return '🌿';
  if (month >= 8 && month <= 10) return '🍂';
  return '❄️';
}

async function fetchVisitorStats() {
  try {
    const res = await fetch(`https://${GOATCOUNTER_CODE}.goatcounter.com/counter//TOTAL.json`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return { total: data.count_unique || data.count || '—' };
  } catch {
    return null;
  }
}

function showWelcome() {
  const main = document.getElementById('content');
  const emoji = getSeasonalEmoji();
  const greeting = getGreeting();

  main.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-greeting">
        <span class="greeting-emoji">${emoji}</span>
        <h2 class="greeting-text">${greeting}</h2>
        <p class="greeting-subtitle">${t('welcomeText')}</p>
      </div>

      <div class="welcome-stats">
        <div class="stats-card">
          <span class="stats-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <span class="stats-label">${t('welcomeStatsTitle')}</span>
          <span class="stats-value" id="stats-total">${t('welcomeStatsLoading')}</span>
          <a href="https://${GOATCOUNTER_CODE}.goatcounter.com" target="_blank" rel="noopener" class="stats-link">
            ${t('welcomeStatsDetail')}
          </a>
        </div>
      </div>

      <div class="welcome-cards">
        <a href="#articles" class="welcome-card"><span class="welcome-icon">${ICONS.articles}</span><span>${t('articles')}</span></a>
        <a href="#herbs" class="welcome-card"><span class="welcome-icon">${ICONS.herbs}</span><span>${t('herbs')}</span></a>
        <a href="#courses" class="welcome-card"><span class="welcome-icon">${ICONS.courses}</span><span>${t('courses')}</span></a>
      </div>
    </div>`;

  fetchVisitorStats().then(stats => {
    const el = document.getElementById('stats-total');
    if (!el) return;
    if (stats) {
      el.textContent = typeof stats.total === 'number' ? stats.total.toLocaleString() : stats.total;
    } else {
      el.textContent = t('welcomeStatsError');
      el.classList.add('stats-error');
    }
  });
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

    const groups = groupBySlug(entries);

    // Sort by the primary (ja) entry, falling back to en
    groups.sort((a, b) => {
      const ea = a.langs.ja || a.langs.en || {};
      const eb = b.langs.ja || b.langs.en || {};
      if (collection === 'courses') return (ea.order || 0) - (eb.order || 0);
      if (collection === 'articles') return (eb.date || '').localeCompare(ea.date || '');
      return (ea.title || '').localeCompare(eb.title || '');
    });

    const grid = document.getElementById('entry-grid');

    if (groups.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>${t('noEntries')}</p><a href="#new/${collection}" class="btn-new">${t('createOne')}</a></div>`;
      return;
    }

    grid.innerHTML = groups.map(group => {
      // Prefer ja entry for display, fall back to en
      const primary = group.langs.ja || group.langs.en;
      const slug = group.slug;
      const defaultLang = group.langs.ja ? 'ja' : 'en';
      const meta = entryMeta(collection, primary);
      const hasJa = !!group.langs.ja;
      const hasEn = !!group.langs.en;

      return `
        <div class="entry-card" onclick="location.hash='edit/${collection}/${defaultLang}/${slug}'">
          <div class="entry-thumb">
            ${COLLECTION_ICONS[collection]}
          </div>
          <div class="entry-info">
            <div class="entry-title">${esc(primary.title || slug)}</div>
            <div class="entry-meta">
              <span class="lang-badge ja ${hasJa ? '' : 'missing'}">JA</span>
              <span class="lang-badge en ${hasEn ? '' : 'missing'}">EN</span>
              ${meta}
            </div>
          </div>
          <div class="entry-actions">
            <button class="btn-delete" onclick="event.stopPropagation(); window._deleteEntry('${collection}', '${defaultLang}', '${slug}')" title="${t('delete')}">${ICONS.trash}</button>
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

window._deleteEntry = async function(collection, defaultLang, slug) {
  // Check which versions exist
  const entries = entryCache[collection] || [];
  const jaExists = entries.some(e => (e.slug || e._file?.replace('.md', '')) === slug && (e.lang || e._lang) === 'ja');
  const enExists = entries.some(e => (e.slug || e._file?.replace('.md', '')) === slug && (e.lang || e._lang) === 'en');

  let msg = t('deleteConfirm')('', slug);
  if (jaExists && enExists) {
    msg = t('deleteBothConfirm')(slug);
  }
  if (!confirm(msg)) return;

  try {
    if (jaExists) await apiDeleteEntry(collection, 'ja', slug);
    if (enExists) await apiDeleteEntry(collection, 'en', slug);
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
    { key: 'image', label: 'Image Path', type: 'text', half: true },
    { key: 'actions', label: 'Actions (comma-separated)', type: 'text', required: true },
  ],
  courses: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'slug', label: 'Slug', type: 'text', required: true, half: true },
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
  let otherLangExists = false;
  let versionExists = true;

  main.innerHTML = `<div class="empty-state"><p>${t('loading')}</p></div>`;

  if (!isNew) {
    // Check if this version exists
    try {
      const data = await readEntry(collection, lang, slug);
      frontmatter = data.frontmatter;
      body = data.body;
    } catch (err) {
      // This language version doesn't exist yet
      versionExists = false;
      frontmatter.slug = slug;
      frontmatter.lang = lang;
      if (collection === 'articles') {
        frontmatter.date = new Date().toISOString().slice(0, 10);
      }
    }

    // Check if the other language version exists
    const otherLang = lang === 'ja' ? 'en' : 'ja';
    try {
      await readEntry(collection, otherLang, slug);
      otherLangExists = true;
    } catch { /* doesn't exist */ }
  } else {
    frontmatter.lang = 'ja';
    lang = 'ja';
    if (collection === 'articles') {
      frontmatter.date = new Date().toISOString().slice(0, 10);
    }
  }

  const fields = FIELD_DEFS[collection] || [];
  const singularKey = COLLECTION_SINGULARS[collection];
  const label = `${isNew ? t('newLabel') : t('editLabel')} ${t(singularKey)}`;
  const otherLang = lang === 'ja' ? 'en' : 'ja';
  const isCreatingNewLang = !isNew && !versionExists;

  // Language tabs (only for existing entries)
  const langTabs = !isNew ? `
    <div class="lang-tabs">
      <a href="#edit/${collection}/ja/${slug}" class="lang-tab ${lang === 'ja' ? 'active' : ''} ${!isNew && lang !== 'ja' && !otherLangExists && lang === 'en' ? '' : ''}">
        JA — ${t('langJa')}
      </a>
      <a href="#edit/${collection}/en/${slug}" class="lang-tab ${lang === 'en' ? 'active' : ''}">
        EN — ${t('langEn')}
      </a>
    </div>` : '';

  // Banner for creating a new language version
  const newLangBanner = isCreatingNewLang ? `
    <div class="new-lang-banner">
      ${t('creatingLangVersion').replace('{lang}', lang === 'ja' ? t('langJa') : t('langEn'))}
    </div>` : '';

  // Build "view on site" URL
  const siteBase = 'https://alexvoorhees.github.io/botanical-grace';
  const collectionPath = { articles: 'column', herbs: 'herbs', courses: 'courses' };
  const viewUrl = !isNew && versionExists && slug
    ? `${siteBase}/${lang}/${collectionPath[collection]}/${slug}/`
    : '';

  main.innerHTML = `
    <div class="form-header">
      <a href="#${collection}" class="btn-back">${ICONS.back} ${t('back')}</a>
      <h2>${label}</h2>
      ${viewUrl ? `<a href="${viewUrl}" target="_blank" class="btn-view-site">${ICONS.externalLink} ${t('viewOnSite')}</a>` : ''}
    </div>
    ${langTabs}
    ${newLangBanner}
    <div class="edit-form">
      <div class="form-grid">
        ${fields.map(f => renderField(f, frontmatter)).join('')}
        ${renderImagePanel(collection, frontmatter)}
        <div class="form-group full">
          <label for="field-body">${t('bodyLabel')}</label>
          <div class="md-toolbar">
            <button type="button" class="md-btn" data-md="bold" title="${t('mdBold')}"><strong>B</strong></button>
            <button type="button" class="md-btn" data-md="italic" title="${t('mdItalic')}"><em>I</em></button>
            <span class="md-sep"></span>
            <button type="button" class="md-btn" data-md="h2" title="${t('mdH2')}">H2</button>
            <button type="button" class="md-btn" data-md="h3" title="${t('mdH3')}">H3</button>
            <span class="md-sep"></span>
            <button type="button" class="md-btn" data-md="ul" title="${t('mdList')}">&#8226; ${t('mdList')}</button>
            <button type="button" class="md-btn" data-md="link" title="${t('mdLink')}">&#128279; ${t('mdLink')}</button>
          </div>
          <textarea id="field-body" class="body-editor">${esc(body)}</textarea>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-save" id="btn-save">${t('saveEntry')}</button>
        ${!isNew && lang === 'ja' && !otherLangExists ? `<button class="btn-translate" id="btn-translate">${t('saveAndTranslate')}</button>` : ''}
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

  // The lang is determined by the tab, not a form field
  const effectiveIsNew = isNew || isCreatingNewLang;
  document.getElementById('btn-save').addEventListener('click', () => saveEntry(collection, effectiveIsNew, lang));

  const translateBtn = document.getElementById('btn-translate');
  if (translateBtn) {
    translateBtn.addEventListener('click', () => saveAndTranslate(collection, effectiveIsNew, lang));
  }

  // Markdown toolbar
  document.querySelectorAll('.md-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ta = document.getElementById('field-body');
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const sel = ta.value.substring(start, end);
      let insert = '';
      let cursorOffset = 0;

      switch (btn.dataset.md) {
        case 'bold':
          insert = `**${sel || t('mdBoldPlaceholder')}**`;
          cursorOffset = sel ? insert.length : 2;
          break;
        case 'italic':
          insert = `*${sel || t('mdItalicPlaceholder')}*`;
          cursorOffset = sel ? insert.length : 1;
          break;
        case 'h2':
          insert = `## ${sel || t('mdHeadingPlaceholder')}`;
          cursorOffset = sel ? insert.length : 3;
          break;
        case 'h3':
          insert = `### ${sel || t('mdHeadingPlaceholder')}`;
          cursorOffset = sel ? insert.length : 4;
          break;
        case 'ul':
          insert = sel ? sel.split('\n').map(l => `- ${l}`).join('\n') : `- ${t('mdListPlaceholder')}`;
          cursorOffset = sel ? insert.length : 2;
          break;
        case 'link':
          insert = sel ? `[${sel}](url)` : `[${t('mdLinkText')}](url)`;
          cursorOffset = sel ? insert.length - 4 : insert.indexOf('](') + 2;
          break;
      }

      ta.focus();
      ta.selectionStart = start;
      ta.selectionEnd = end;
      // Use execCommand to preserve undo history (Ctrl+Z)
      document.execCommand('insertText', false, insert);
      if (!sel) {
        // Select the placeholder text
        ta.selectionStart = start + cursorOffset;
        ta.selectionEnd = start + insert.length - (btn.dataset.md === 'bold' ? 2 : btn.dataset.md === 'italic' ? 1 : 0);
      }
      markDirty();
    });
  });

  // Track unsaved changes
  document.querySelectorAll('.edit-form input, .edit-form textarea, .edit-form select').forEach(el => {
    el.addEventListener('input', markDirty);
    el.addEventListener('change', markDirty);
  });

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

const IMAGE_STYLE_SUFFIX = 'Elegant botanical watercolor illustration on a clean off-white (#FAFAF5) background. Soft naturalistic style with gentle shadows. Minimalist composition, no text or labels.';

function renderImagePanel(collection, frontmatter) {
  if (collection === 'courses') return '';

  // Pre-fill with just the scene description, not the style
  const sceneDefault = collection === 'herbs'
    ? `${frontmatter.nameEn || frontmatter.title || ''} (${frontmatter.scientificName || ''}) with distinctive flowers and leaves`
    : '';

  const placeholder = t('imagePromptPlaceholder');

  return `
    <div class="form-group full">
      <details class="image-panel">
        <summary>${ICONS.palette} ${t('generateImage')}</summary>
        <div class="image-panel-content">
          <label style="font-size:0.75rem;font-weight:600;color:var(--text-muted);margin-top:0.5rem;display:block;">${t('imagePromptLabel')}</label>
          <textarea id="image-prompt" placeholder="${esc(placeholder)}">${esc(sceneDefault)}</textarea>
          <p class="image-gen-note">${t('imageStyleNote')}</p>
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

  // Append the standard watercolor botanical style
  const fullPrompt = `${prompt}. ${IMAGE_STYLE_SUFFIX}`;

  btn.disabled = true;
  status.innerHTML = `<div class="generating-spinner"><div class="spinner"></div>${t('triggeringGeneration')}</div>`;

  try {
    await triggerImageGeneration(collection, slug, fullPrompt);

    // Update image path field
    const imgField = document.getElementById('field-image');
    if (imgField) imgField.value = `/botanical-grace/images/${collection}/${slug}.png`;

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

async function saveEntryAndReturn(collection, isNew, editorLang) {
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
  // Lang comes from the tab, not a form field
  const lang = editorLang || frontmatter.lang || 'ja';
  frontmatter.lang = lang;
  const slug = frontmatter.slug;

  if (!slug) {
    toast(t('langAndSlugRequired'), 'error');
    return false;
  }

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  btn.textContent = t('saving');

  try {
    await writeEntry(collection, lang, slug, frontmatter, body);
    toast(t('saved'), 'success');
    clearDirty();
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

async function saveEntry(collection, isNew, editorLang) {
  await saveEntryAndReturn(collection, isNew, editorLang);
}

// --- Save & Translate ---

async function saveAndTranslate(collection, isNew, editorLang) {
  // First save the entry
  const saved = await saveEntryAndReturn(collection, isNew, editorLang);
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
