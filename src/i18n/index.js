/* i18n — lightweight translation system */
import ar from './ar';
import fr from './fr';
import en from './en';

const locales = { ar, fr, en };

export function t(key, lang = 'fr') {
  const keys = key.split('.');
  let val = locales[lang];
  for (const k of keys) {
    if (!val) return key;
    val = val[k];
  }
  return val ?? key;
}

export const LANGUAGES = [
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
];

export default locales;
