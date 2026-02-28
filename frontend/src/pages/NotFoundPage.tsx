import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import SEO from '../components/ui/SEO';

export default function NotFoundPage() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <SEO title="404" description={isTr ? 'Sayfa bulunamadı' : 'Page not found'} />
      <div className="relative mb-6">
        <h1 className="text-[8rem] md:text-[12rem] font-semibold tracking-tighter text-[var(--bg-input)] leading-none select-none">
          {t('notFound.title')}
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search size={48} className="text-[var(--text-secondary)] opacity-30" />
        </div>
      </div>
      <p className="text-xl font-semibold tracking-tight text-[var(--text-secondary)] -mt-8 mb-2">
        {t('notFound.message')}
      </p>
      <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-md">
        {isTr
          ? 'Aradığınız sayfa taşınmış veya silinmiş olabilir.'
          : 'The page you are looking for may have been moved or deleted.'}
      </p>
      <Link to="/">
        <Button size="lg">
          <Home size={16} className="mr-2" />
          {t('notFound.goHome')}
        </Button>
      </Link>
    </div>
  );
}
