import { weatherSync } from './farmWeatherSync';
import { healthDecay } from './farmHealthDecay';
import { harvestCheck } from './farmHarvestCheck';
import { fomoUpdate } from './farmFomoUpdate';
import { badgeAwarder } from './farmBadgeAwarder';

// Interval durations
const THIRTY_MINUTES = 30 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * Initialize all Digital Farm cron jobs with setInterval timers.
 * Call this once from index.ts after server starts.
 */
export function initFarmCrons(): void {
  console.log('[FarmCron] Dijital Tarla cron job\'lari baslatiliyor...');

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
