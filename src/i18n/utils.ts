import { ui } from './ui';
import { defaultLang, type Lang } from './languages';

export function t(lang: Lang, key: keyof typeof ui[typeof defaultLang]): string {
  return ui[lang][key] || ui[defaultLang][key];
}

export function getOtherLang(lang: Lang): Lang {
  return lang === 'ja' ? 'en' : 'ja';
}
