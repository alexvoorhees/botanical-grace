export const defaultLang = 'ja' as const;

export const languages = {
  ja: '日本語',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as Lang;
  return defaultLang;
}

export function getLocalizedUrl(url: URL, targetLang: Lang): string {
  const [, currentLang, ...rest] = url.pathname.split('/');
  if (currentLang in languages) {
    return `/${targetLang}/${rest.join('/')}`;
  }
  return `/${targetLang}/`;
}
