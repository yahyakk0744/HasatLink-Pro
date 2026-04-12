import { useState, useEffect } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import { timeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface QA {
  _id: string;
  listingId: string;
  userId: string;
  userName: string;
  userImage: string;
  question: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
}

interface QASectionProps {
  listingId: string;
  sellerId: string;
  isOwner: boolean;
}

export default function QASection({ listingId, sellerId, isOwner }: QASectionProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QA[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    api.get<QA[]>(`/listings/${listingId}/questions`)
      .then(({ data }) => setQuestions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [listingId]);

  const handleAsk = async () => {
    if (!newQuestion.trim() || !user) return;
    setSending(true);
    try {
      const { data } = await api.post<QA>(`/listings/${listingId}/questions`, {
        question: newQuestion.trim(),
      });
      setQuestions(prev => [data, ...prev]);
      setNewQuestion('');
      toast.success('Sorunuz gönderildi');
    } catch {
      toast.error('Soru gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const handleAnswer = async (qaId: string) => {
    if (!replyText.trim()) return;
    try {
      const { data } = await api.put<QA>(`/listings/${listingId}/questions/${qaId}`, {
        answer: replyText.trim(),
      });
      setQuestions(prev => prev.map(q => q._id === qaId ? data : q));
      setReplyingId(null);
      setReplyText('');
      toast.success('Cevabınız eklendi');
    } catch {
      toast.error('Cevap gönderilemedi');
    }
  };

  const visible = showAll ? questions : questions.slice(0, 3);

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
          <MessageSquare size={16} strokeWidth={1.5} className="text-[#7C3AED]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Soru & Cevap</h3>
          <p className="text-[10px] text-[var(--text-secondary)]">{questions.length} soru</p>
        </div>
      </div>

      {/* Ask form */}
      {user && user.userId !== sellerId && (
        <div className="flex gap-2">
          <input
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="Satıcıya bir soru sorun..."
            maxLength={300}
            className="flex-1 px-3 py-2.5 text-sm bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl outline-none focus:border-[#7C3AED] transition-colors"
            onKeyDown={e => e.key === 'Enter' && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={sending || !newQuestion.trim()}
            className="px-4 py-2.5 bg-[#7C3AED] text-white rounded-xl text-sm font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-3">
        {visible.map(qa => (
          <div key={qa._id} className="p-3 rounded-xl bg-[var(--bg-input)] space-y-2">
            <div className="flex items-start gap-2">
              {qa.userImage ? (
                <img src={qa.userImage} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#7C3AED]/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-[#7C3AED]">{qa.userName?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{qa.userName}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">{timeAgo(qa.createdAt)}</span>
                </div>
                <p className="text-sm text-[var(--text-primary)] mt-0.5">{qa.question}</p>
              </div>
            </div>

            {/* Answer */}
            {qa.answer ? (
              <div className="ml-8 p-2.5 rounded-lg bg-[#2D6A4F]/5 border-l-2 border-[#2D6A4F]">
                <span className="text-[10px] font-semibold text-[#2D6A4F] uppercase">Satıcı Cevabı</span>
                <p className="text-sm text-[var(--text-primary)] mt-0.5">{qa.answer}</p>
              </div>
            ) : isOwner ? (
              replyingId === qa._id ? (
                <div className="ml-8 flex gap-2">
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Cevabınızı yazın..."
                    className="flex-1 px-3 py-2 text-sm bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg outline-none focus:border-[#2D6A4F] transition-colors"
                    onKeyDown={e => e.key === 'Enter' && handleAnswer(qa._id)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleAnswer(qa._id)}
                    className="px-3 py-2 bg-[#2D6A4F] text-white rounded-lg text-xs font-medium hover:opacity-90"
                  >
                    Gönder
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setReplyingId(qa._id); setReplyText(''); }}
                  className="ml-8 text-[11px] font-medium text-[#2D6A4F] hover:underline"
                >
                  Cevapla →
                </button>
              )
            ) : (
              <p className="ml-8 text-[11px] text-[var(--text-secondary)] italic">Henüz cevaplanmadı</p>
            )}
          </div>
        ))}
      </div>

      {questions.length > 3 && (
        <button
          onClick={() => setShowAll(p => !p)}
          className="flex items-center gap-1 text-xs font-medium text-[#7C3AED] hover:underline mx-auto"
        >
          {showAll ? <><ChevronUp size={12} />Daha az göster</> : <><ChevronDown size={12} />Tüm soruları göster ({questions.length})</>}
        </button>
      )}

      {questions.length === 0 && (
        <p className="text-xs text-[var(--text-secondary)] text-center py-2">Henüz soru sorulmadı. İlk soruyu siz sorun!</p>
      )}
    </div>
  );
}
