import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

interface BulkUploadProps {
  onSuccess?: () => void;
}

interface UploadResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

const CSV_TEMPLATE = `title,type,subCategory,price,amount,unit,location,description,isOrganic,harvestDate
"Organik Domates",pazar,"Domates",25,500,kg,"Antalya","Taze organik domates",true,2026-06-01
"Kuru Soğan",pazar,"Soğan",12,1000,kg,"Konya","Depo soğanı",false,`;

export default function BulkUpload({ onSuccess }: BulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      toast.error('Sadece CSV dosyası yükleyebilirsiniz');
      return;
    }
    setFile(f);
    setResult(null);

    // Parse preview
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const rows = lines.slice(0, 6).map(l =>
        l.split(',').map(c => c.replace(/^"|"$/g, '').trim())
      );
      setPreview(rows);
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<UploadResult>('/listings/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.success > 0) {
        toast.success(`${data.success} ilan başarıyla oluşturuldu`);
        onSuccess?.();
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} ilan hatalı`);
      }
    } catch {
      toast.error('Toplu yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hasatlink-toplu-ilan-sablonu.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl p-5 space-y-4 border border-[var(--border-default)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
          <FileSpreadsheet size={20} className="text-[#7C3AED]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Toplu İlan Yükleme</h3>
          <p className="text-[10px] text-[var(--text-secondary)]">CSV dosyası ile birden fazla ilan oluşturun</p>
        </div>
      </div>

      {/* Template download */}
      <button
        onClick={downloadTemplate}
        className="flex items-center gap-2 text-xs font-medium text-[#0077B6] hover:underline"
      >
        <Download size={12} />
        CSV Şablon İndir
      </button>

      {/* File input */}
      <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-[var(--border-default)] rounded-2xl cursor-pointer hover:border-[#7C3AED] hover:bg-[#7C3AED]/5 transition-all">
        <Upload size={24} className="text-[var(--text-tertiary)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {file ? file.name : 'CSV dosyası seçin veya sürükleyin'}
        </span>
        <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
      </label>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                {preview[0].map((h, i) => (
                  <th key={i} className="px-2 py-1 text-left font-semibold uppercase tracking-wide text-[var(--text-secondary)] bg-[var(--bg-input)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(1).map((row, i) => (
                <tr key={i} className="border-t border-[var(--border-default)]">
                  {row.map((cell, j) => (
                    <td key={j} className="px-2 py-1 text-[var(--text-primary)] truncate max-w-[120px]">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload button */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#7C3AED] text-white rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50"
        >
          <Upload size={14} />
          {uploading ? 'Yükleniyor...' : `${preview.length - 1} İlanı Yükle`}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-2">
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-xl bg-green-50 text-center">
              <CheckCircle2 size={16} className="text-green-600 mx-auto mb-1" />
              <p className="text-sm font-bold text-green-700">{result.success}</p>
              <p className="text-[10px] text-green-600">Başarılı</p>
            </div>
            {result.failed > 0 && (
              <div className="flex-1 p-3 rounded-xl bg-red-50 text-center">
                <AlertCircle size={16} className="text-red-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-red-700">{result.failed}</p>
                <p className="text-[10px] text-red-600">Hatalı</p>
              </div>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-red-50 space-y-1">
              {result.errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-[10px] text-red-600">• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
