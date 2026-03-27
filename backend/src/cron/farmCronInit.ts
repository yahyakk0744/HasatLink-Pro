import { weatherSync } from './farmWeatherSync';
import { healthDecay } from './farmHealthDecay';
import { harvestCheck } from './farmHarvestCheck';
import { fomoUpdate } from './farmFomoUpdate';
import { badgeAwarder } from './farmBadgeAwarder';
import FarmSettings from '../models/FarmSettings';

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

  // Auto-fix: beta_mode kapatilmamissa kapat, urun katalogu bosse doldur
  FarmSettings.findOne({ key: 'digital_farm' }).then(async (s) => {
    if (!s) return;
    const updates: any = {};
    if (s.crop_catalog.length === 0) updates.crop_catalog = DEFAULT_CROPS;
    if (s.beta_mode === true && s.enabled === true) updates.beta_mode = false;
    if (Object.keys(updates).length > 0) {
      await FarmSettings.findOneAndUpdate({ key: 'digital_farm' }, { $set: updates });
      console.log('[FarmSettings] Auto-fixed:', Object.keys(updates).join(', '));
    }
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
