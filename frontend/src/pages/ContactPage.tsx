import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, MessageCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SEO from '../components/ui/SEO';
import toast from 'react-hot-toast';
import api from '../config/api';

export default function ContactPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error(isTr ? 'Lütfen tüm alanları doldurun' : 'Please fill in all fields');
      return;
    }
    setSending(true);
    try {
      await api.post('/contact', form);
      toast.success(isTr ? 'Mesajınız gönderildi!' : 'Message sent successfully!');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error(isTr ? 'Mesaj gönderilemedi, lütfen tekrar deneyin.' : 'Failed to send message, please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <SEO
        title={isTr ? 'İletişim' : 'Contact'}
        description={isTr ? 'HasatLink ile iletişime geçin. Sorularınız ve önerileriniz için bize ulaşın.' : 'Contact HasatLink. Reach out for questions and suggestions.'}
        keywords={isTr ? 'iletişim, hasatlink, tarım, destek' : 'contact, hasatlink, agriculture, support'}
      />

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-[#2D6A4F]/10 rounded-xl flex items-center justify-center">
          <MessageCircle size={20} className="text-[#2D6A4F]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isTr ? 'İletişim' : 'Contact Us'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {isTr ? 'Sorularınız veya önerileriniz için bize yazın.' : 'Write to us for questions or suggestions.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={isTr ? 'Ad Soyad' : 'Full Name'}
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <Input
            label={isTr ? 'E-posta' : 'Email'}
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        <Input
          label={isTr ? 'Konu' : 'Subject'}
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
        />
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            {isTr ? 'Mesaj' : 'Message'}
          </label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:bg-[var(--focus-bg)] transition-all resize-none"
            placeholder={isTr ? 'Mesajınızı buraya yazın...' : 'Write your message here...'}
          />
        </div>
        <Button type="submit" disabled={sending} className="w-full sm:w-auto">
          <Send size={14} className="mr-2" />
          {sending ? (isTr ? 'Gönderiliyor...' : 'Sending...') : (isTr ? 'Gönder' : 'Send')}
        </Button>
      </form>
    </div>
  );
}
