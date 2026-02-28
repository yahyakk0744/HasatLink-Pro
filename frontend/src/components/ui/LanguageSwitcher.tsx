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
      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium uppercase tracking-wider bg-[#F5F3EF] rounded-full hover:bg-[#EBE7E0] transition-colors"
    >
      <span className={currentLang === 'tr' ? 'opacity-100' : 'opacity-40'}>TR</span>
      <span className="text-[#D6D0C8]">/</span>
      <span className={currentLang === 'en' ? 'opacity-100' : 'opacity-40'}>EN</span>
    </button>
  );
}
