import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle, ThumbsUp, Eye, CheckCircle2, Search, Plus, Tag, Clock,
} from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../hooks/useFeatures';
import toast from 'react-hot-toast';

interface Question {
  _id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  upvotes: string[];
  answerCount: number;
  viewCount: number;
  isResolved: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { value: '', label: 'Tümü' },
  { value: 'hastalik', label: 'Hastalık ve Zararlı' },
  { value: 'ekim', label: 'Ekim ve Dikim' },
  { value: 'hasat', label: 'Hasat' },
  { value: 'sulama', label: 'Sulama' },
  { value: 'gubreleme', label: 'Gübreleme' },
  { value: 'satis', label: 'Satış ve Fiyat' },
  { value: 'ekipman', label: 'Ekipman' },
  { value: 'diger', label: 'Diğer' },
];

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

export default function ForumPage() {
  const { i18n: _i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);

  const fetchQuestions = () => {
    setLoading(true);
    const params: any = {};
    if (category) params.category = category;
    if (search) params.search = search;
    api.get('/forum/questions', { params })
      .then(({ data }) => setQuestions(data.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchQuestions, [category]);

  if (!featuresLoading && !isEnabled('qnaForum')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <MessageCircle size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">Forum Henüz Açık Değil</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Soru-cevap forumu yakında aktif olacak. Takipte kal!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <SEO
        title="Çiftçi Forumu - HasatLink"
        description="Çiftçiler arası soru-cevap topluluğu. Tarım bilgilerini paylaş, sorular sor, uzmanlardan cevap al."
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Çiftçi Forumu</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Soru sor, bilgi paylaş, topluluktan destek al
          </p>
        </div>
        <button
          onClick={() => {
            if (!user) {
              toast.error('Soru sormak için giriş yapın');
              navigate('/giris');
              return;
            }
            setShowAskModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] text-white rounded-2xl font-semibold text-sm hover:bg-[#1B4332] transition-colors shadow-sm"
        >
          <Plus size={16} />
          Soru Sor
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Sorularda ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchQuestions()}
            className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F] transition-colors min-w-[150px]"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Questions List */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <MessageCircle size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">Henüz soru yok. İlk soruyu sen sor!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <Link
              key={q._id}
              to={`/forum/${q._id}`}
              className="block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 text-sm font-semibold text-[#2D6A4F]">
                  {q.userName?.[0]?.toUpperCase() || 'U'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    {q.isResolved && (
                      <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                    )}
                    <h3 className="text-base font-semibold text-[var(--text-primary)] line-clamp-2">
                      {q.title}
                    </h3>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">
                    {q.body}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] flex-wrap">
                    <span className="font-medium">{q.userName}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatRelative(q.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={12} />
                      {q.upvotes?.length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {q.answerCount || 0} cevap
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {q.viewCount || 0}
                    </span>
                    {q.category && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-medium">
                        <Tag size={10} />
                        {CATEGORIES.find(c => c.value === q.category)?.label || q.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showAskModal && (
        <AskQuestionModal
          onClose={() => setShowAskModal(false)}
          onCreated={() => {
            setShowAskModal(false);
            fetchQuestions();
          }}
        />
      )}
    </div>
  );
}

function AskQuestionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', body: '', category: 'diger', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Başlık ve içerik zorunlu');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/forum/questions', {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Soru paylaşıldı');
      onCreated();
    } catch {
      toast.error('Paylaşılamadı');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Yeni Soru Sor</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              Başlık
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Kısa ve net bir başlık"
              maxLength={200}
              className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              Kategori
            </label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
            >
              {CATEGORIES.filter(c => c.value).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              İçerik
            </label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Sorununuzu detaylı açıklayın..."
              rows={6}
              className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              Etiketler (virgülle ayır)
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="domates, salkım, mantar"
              className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            İptal
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Gönderiliyor...' : 'Paylaş'}
          </button>
        </div>
      </div>
    </div>
  );
}
