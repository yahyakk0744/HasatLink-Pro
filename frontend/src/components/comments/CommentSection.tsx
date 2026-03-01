import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2, Reply } from 'lucide-react';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../contexts/AuthContext';
import { timeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  listingId: string;
}

export default function CommentSection({ listingId }: CommentSectionProps) {
  const { user } = useAuth();
  const { comments, loading, fetchComments, createComment, deleteComment } = useComments();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments(listingId);
  }, [listingId, fetchComments]);

  const { topLevel, repliesMap } = useMemo(() => {
    const top = comments.filter(c => !c.parentId);
    const map: Record<string, typeof comments> = {};
    comments.filter(c => c.parentId).forEach(c => {
      const pid = c.parentId!;
      if (!map[pid]) map[pid] = [];
      map[pid].push(c);
    });
    return { topLevel: top, repliesMap: map };
  }, [comments]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const ok = await createComment({ listingId, text: text.trim() });
    if (ok) {
      setText('');
      fetchComments(listingId);
    } else {
      toast.error('Yorum gönderilemedi');
    }
    setSubmitting(false);
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    const ok = await createComment({ listingId, text: replyText.trim(), parentId });
    if (ok) {
      setReplyText('');
      setReplyTo(null);
      fetchComments(listingId);
    } else {
      toast.error('Yanıt gönderilemedi');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteComment(id);
    if (ok) {
      fetchComments(listingId);
    } else {
      toast.error('Yorum silinemedi');
    }
  };

  const renderComment = (comment: typeof comments[0], isReply = false) => (
    <div key={comment._id} className={isReply ? 'ml-8' : ''}>
      <div className="bg-[var(--bg-surface)] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Link to={`/profil/${comment.userId}`} className="shrink-0">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] overflow-hidden">
              {comment.userImage ? (
                <img src={comment.userImage} alt={comment.userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#6B6560]">
                  {comment.userName?.charAt(0) || '?'}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profil/${comment.userId}`} className="text-xs font-semibold hover:text-[#2D6A4F] transition-colors truncate block">
              {comment.userName || 'Anonim'}
            </Link>
          </div>
          <span className="text-[10px] text-[#6B6560] shrink-0">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-[var(--text-primary)] leading-relaxed ml-11">{comment.text}</p>
        <div className="flex items-center gap-3 ml-11 mt-2">
          {user && !isReply && (
            <button
              onClick={() => { setReplyTo(replyTo === comment._id ? null : comment._id); setReplyText(''); }}
              className="text-[10px] text-[#6B6560] hover:text-[#2D6A4F] flex items-center gap-1 transition-colors"
            >
              <Reply size={12} />
              Yanıtla
            </button>
          )}
          {user && user.userId === comment.userId && (
            <button
              onClick={() => handleDelete(comment._id)}
              className="text-[10px] text-[#6B6560] hover:text-[#C1341B] flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              Sil
            </button>
          )}
        </div>
      </div>

      {/* Inline reply form */}
      {replyTo === comment._id && (
        <div className="ml-8 mt-2 flex gap-2">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReply(comment._id)}
            placeholder="Yanıtınızı yazın..."
            className="flex-1 px-3 py-2 text-sm bg-[var(--bg-input)] rounded-xl border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
          <button
            onClick={() => handleReply(comment._id)}
            disabled={!replyText.trim() || submitting}
            className="px-3 py-2 bg-[#2D6A4F] text-white rounded-xl text-sm hover:bg-[#245a42] disabled:opacity-50 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      )}

      {/* Replies */}
      {repliesMap[comment._id]?.map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-tight">Yorumlar</h3>

      {/* New comment form */}
      {user ? (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Yorum yazın..."
            className="flex-1 px-3 py-2 text-sm bg-[var(--bg-input)] rounded-xl border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="px-3 py-2 bg-[#2D6A4F] text-white rounded-xl text-sm hover:bg-[#245a42] disabled:opacity-50 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      ) : (
        <p className="text-xs text-[#6B6560]">Yorum yapmak için giriş yapın.</p>
      )}

      {/* Comment list */}
      {loading ? (
        <p className="text-xs text-[#6B6560]">Yükleniyor...</p>
      ) : topLevel.length > 0 ? (
        <div className="space-y-3">
          {topLevel.map(c => renderComment(c))}
        </div>
      ) : (
        <p className="text-xs text-[#6B6560]">Henüz yorum yapılmamış.</p>
      )}
    </div>
  );
}
