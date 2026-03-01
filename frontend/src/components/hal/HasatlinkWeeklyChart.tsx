import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { WeeklyPriceDay } from '../../types';

interface Props {
  data: WeeklyPriceDay[];
  product?: string;
}

export default function HasatlinkWeeklyChart({ data, product }: Props) {
  const chartData = data.map(day => {
    const prices = day.prices;
    if (prices.length === 0) return { date: day.date.slice(5), min: 0, max: 0, avg: 0 };

    let targetPrices = prices;
    if (product) {
      const filtered = prices.filter(p =>
        p.name.toLowerCase().includes(product.toLowerCase())
      );
      if (filtered.length > 0) targetPrices = filtered;
    }

    const avgMin = targetPrices.reduce((s, p) => s + p.min, 0) / targetPrices.length;
    const avgMax = targetPrices.reduce((s, p) => s + p.max, 0) / targetPrices.length;
    const avgAvg = targetPrices.reduce((s, p) => s + p.avg, 0) / targetPrices.length;

    return {
      date: day.date.slice(5),
      min: Math.round(avgMin * 100) / 100,
      max: Math.round(avgMax * 100) / 100,
      avg: Math.round(avgAvg * 100) / 100,
    };
  });

  if (chartData.length === 0 || chartData.every(d => d.min === 0 && d.max === 0)) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-2xl p-6 shadow-sm text-center text-[var(--text-secondary)]">
        Haftalık veri bulunamadı. Yeni ilanlar eklendikçe burada görünecek.
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl p-6 shadow-sm">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DC" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B6560' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B6560' }} tickFormatter={(v) => `${v}₺`} />
          <Tooltip
            formatter={(value: number | undefined, name: string) => [
              `${(value as number)?.toFixed(2)}₺`,
              name === 'min' ? 'En Düşük' : name === 'max' ? 'En Yüksek' : 'Ortalama',
            ]}
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E1DC' }}
          />
          <Legend
            formatter={(value: string) =>
              value === 'min' ? 'En Düşük' : value === 'max' ? 'En Yüksek' : 'Ortalama'
            }
          />
          <Line type="monotone" dataKey="min" stroke="#2D6A4F" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="max" stroke="#C1341B" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="avg" stroke="#A47148" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
