export const defaultLang = 'ja' as const;

export const languages = {
  ja: '日本語',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (base && pathname.startsWith(base)) {
    return pathname.slice(base.length) || '/';
  }
  return pathname;
}

export function getLangFromUrl(url: URL): Lang {
  const path = stripBase(url.pathname);
  const [, lang] = path.split('/');
  if (lang in languages) return lang as Lang;
  return defaultLang;
}

export function getLocalizedUrl(url: URL, targetLang: Lang): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = stripBase(url.pathname);
  const [, currentLang, ...rest] = path.split('/');
  if (currentLang in languages) {
    return `${base}/${targetLang}/${rest.join('/')}`;
  }
  return `${base}/${targetLang}/`;
}
