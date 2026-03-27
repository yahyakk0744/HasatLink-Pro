import FarmPlot from '../models/FarmPlot';
import FarmHarvest from '../models/FarmHarvest';
import FarmImeceGroup from '../models/FarmImeceGroup';
import FarmRegion from '../models/FarmRegion';
import FarmSettings from '../models/FarmSettings';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

/**
 * Check plots where estimated_harvest_date <= now.
 * Calculate yield: base_yield = area_m2 * yield_per_m2,
 * actual = base * (health/100) * (1 - fire_rate/100).
 * Handle imece splits. Create FarmHarvest records. Send notifications.
 *
 * Runs daily.
 */
export async function harvestCheck(): Promise<void> {
  const now = new Date();

  const readyPlots = await FarmPlot.find({
    status: 'active',
    estimated_harvest_date: { $lte: now },
  });

  if (readyPlots.length === 0) return;

  const settings = await FarmSettings.findOne({ key: 'digital_farm' });
  const cropCatalog = settings?.crop_catalog || [];

  for (const plot of readyPlots) {
    try {
      // Yield calculation
      const cropInfo = cropCatalog.find((c) => c.crop_type === plot.crop_type);
      const yieldPerM2 = cropInfo?.yield_per_m2_kg || 0.5;

      const base_yield_kg = plot.area_m2 * yieldPerM2;
      const health_multiplier = plot.health_score / 100;
      const fire_multiplier = 1 - (plot.fire_rate / 100);
      const actual_yield_kg =
        Math.round(base_yield_kg * health_multiplier * fire_multiplier * 100) / 100;

      // Quality score: 60% health + 40% fire absence
      const quality_score = Math.round(
        (plot.health_score * 0.6) + ((100 - plot.fire_rate) * 0.4)
      );

      // Build harvest record
      const harvest: any = {
        harvest_id: `harvest_${Date.now()}_${plot.plot_id}`,
        plot_id: plot.plot_id,
        user_id: plot.user_id,
        region_id: plot.region_id,
        crop_type: plot.crop_type,
        base_yield_kg,
        health_multiplier,
        fire_multiplier,
        actual_yield_kg,
        quality_score,
        shipping_status: 'pending',
        is_imece: plot.is_imece,
        created_at: now,
      };

      // Imece split
      if (plot.is_imece && plot.imece_group_id) {
        const group = await FarmImeceGroup.findOne({ group_id: plot.imece_group_id });

        if (group) {
          const activeMembers = group.members.filter((m: any) => m.status === 'active');

          harvest.imece_shares = activeMembers.map((m: any) => ({
            user_id: m.user_id,
            share_kg: Math.round((actual_yield_kg * m.share_percent / 100) * 100) / 100,
            shipping_status: 'pending',
          }));

          // Notify each imece member
          for (const m of activeMembers) {
            const shareKg = (actual_yield_kg * m.share_percent / 100).toFixed(1);

            const notifDoc = await Notification.create({
              userId: m.user_id,
              type: 'sistem',
              title: 'Hasat Zamani Geldi!',
              message: `${plot.crop_display_name} hasadiniz hazir! Payiniz: ${shareKg} kg. Kargo adresinizi girin.`,
              relatedId: plot.plot_id,
            });

            sendPushToUser(m.user_id, {
              title: 'Hasat Zamani!',
              body: `${shareKg} kg ${plot.crop_display_name} payiniz hazir!`,
              url: '/dijital-tarla',
            }, notifDoc).catch(() => {});
          }
        }
      } else {
        // Single user notification
        const notifDoc = await Notification.create({
          userId: plot.user_id,
          type: 'sistem',
          title: 'Hasat Zamani Geldi!',
          message: `${plot.crop_display_name} hasadiniz hazir! Toplam: ${actual_yield_kg.toFixed(1)} kg. Kargo adresinizi girin.`,
          relatedId: plot.plot_id,
        });

        sendPushToUser(plot.user_id, {
          title: 'Hasat Zamani!',
          body: `${actual_yield_kg.toFixed(1)} kg ${plot.crop_display_name} hasadiniz hazir!`,
          url: '/dijital-tarla',
        }, notifDoc).catch(() => {});
      }

      // Create harvest record
      await FarmHarvest.create(harvest);

      // Update plot status
      await FarmPlot.findByIdAndUpdate(plot._id, {
        $set: {
          status: 'harvesting',
          actual_harvest_date: now,
          growth_stage: 'harvest_ready',
          growth_percent: 100,
          updated_at: now,
        },
      });

      // Free up area in region
      await FarmRegion.findOneAndUpdate(
        { region_id: plot.region_id },
        {
          $inc: {
            rented_area_m2: -plot.area_m2,
            available_area_m2: plot.area_m2,
          },
        },
      );
    } catch (err) {
      console.error(`[HarvestCheck] Plot ${plot.plot_id} hatasi:`, err);
    }
  }
}
