import FarmRegion from '../models/FarmRegion';
import FarmWaitlist from '../models/FarmWaitlist';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

/**
 * Recalculate available_percent for each active FarmRegion.
 * Notify waitlist users when area becomes available (was 0, now > 0).
 *
 * Runs every 5 minutes.
 */
export async function fomoUpdate(): Promise<void> {
  const regions = await FarmRegion.find({ is_active: true });

  for (const region of regions) {
    try {
      const prevPercent = region.available_percent;
      const newPercent = region.total_area_m2 > 0
        ? (region.available_area_m2 / region.total_area_m2) * 100
        : 0;

      // Update percentage
      await FarmRegion.findByIdAndUpdate(region._id, {
        $set: {
          available_percent: Math.round(newPercent * 10) / 10,
          updated_at: new Date(),
        },
      });

      // Log threshold crossings
      if (prevPercent >= 20 && newPercent < 20) {
        console.log(`[FOMO] ${region.region_name}: Amber esigi gecildi (%${newPercent.toFixed(1)})`);
      }

      if (prevPercent >= 10 && newPercent < 10) {
        console.log(`[FOMO] ${region.region_name}: Kirmizi esik! (%${newPercent.toFixed(1)})`);
      }

      // Notify waitlist when area becomes available (was sold out, now open)
      if (prevPercent <= 0 && newPercent > 0) {
        const waiters = await FarmWaitlist.find({
          region_id: region.region_id,
          status: 'waiting',
        }).limit(20);

        for (const w of waiters) {
          const notifDoc = await Notification.create({
            userId: w.user_id,
            type: 'sistem',
            title: 'Alan Acildi!',
            message: `${region.region_name} bolgesinde ${region.available_area_m2} m\u00B2 alan acildi! Hemen kirala.`,
            relatedId: region.region_id,
          });

          sendPushToUser(w.user_id, {
            title: 'Alan Acildi!',
            body: `${region.region_name} bolgesinde alan musait!`,
            url: '/dijital-tarla',
          }, notifDoc).catch(() => {});

          // Mark waitlist entry as notified
          await FarmWaitlist.findByIdAndUpdate(w._id, {
            $set: { status: 'notified' },
          });
        }
      }
    } catch (err) {
      console.error(`[FomoUpdate] ${region.region_id} hatasi:`, err);
    }
  }
}
