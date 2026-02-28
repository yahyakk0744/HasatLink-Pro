import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('tr') ? 'tr' : 'en';

  const toggle = () => {
    i18n.changeLanguage(currentLang === 'tr' ? 'en' : 'tr');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium uppercase tracking-wider bg-[var(--bg-input)] rounded-full hover:bg-[var(--bg-surface-hover)] transition-colors"
    >
      <span className={currentLang === 'tr' ? 'opacity-100' : 'opacity-40'}>TR</span>
      <span className="text-[var(--border-default)]">/</span>
      <span className={currentLang === 'en' ? 'opacity-100' : 'opacity-40'}>EN</span>
    </button>
  );
}
