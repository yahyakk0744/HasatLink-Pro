import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ThumbsUp, Eye, CheckCircle2, Clock, Tag, ArrowLeft, Award, Shield, Send, Trash2,
} from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
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
  bestAnswerId: string;
  createdAt: string;
}

interface Answer {
  _id: string;
  questionId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isExpert: boolean;
  body: string;
  upvotes: string[];
  isBestAnswer: boolean;
  createdAt: string;
}

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

export default function ForumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetch = () => {
    if (!id) return;
    api.get(`/forum/questions/${id}`)
      .then(({ data }) => {
        setQuestion(data.question);
        setAnswers(data.answers || []);
      })
      .catch(() => toast.error('Soru yüklenemedi'))
      .finally(() => setLoading(false));
  };

  useEffect(fetch, [id]);

  const upvoteQuestion = async () => {
    if (!user) {
      toast.error('Oy vermek için giriş yapın');
      return;
    }
    try {
      await api.post(`/forum/questions/${id}/upvote`);
      fetch();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const upvoteAnswer = async (answerId: string) => {
    if (!user) {
      toast.error('Oy vermek için giriş yapın');
      return;
    }
    try {
      await api.post(`/forum/answers/${answerId}/upvote`);
      fetch();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const submitAnswer = async () => {
    if (!user) {
      toast.error('Cevap için giriş yapın');
      return;
    }
    if (!answerBody.trim()) {
      toast.error('Cevap boş olamaz');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/forum/questions/${id}/answers`, { body: answerBody });
      setAnswerBody('');
      toast.success('Cevap gönderildi');
      fetch();
    } catch {
      toast.error('Gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const markBest = async (answerId: string) => {
    try {
      await api.post(`/forum/questions/${id}/best-answer/${answerId}`);
      toast.success('En iyi cevap olarak işaretlendi');
      fetch();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const deleteAnswer = async (answerId: string) => {
    if (!confirm('Cevabı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/forum/answers/${answerId}`);
      toast.success('Cevap silindi');
      fetch();
    } catch {
      toast.error('Silinemedi');
    }
  };

  const deleteQuestion = async () => {
    if (!confirm('Soruyu silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/forum/questions/${id}`);
      toast.success('Soru silindi');
      navigate('/forum');
    } catch {
      toast.error('Silinemedi');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (!question) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-[var(--text-secondary)]">Soru bulunamadı</p>
        <Link to="/forum" className="text-[#2D6A4F] text-sm font-semibold mt-3 inline-block">
          ← Foruma Dön
        </Link>
      </div>
    );
  }

  const isOwner = user?.userId === question.userId;
  const hasUpvoted = user ? question.upvotes?.includes(user.userId) : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <SEO title={`${question.title} - Çiftçi Forumu`} description={question.body.slice(0, 160)} />

      <Link
        to="/forum"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[#2D6A4F] mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Foruma Dön
      </Link>

      {/* Question */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              {question.isResolved && <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-1" />}
              <h1 className="text-2xl font-bold tracking-tight">{question.title}</h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
              <span className="font-medium">{question.userName}</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatRelative(question.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {question.viewCount}
              </span>
              {question.category && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-medium">
                  <Tag size={10} />
                  {question.category}
                </span>
              )}
            </div>
          </div>
          {isOwner && (
            <button
              onClick={deleteQuestion}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              title="Soruyu sil"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed mb-4">
          {question.body}
        </p>

        {question.tags?.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {question.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-xs text-[var(--text-secondary)]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={upvoteQuestion}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
            ${hasUpvoted
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--border-default)]'
            }
          `}
        >
          <ThumbsUp size={14} />
          {question.upvotes?.length || 0} Faydalı
        </button>
      </div>

      {/* Answers */}
      <h2 className="text-lg font-bold mb-4">
        {answers.length} Cevap
      </h2>

      <div className="space-y-4 mb-6">
        {answers.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
            <p className="text-sm text-[var(--text-secondary)]">Henüz cevap yok. İlk cevabı sen ver!</p>
          </div>
        ) : (
          answers.map(a => {
            const isAnswerOwner = user?.userId === a.userId;
            const hasUpvotedAnswer = user ? a.upvotes?.includes(user.userId) : false;
            return (
              <div
                key={a._id}
                className={`
                  bg-[var(--bg-surface)] border rounded-2xl p-5 transition-all
                  ${a.isBestAnswer ? 'border-green-500/50 shadow-sm' : 'border-[var(--border-default)]'}
                `}
              >
                {a.isBestAnswer && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-green-600 mb-3">
                    <Award size={14} />
                    EN İYİ CEVAP
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 text-sm font-semibold text-[#2D6A4F]">
                    {a.userName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{a.userName}</span>
                      {a.isExpert && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[10px] font-semibold">
                          <Shield size={10} />
                          UZMAN
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-secondary)]">
                        {formatRelative(a.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed mb-4 ml-13">
                  {a.body}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => upvoteAnswer(a._id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors
                      ${hasUpvotedAnswer
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--border-default)]'
                      }
                    `}
                  >
                    <ThumbsUp size={12} />
                    {a.upvotes?.length || 0}
                  </button>

                  {isOwner && !a.isBestAnswer && !question.isResolved && (
                    <button
                      onClick={() => markBest(a._id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                    >
                      <Award size={12} />
                      En İyi Cevap
                    </button>
                  )}

                  {isAnswerOwner && (
                    <button
                      onClick={() => deleteAnswer(a._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors ml-auto"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Answer Form */}
      {user ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-3">Cevap Ver</h3>
          <textarea
            value={answerBody}
            onChange={e => setAnswerBody(e.target.value)}
            placeholder="Cevabınızı buraya yazın..."
            rows={4}
            className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={submitAnswer}
              disabled={submitting || !answerBody.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {submitting ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Cevap vermek için giriş yapın
          </p>
          <Link
            to="/giris"
            className="inline-block px-5 py-2 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors"
          >
            Giriş Yap
          </Link>
        </div>
      )}
    </div>
  );
}
