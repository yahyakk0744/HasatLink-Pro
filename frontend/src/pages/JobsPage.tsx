import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, MapPin, Users, Clock, Plus, Search, ChevronRight,
} from 'lucide-react';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFeatures } from '../hooks/useFeatures';
import toast from 'react-hot-toast';

interface Job {
  _id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userWhatsapp: string;
  title: string;
  description: string;
  category: string;
  workType: string;
  peopleNeeded: number;
  salary: number;
  salaryUnit: string;
  location: { city: string; district: string; address: string };
  startDate: string;
  endDate: string;
  requirements: string[];
  benefits: string[];
  status: string;
  viewCount: number;
  createdAt: string;
}

const WORK_TYPES: Record<string, string> = {
  gunluk: 'Günlük',
  mevsimlik: 'Mevsimlik',
  surekli: 'Sürekli',
  'parca-basi': 'Parça Başı',
};

const CATEGORIES: Record<string, string> = {
  hasat: 'Hasat',
  ekim: 'Ekim',
  bakim: 'Bakım',
  nakliye: 'Nakliye',
  diger: 'Diğer',
};

const SALARY_UNITS: Record<string, string> = {
  gunluk: '/gün',
  aylik: '/ay',
  saat: '/saat',
  sefer: '/sefer',
};

function formatRelative(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR');
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [workType, setWorkType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (workType) params.workType = workType;
    api.get('/jobs', { params })
      .then(({ data }) => setJobs(data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchJobs, [category, workType]);

  if (!featuresLoading && !isEnabled('jobListings')) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Briefcase size={48} className="mx-auto text-[var(--text-secondary)] mb-4" />
        <h1 className="text-xl font-bold mb-2">İş İlanları Yakında</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Mevsimlik işçi ve tarım iş ilanları yakında burada olacak.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO
        title="İş İlanları - HasatLink"
        description="Tarım sektöründe mevsimlik işçi, hasat, ekim, bakım iş ilanları. Hemen başvur."
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Briefcase size={28} className="text-[#2D6A4F]" />
            İş İlanları
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Tarımda mevsimlik işçi, hasat, ekim ve nakliye işleri
          </p>
        </div>
        <button
          onClick={() => {
            if (!user) { toast.error('Giriş yapın'); navigate('/giris'); return; }
            setShowCreate(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] text-white rounded-2xl font-semibold text-sm hover:bg-[#1B4332] transition-colors shadow-sm"
        >
          <Plus size={16} />
          İlan Ver
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="İş ilanlarında ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchJobs()}
            className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F]"
        >
          <option value="">Tüm Kategoriler</option>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={workType}
          onChange={e => setWorkType(e.target.value)}
          className="px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F]"
        >
          <option value="">Tüm Tipler</option>
          {Object.entries(WORK_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Jobs List */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Briefcase size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="text-sm text-[var(--text-secondary)]">Henüz ilan yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <button
              key={job._id}
              onClick={() => setSelected(job)}
              className="w-full text-left bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-1 line-clamp-1">
                    {job.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {job.location?.city}{job.location?.district ? `, ${job.location.district}` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-medium">
                      {CATEGORIES[job.category] || job.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
                      {WORK_TYPES[job.workType] || job.workType}
                    </span>
                    {job.peopleNeeded > 0 && (
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {job.peopleNeeded} kişi
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatRelative(job.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {job.salary > 0 && (
                    <div className="text-lg font-bold text-[#2D6A4F]">
                      {job.salary.toLocaleString('tr-TR')} ₺
                      <span className="text-xs font-normal text-[var(--text-secondary)]">
                        {SALARY_UNITS[job.salaryUnit] || ''}
                      </span>
                    </div>
                  )}
                  <ChevronRight size={16} className="text-[var(--text-secondary)] ml-auto mt-2" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <JobDetailModal job={selected} onClose={() => setSelected(null)} />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateJobModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchJobs(); }}
        />
      )}
    </div>
  );
}

function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2">{job.title}</h2>
        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--text-secondary)] mb-4">
          <span className="px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] font-medium">
            {CATEGORIES[job.category] || job.category}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
            {WORK_TYPES[job.workType] || job.workType}
          </span>
          <span>{job.userName}</span>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">{job.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {job.salary > 0 && (
            <InfoBox label="Ücret" value={`${job.salary.toLocaleString('tr-TR')} ₺${SALARY_UNITS[job.salaryUnit] || ''}`} />
          )}
          {job.peopleNeeded > 0 && (
            <InfoBox label="Kişi Sayısı" value={`${job.peopleNeeded} kişi`} />
          )}
          {job.location?.city && (
            <InfoBox label="Konum" value={`${job.location.city}${job.location.district ? `, ${job.location.district}` : ''}`} />
          )}
          {job.startDate && (
            <InfoBox label="Başlangıç" value={new Date(job.startDate).toLocaleDateString('tr-TR')} />
          )}
        </div>

        {job.requirements?.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Gereksinimler</h3>
            <ul className="space-y-1">
              {job.requirements.map((r, i) => (
                <li key={i} className="text-sm flex gap-2"><span className="text-[#2D6A4F]">•</span>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {job.benefits?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">İmkanlar</h3>
            <ul className="space-y-1">
              {job.benefits.map((b, i) => (
                <li key={i} className="text-sm flex gap-2"><span className="text-green-500">✓</span>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact */}
        <div className="flex gap-3">
          {job.userPhone && (
            <a
              href={`tel:${job.userPhone}`}
              className="flex-1 px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold text-center hover:bg-[#1B4332] transition-colors"
            >
              Ara
            </a>
          )}
          {job.userWhatsapp && (
            <a
              href={`https://wa.me/90${job.userWhatsapp.replace(/\D/g, '').replace(/^90/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-2xl text-sm font-semibold text-center hover:bg-green-700 transition-colors"
            >
              WhatsApp
            </a>
          )}
          <button
            onClick={onClose}
            className="px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[var(--bg-input)] rounded-xl">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-0.5">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function CreateJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'hasat',
    workType: 'mevsimlik',
    peopleNeeded: 1,
    salary: 0,
    salaryUnit: 'gunluk',
    city: '',
    district: '',
    requirements: '',
    benefits: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.city.trim()) {
      toast.error('Başlık, açıklama ve şehir zorunlu');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/jobs', {
        ...form,
        location: { city: form.city, district: form.district, address: '' },
        requirements: form.requirements.split('\n').filter(Boolean),
        benefits: form.benefits.split('\n').filter(Boolean),
      });
      toast.success('İlan oluşturuldu');
      onCreated();
    } catch {
      toast.error('Oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Yeni İş İlanı</h2>
        <div className="space-y-4">
          <FormField label="Başlık" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Hasat işçisi aranıyor" />
          <FormTextarea label="Açıklama" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Detaylı iş tanımı..." />

          <div className="grid grid-cols-2 gap-3">
            <FormSelect label="Kategori" value={form.category} options={CATEGORIES} onChange={v => setForm(f => ({ ...f, category: v }))} />
            <FormSelect label="Çalışma Tipi" value={form.workType} options={WORK_TYPES} onChange={v => setForm(f => ({ ...f, workType: v }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Şehir" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="İstanbul" />
            <FormField label="İlçe" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} placeholder="Silivri" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormNumber label="Kişi Sayısı" value={form.peopleNeeded} onChange={v => setForm(f => ({ ...f, peopleNeeded: v }))} />
            <FormNumber label="Ücret (₺)" value={form.salary} onChange={v => setForm(f => ({ ...f, salary: v }))} />
            <FormSelect label="Birim" value={form.salaryUnit} options={{ gunluk: 'Günlük', aylik: 'Aylık', saat: 'Saatlik', sefer: 'Sefer Başı' }} onChange={v => setForm(f => ({ ...f, salaryUnit: v }))} />
          </div>

          <FormTextarea label="Gereksinimler (her satır bir madde)" value={form.requirements} onChange={v => setForm(f => ({ ...f, requirements: v }))} placeholder="Ehliyet sahibi&#10;18 yaş üstü" rows={3} />
          <FormTextarea label="İmkanlar (her satır bir madde)" value={form.benefits} onChange={v => setForm(f => ({ ...f, benefits: v }))} placeholder="Yemek dahil&#10;Konaklama sağlanır" rows={3} />
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm font-semibold hover:opacity-80 transition-opacity">İptal</button>
          <button onClick={submit} disabled={submitting} className="flex-1 px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors disabled:opacity-50">
            {submitting ? 'Oluşturuluyor...' : 'İlan Ver'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 resize-none" />
    </div>
  );
}

function FormSelect({ label, value, options, onChange }: { label: string; value: string; options: Record<string, string>; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30">
        {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}

function FormNumber({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={0} className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30" />
    </div>
  );
}
