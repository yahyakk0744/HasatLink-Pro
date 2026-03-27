import { weatherSync } from './farmWeatherSync';
import { healthDecay } from './farmHealthDecay';
import { harvestCheck } from './farmHarvestCheck';
import { fomoUpdate } from './farmFomoUpdate';
import { badgeAwarder } from './farmBadgeAwarder';
import FarmSettings from '../models/FarmSettings';
import FarmRegion from '../models/FarmRegion';

// Interval durations
const THIRTY_MINUTES = 30 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * Initialize all Digital Farm cron jobs with setInterval timers.
 * Call this once from index.ts after server starts.
 */
const DEFAULT_CROPS = [
  { crop_type: 'domates', display_name: 'Domates', seed_cost_per_m2: 3, min_area_m2: 5, growth_days: 75, yield_per_m2_kg: 3.5, season_start_month: 3, season_end_month: 8, water_frequency_hours: 24, fertilize_frequency_days: 7, icon_emoji: '🍅' },
  { crop_type: 'biber', display_name: 'Biber', seed_cost_per_m2: 4, min_area_m2: 5, growth_days: 65, yield_per_m2_kg: 2.8, season_start_month: 4, season_end_month: 9, water_frequency_hours: 20, fertilize_frequency_days: 7, icon_emoji: '🌶️' },
  { crop_type: 'salatalik', display_name: 'Salatalik', seed_cost_per_m2: 2.5, min_area_m2: 5, growth_days: 55, yield_per_m2_kg: 4.0, season_start_month: 4, season_end_month: 9, water_frequency_hours: 18, fertilize_frequency_days: 5, icon_emoji: '🥒' },
  { crop_type: 'kayisi', display_name: 'Kayisi', seed_cost_per_m2: 8, min_area_m2: 10, growth_days: 120, yield_per_m2_kg: 2.0, season_start_month: 2, season_end_month: 6, water_frequency_hours: 48, fertilize_frequency_days: 14, icon_emoji: '🍑' },
  { crop_type: 'zeytin', display_name: 'Zeytin', seed_cost_per_m2: 10, min_area_m2: 15, growth_days: 210, yield_per_m2_kg: 1.5, season_start_month: 1, season_end_month: 12, water_frequency_hours: 72, fertilize_frequency_days: 21, icon_emoji: '🫒' },
];

