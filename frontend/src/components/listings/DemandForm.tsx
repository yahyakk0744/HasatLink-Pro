import { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../config/api';
import toast from 'react-hot-toast';

interface DemandFormProps {
  category: string;
  subCategory: string;
}

export default function DemandForm({ category, subCategory }: DemandFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [budget, setBudget] = useState('');
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSending(true);
    try {
      await api.post('/demands', {
        category,
        subCategory,
        description: description.trim(),
        amount: amount ? Number(amount) : undefined,
        budget: budget ? Number(budget) : undefined,
      });
      toast.success('Talebiniz yayınlandı! Satıcılar sizinle iletişime geçecek.');
      setOpen(false);
      setDescription('');
      setAmount('');
      setBudget('');
    } catch {
      toast.error('Talep gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#E76F00] to-[#F59E0B] text-white rounded-2xl text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all"
      >
        <Megaphone size={16} />
        Talep Oluştur — "{subCategory}" arıyorum
      </button>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl p-4 space-y-3 border border-[#E76F00]/20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#E76F00]/10 flex items-center justify-center">
          <Megaphone size={16} className="text-[#E76F00]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Alım Talebi Oluştur</h3>
          <p className="text-[10px] text-[var(--text-secondary)]">{subCategory} kategorisinde satıcılara ulaşın</p>
        </div>
      </div>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Ne arıyorsunuz? Detaylı açıklayın... (örn: 10 ton organik domates, Antalya bölgesinden)"
        rows={3}
        maxLength={500}
        className="w-full px-3 py-2.5 text-sm bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl outline-none focus:border-[#E76F00] transition-colors resize-none"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium uppercase text-[var(--text-secondary)] mb-1">Miktar (kg/ton)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Opsiyonel"
            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl outline-none focus:border-[#E76F00] transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium uppercase text-[var(--text-secondary)] mb-1">Bütçe (TL)</label>
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="Opsiyonel"
            className="w-full px-3 py-2 text-sm bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xl outline-none focus:border-[#E76F00] transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 px-4 py-2.5 text-sm font-medium bg-[var(--bg-input)] rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          İptal
        </button>
        <button
          onClick={handleSubmit}
          disabled={sending || !description.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E76F00] text-white rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50"
        >
          <Send size={14} />
          {sending ? 'Gönderiliyor...' : 'Talebi Yayınla'}
        </button>
      </div>
    </div>
  );
}
