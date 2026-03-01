import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { HasatlinkHourlyData } from '../../types';

interface Props {
  data: HasatlinkHourlyData[];
  product?: string;
}

export default function HasatlinkHourlyChart({ data, product }: Props) {
  const chartData = data.map(hourItem => {
    const prices = hourItem.prices;
    if (prices.length === 0) return { hour: hourItem.hour, min: 0, max: 0, avg: 0 };

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
      hour: hourItem.hour,
      min: Math.round(avgMin * 100) / 100,
      max: Math.round(avgMax * 100) / 100,
      avg: Math.round(avgAvg * 100) / 100,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-2xl p-6 shadow-sm text-center text-[var(--text-secondary)]">
        Bugün henüz saatlik veri yok. Yeni ilanlar eklendikçe burada görünecek.
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl p-6 shadow-sm">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DC" />
          <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#6B6560' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B6560' }} tickFormatter={(v) => `${v}₺`} />
          <Tooltip
            formatter={((value: number, name: string) => [
              `${value.toFixed(2)}₺`,
              name === 'min' ? 'En Düşük' : name === 'max' ? 'En Yüksek' : 'Ortalama',
            ]) as any}
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E1DC' }}
          />
          <Legend
            formatter={(value: string) =>
              value === 'min' ? 'En Düşük' : value === 'max' ? 'En Yüksek' : 'Ortalama'
            }
          />
          <Bar dataKey="min" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
          <Bar dataKey="avg" fill="#A47148" radius={[4, 4, 0, 0]} />
          <Bar dataKey="max" fill="#C1341B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