export function initFarmCrons(): void {
  console.log('[FarmCron] Dijital Tarla cron job\'lari baslatiliyor...');

  // Auto-fix settings
  FarmSettings.findOne({ key: 'digital_farm' }).then(async (s) => {
    if (!s) return;
    const updates: any = {};
    // Sadece sebze katalogu
    const SEBZE_CATALOG = [
      { crop_type: 'domates', display_name: 'Domates', seed_cost_per_m2: 3, min_area_m2: 5, growth_days: 75, yield_per_m2_kg: 3.5, season_start_month: 3, season_end_month: 8, water_frequency_hours: 24, fertilize_frequency_days: 7, icon_emoji: '🍅' },
      { crop_type: 'biber', display_name: 'Biber', seed_cost_per_m2: 4, min_area_m2: 5, growth_days: 65, yield_per_m2_kg: 2.8, season_start_month: 4, season_end_month: 9, water_frequency_hours: 20, fertilize_frequency_days: 7, icon_emoji: '🌶️' },
      { crop_type: 'salatalik', display_name: 'Salatalik / Kornison', seed_cost_per_m2: 2.5, min_area_m2: 5, growth_days: 55, yield_per_m2_kg: 4.0, season_start_month: 4, season_end_month: 9, water_frequency_hours: 18, fertilize_frequency_days: 5, icon_emoji: '🥒' },
      { crop_type: 'patlican', display_name: 'Patlican', seed_cost_per_m2: 3.5, min_area_m2: 5, growth_days: 70, yield_per_m2_kg: 3.0, season_start_month: 4, season_end_month: 9, water_frequency_hours: 22, fertilize_frequency_days: 7, icon_emoji: '🍆' },
      { crop_type: 'kabak', display_name: 'Kabak', seed_cost_per_m2: 2, min_area_m2: 5, growth_days: 50, yield_per_m2_kg: 4.5, season_start_month: 4, season_end_month: 9, water_frequency_hours: 24, fertilize_frequency_days: 7, icon_emoji: '🎃' },
      { crop_type: 'fasulye', display_name: 'Fasulye', seed_cost_per_m2: 2, min_area_m2: 5, growth_days: 60, yield_per_m2_kg: 2.0, season_start_month: 4, season_end_month: 8, water_frequency_hours: 24, fertilize_frequency_days: 10, icon_emoji: '🫘' },
      { crop_type: 'marul', display_name: 'Marul / Yesil Salata', seed_cost_per_m2: 1.5, min_area_m2: 3, growth_days: 35, yield_per_m2_kg: 2.5, season_start_month: 3, season_end_month: 10, water_frequency_hours: 12, fertilize_frequency_days: 7, icon_emoji: '🥬' },
      { crop_type: 'ispanak', display_name: 'Ispanak', seed_cost_per_m2: 1.5, min_area_m2: 3, growth_days: 40, yield_per_m2_kg: 2.0, season_start_month: 9, season_end_month: 4, water_frequency_hours: 18, fertilize_frequency_days: 10, icon_emoji: '🥬' },
      { crop_type: 'havuc', display_name: 'Havuc', seed_cost_per_m2: 2, min_area_m2: 3, growth_days: 70, yield_per_m2_kg: 3.0, season_start_month: 3, season_end_month: 9, water_frequency_hours: 24, fertilize_frequency_days: 10, icon_emoji: '🥕' },
      { crop_type: 'sogan', display_name: 'Sogan', seed_cost_per_m2: 1.5, min_area_m2: 3, growth_days: 90, yield_per_m2_kg: 3.5, season_start_month: 2, season_end_month: 5, water_frequency_hours: 36, fertilize_frequency_days: 14, icon_emoji: '🧅' },
    ];
    // Kayisi/zeytin varsa veya bossa sadece sebze kataloguyla degistir
    const hasFruit = s.crop_catalog.some((c: any) => ['kayisi', 'zeytin'].includes(c.crop_type));
    if (s.crop_catalog.length === 0 || hasFruit) updates.crop_catalog = SEBZE_CATALOG;
    if (s.beta_mode === true && s.enabled === true) updates.beta_mode = false;
    if (Object.keys(updates).length > 0) {
      await FarmSettings.findOneAndUpdate({ key: 'digital_farm' }, { $set: updates });
      console.log('[FarmSettings] Auto-fixed:', Object.keys(updates).join(', '));
    }
  }).catch(() => {});

  // Auto-seed: Bolge yoksa varsayilan bolgeler ekle
  FarmRegion.countDocuments().then(async (count) => {
    if (count > 0) return;
    const defaultRegions = [
      {
        region_id: 'mut-sebze-01',
        region_name: 'Mut Sebze Bahcesi',
        city_code: '33', city_name: 'Mersin', district: 'Mut',
        coordinates: { lat: 36.6485, lng: 33.4373 },
        total_area_m2: 2000, rented_area_m2: 0, available_area_m2: 2000, available_percent: 100,
        crop_types: ['domates', 'biber', 'salatalik', 'patlican'],
        description: 'Mut\'un verimli ovalarinda organik sebze yetistirme alani. Damla sulama sistemi, gubre deposu ve saha ekibi mevcut.',
        is_active: true,
      },
      {
        region_id: 'antalya-sera-01',
        region_name: 'Antalya Sera Tarlasi',
        city_code: '07', city_name: 'Antalya', district: 'Kumluca',
        coordinates: { lat: 36.3550, lng: 30.2919 },
        total_area_m2: 1500, rented_area_m2: 0, available_area_m2: 1500, available_percent: 100,
        crop_types: ['domates', 'biber', 'patlican', 'kabak', 'salatalik'],
        description: 'Antalya Kumluca\'da kontrollü sera ortaminda sebze uretimi. Yil boyunca ekim mumkun.',
        is_active: true,
      },
      {
        region_id: 'adana-cukurova-01',
        region_name: 'Cukurova Sebze Alani',
        city_code: '01', city_name: 'Adana', district: 'Yureğir',
        coordinates: { lat: 36.9917, lng: 35.3250 },
        total_area_m2: 3000, rented_area_m2: 0, available_area_m2: 3000, available_percent: 100,
        crop_types: ['domates', 'biber', 'fasulye', 'kabak', 'marul', 'havuc'],
        description: 'Turkiye\'nin en verimli tarım ovasi Cukurova\'da genis sebze uretim alani.',
        is_active: true,
      },
      {
        region_id: 'bursa-karacabey-01',
        region_name: 'Karacabey Organik Tarla',
        city_code: '16', city_name: 'Bursa', district: 'Karacabey',
        coordinates: { lat: 40.2130, lng: 28.3603 },
        total_area_m2: 1000, rented_area_m2: 0, available_area_m2: 1000, available_percent: 100,
        crop_types: ['ispanak', 'marul', 'havuc', 'sogan', 'fasulye'],
        description: 'Marmara bolgesi\'nin serin iklimine uygun yesil yaprakli sebzeler ve kok sebzeler.',
        is_active: true,
      },
    ];
    await FarmRegion.insertMany(defaultRegions);
    console.log('[FarmRegion] 4 varsayilan bolge eklendi');
  }).catch(() => {});

  // Weather sync: every 30 minutes
  setInterval(() => {
    weatherSync().catch((e) => console.error('[CRON] weatherSync:', e));
  }, THIRTY_MINUTES);

  // Health decay: every 6 hours
  setInterval(() => {
    healthDecay().catch((e) => console.error('[CRON] healthDecay:', e));
  }, SIX_HOURS);

  // Harvest check: daily (every 24 hours)
  setInterval(() => {
    harvestCheck().catch((e) => console.error('[CRON] harvestCheck:', e));
  }, TWENTY_FOUR_HOURS);

  // FOMO update: every 5 minutes
  setInterval(() => {
    fomoUpdate().catch((e) => console.error('[CRON] fomoUpdate:', e));
  }, FIVE_MINUTES);

  // Badge awarder: daily (every 24 hours)
  setInterval(() => {
    badgeAwarder().catch((e) => console.error('[CRON] badgeAwarder:', e));
  }, TWENTY_FOUR_HOURS);

  console.log('[FarmCron] Tum cron job\'lar aktif:');
  console.log('  - weatherSync:   her 30 dakika');
  console.log('  - healthDecay:   her 6 saat');
  console.log('  - harvestCheck:  gunluk');
  console.log('  - fomoUpdate:    her 5 dakika');
  console.log('  - badgeAwarder:  gunluk');
}
