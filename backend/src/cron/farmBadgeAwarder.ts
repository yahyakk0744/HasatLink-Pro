import FarmPlot from '../models/FarmPlot';
import FarmAction from '../models/FarmAction';
import FarmHarvest from '../models/FarmHarvest';
import FarmSocial from '../models/FarmSocial';
import FarmImeceGroup from '../models/FarmImeceGroup';
import FarmBadge from '../models/FarmBadge';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

interface BadgeDefinition {
  type: string;
  name: string;
  icon: string;
  desc: string;
  check: (userId: string) => Promise<boolean>;
}

const BADGES: BadgeDefinition[] = [
  {
    type: 'ilk_tohum',
    name: 'Ilk Tohum',
    icon: '\uD83C\uDF31', // seedling
    desc: 'Ilk tarlani ektin!',
    check: async (userId: string) => {
      const count = await FarmPlot.countDocuments({ user_id: userId });
      return count >= 1;
    },
  },
  {
    type: 'su_ustasi',
    name: 'Su Ustasi',
    icon: '\uD83D\uDCA7', // droplet
    desc: '50 kez sulama yaptin!',
    check: async (userId: string) => {
      const count = await FarmAction.countDocuments({ user_id: userId, action_type: 'water' });
      return count >= 50;
    },
  },
  {
    type: 'gubre_gurusu',
    name: 'Gubre Gurusu',
    icon: '\uD83E\uDDEA', // test tube
    desc: '30 kez gubreleme yaptin!',
    check: async (userId: string) => {
      const count = await FarmAction.countDocuments({ user_id: userId, action_type: 'fertilize' });
      return count >= 30;
    },
  },
  {
    type: 'ilk_hasat',
    name: 'Ilk Hasat',
    icon: '\uD83C\uDF89', // party
    desc: 'Ilk hasadini aldin!',
    check: async (userId: string) => {
      const count = await FarmHarvest.countDocuments({ user_id: userId });
      return count >= 1;
    },
  },
  {
    type: 'bilinçli_uretici',
    name: 'Bilincli Uretici',
    icon: '\uD83C\uDFC6', // trophy
    desc: '30 gun boyunca saglik 80+ tutuldun',
    check: async (userId: string) => {
      const plots = await FarmPlot.find({
        user_id: userId,
        status: 'active',
        health_score: { $gte: 80 },
      });
      for (const p of plots) {
        const days = (Date.now() - new Date(p.seed_date).getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 30) return true;
      }
      return false;
    },
  },
  {
    type: 'imece_lideri',
    name: 'Imece Lideri',
    icon: '\uD83E\uDD1D', // handshake
    desc: 'Ortak tarla olusturdun',
    check: async (userId: string) => {
      const count = await FarmImeceGroup.countDocuments({ owner_id: userId });
      return count >= 1;
    },
  },
  {
    type: 'sosyal_ciftci',
    name: 'Sosyal Ciftci',
    icon: '\u2B50', // star
    desc: '10 tarlaya yorum biraktin',
    check: async (userId: string) => {
      const count = await FarmSocial.countDocuments({ visitor_id: userId });
      return count >= 10;
    },
  },
  {
    type: 'hasat_krali',
    name: 'Hasat Krali',
    icon: '\uD83D\uDC51', // crown
    desc: '5 basarili hasat tamamladin',
    check: async (userId: string) => {
      const count = await FarmHarvest.countDocuments({
        user_id: userId,
        shipping_status: 'delivered',
      });
      return count >= 5;
    },
  },
  {
    type: 'erken_kus',
    name: 'Erken Kus',
    icon: '\uD83D\uDC26', // bird
    desc: 'Don uyarisina 1 saat icinde mudahale ettin',
    check: async (userId: string) => {
      // Check if user has a frost protection action within 1 hour of a frost risk weather log
      const protections = await FarmAction.find({
        user_id: userId,
        action_type: 'protect_frost',
      }).sort({ created_at: -1 }).limit(10);

      for (const action of protections) {
        const plot = await FarmPlot.findOne({ plot_id: action.plot_id });
        if (!plot) continue;

        const { default: FarmWeatherLog } = await import('../models/FarmWeatherLog');
        const weatherBefore = await FarmWeatherLog.findOne({
          region_id: plot.region_id,
          frost_risk: true,
          fetched_at: {
            $gte: new Date(new Date(action.created_at).getTime() - 60 * 60 * 1000),
            $lte: action.created_at,
          },
        });

        if (weatherBefore) return true;
      }
      return false;
    },
  },
  {
    type: 'yeşil_parmak',
    name: 'Yesil Parmak',
    icon: '\uD83E\uDD1A', // raised back of hand (green thumb)
    desc: 'Saglik skoru hic 50 altina dusmedi',
    check: async (userId: string) => {
      const plots = await FarmPlot.find({ user_id: userId });
      if (plots.length === 0) return false;

      // All plots must have health >= 50 and at least one with 30+ days age
      const hasOldEnoughPlot = plots.some((p) => {
        const days = (Date.now() - new Date(p.seed_date).getTime()) / (1000 * 60 * 60 * 24);
        return days >= 30;
      });
      if (!hasOldEnoughPlot) return false;

      const belowThreshold = plots.some((p) => p.health_score < 50);
      return !belowThreshold;
    },
  },
  {
    type: 'meteor_ciftci',
    name: 'Meteor Ciftci',
    icon: '\u2604\uFE0F', // comet
    desc: 'Sifir fire ile hasat tamamladin!',
    check: async (userId: string) => {
      const harvest = await FarmHarvest.findOne({
        user_id: userId,
        fire_multiplier: 1.0,
      });
      return !!harvest;
    },
  },
  {
    type: 'topluluk_yildizi',
    name: 'Topluluk Yildizi',
    icon: '\uD83C\uDF1F', // glowing star
    desc: 'Ortalama 4.5+ puan aldin',
    check: async (userId: string) => {
      const plots = await FarmPlot.find({ user_id: userId });
      if (plots.length === 0) return false;

      const plotIds = plots.map((p) => p.plot_id);
      const ratings = await FarmSocial.find({ plot_id: { $in: plotIds }, rating: { $exists: true } });
      if (ratings.length < 3) return false; // need at least 3 ratings

      const avg = ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length;
      return avg >= 4.5;
    },
  },
];

/**
 * Check 12 badge criteria for all users with plots.
 * Award new badges. Send notification on new badge.
 *
 * Runs daily.
 */
export async function badgeAwarder(): Promise<void> {
  // Get all unique user IDs that have ever created a plot
  const users: string[] = await FarmPlot.distinct('user_id');

  for (const userId of users) {
    for (const badge of BADGES) {
      try {
        // Skip if already earned
        const existing = await FarmBadge.findOne({ user_id: userId, badge_type: badge.type });
        if (existing) continue;

        const earned = await badge.check(userId);
        if (earned) {
          await FarmBadge.create({
            user_id: userId,
            badge_type: badge.type,
            badge_name: badge.name,
            badge_icon: badge.icon,
            description: badge.desc,
            earned_at: new Date(),
          });

          const notifDoc = await Notification.create({
            userId,
            type: 'sistem',
            title: `Yeni Rozet: ${badge.icon} ${badge.name}`,
            message: badge.desc,
          });

          sendPushToUser(userId, {
            title: `Yeni Rozet: ${badge.icon} ${badge.name}`,
            body: badge.desc,
            url: '/dijital-tarla',
          }, notifDoc).catch(() => {});
        }
      } catch (err) {
        console.error(`[BadgeAwarder] Badge ${badge.type} for user ${userId} hatasi:`, err);
      }
    }
  }
}
