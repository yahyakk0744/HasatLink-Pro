import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1A1A1A] text-white py-12 mt-16 hidden md:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3">
              <span className="text-white">HASAT</span>
              <span className="text-[#2D6A4F]">LiNK</span>
            </h3>
            <p className="text-sm text-[#6B6560]">{t('footer.description')}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B6560] mb-3">{t('categories.pazar')}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/pazar" className="text-sm text-white/70 hover:text-white">{t('categories.pazar')}</Link>
              <Link to="/lojistik" className="text-sm text-white/70 hover:text-white">{t('categories.lojistik')}</Link>
              <Link to="/isgucu" className="text-sm text-white/70 hover:text-white">{t('categories.isgucu')}</Link>
              <Link to="/ekipman" className="text-sm text-white/70 hover:text-white">{t('categories.ekipman')}</Link>
              <Link to="/arazi" className="text-sm text-white/70 hover:text-white">{t('categories.arazi')}</Link>
              <Link to="/depolama" className="text-sm text-white/70 hover:text-white">{t('categories.depolama')}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B6560] mb-3">{t('features')}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/harita" className="text-sm text-white/70 hover:text-white">{t('map.title')}</Link>
              <Link to="/ai-teshis" className="text-sm text-white/70 hover:text-white">{t('ai.title')}</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6B6560]">&copy; {year} HasatLink. {t('footer.rights')}</p>
          <div className="flex items-center gap-4 text-xs text-[#6B6560]">
            <Link to="/gizlilik" className="hover:text-white">{t('footer.privacy')}</Link>
            <Link to="/kullanim-sartlari" className="hover:text-white">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
