import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <h1 className="text-[8rem] md:text-[12rem] font-semibold tracking-tighter text-[#F5F3EF] leading-none">
        {t('notFound.title')}
      </h1>
      <p className="text-xl font-semibold tracking-tight text-[#6B6560] -mt-8 mb-8">
        {t('notFound.message')}
      </p>
      <Link to="/">
        <Button size="lg">{t('notFound.goHome')}</Button>
      </Link>
    </div>
  );
}
