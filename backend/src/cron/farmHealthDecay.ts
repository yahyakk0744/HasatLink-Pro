import FarmPlot from '../models/FarmPlot';
import FarmWeatherLog from '../models/FarmWeatherLog';
import FarmRegion from '../models/FarmRegion';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

/**
 * For each active FarmPlot:
 * - Moisture decay based on weather
 * - Fertilizer decay over time
 * - Health impacts from no watering (48h), no fertilizing (7d),
 *   frost/heat without protection
 * - Update growth_percent and growth_stage
 * - Mark abandoned if health=0 and 7 days no action, free up area in FarmRegion
 *
 * Runs every 6 hours.
 */
export async function healthDecay(): Promise<void> {
  const activePlots = await FarmPlot.find({ status: 'active' });
  const now = new Date();

  for (const plot of activePlots) {
    try {
      let healthDelta = 0;
      let fireDelta = 0;
      let waterDelta = 0;
      let fertDelta = 0;
      const warnings: string[] = [];

      // -- Watering check --
      const hoursSinceWater = plot.last_watered_at
        ? (now.getTime() - new Date(plot.last_watered_at).getTime()) / (1000 * 60 * 60)
        : 999;

      if (hoursSinceWater > 48) {
        healthDelta -= 5;
        waterDelta -= 10;
        warnings.push('Tarlan 48 saattir sulanmadi!');
      } else if (hoursSinceWater > 24) {
        waterDelta -= 5;
      }

      // -- Fertilizer check --
      const daysSinceFertilize = plot.last_fertilized_at
        ? (now.getTime() - new Date(plot.last_fertilized_at).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceFertilize > 7) {
        healthDelta -= 3;
        fertDelta -= 8;
        warnings.push('Gubreleme 7 gunu gecti.');
      }

      // -- Weather risk check --
      const latestWeather = await FarmWeatherLog.findOne({
        region_id: plot.region_id,
      }).sort({ fetched_at: -1 });

      if (latestWeather) {
        const hoursSinceProtection = plot.last_protected_at
          ? (now.getTime() - new Date(plot.last_protected_at).getTime()) / (1000 * 60 * 60)
          : 999;

        // Frost risk + no protection
        if (latestWeather.frost_risk && hoursSinceProtection > 12) {
          healthDelta -= 15;
          fireDelta += 10;
          warnings.push('Don hasari! Koruma yapilmadigi icin verim dustu.');
        }

        // Heat risk + no protection
        if (latestWeather.heat_risk && hoursSinceProtection > 12) {
          healthDelta -= 10;
          fireDelta += 5;
          warnings.push('Sicak stresi! Sulama ve golgeleme gerekli.');
        }
      }

      // -- Clamp values --
      const newHealth = Math.max(0, Math.min(100, plot.health_score + healthDelta));
      const newFire = Math.max(0, Math.min(100, plot.fire_rate + fireDelta));
      const newWater = Math.max(0, Math.min(100, plot.water_level + waterDelta));
      const newFert = Math.max(0, Math.min(100, plot.fertilizer_level + fertDelta));

      // -- Growth progress --
      const seedDate = new Date(plot.seed_date);
      const harvestDate = new Date(plot.estimated_harvest_date);
      const totalDays = (harvestDate.getTime() - seedDate.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = (now.getTime() - seedDate.getTime()) / (1000 * 60 * 60 * 24);
      const growthPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

      // -- Growth stage --
      let growthStage = 'seed';
      if (growthPercent >= 90) growthStage = 'harvest_ready';
      else if (growthPercent >= 70) growthStage = 'fruiting';
      else if (growthPercent >= 50) growthStage = 'flowering';
      else if (growthPercent >= 25) growthStage = 'growing';
      else if (growthPercent >= 10) growthStage = 'sprout';

      // -- Update plot --
      await FarmPlot.findByIdAndUpdate(plot._id, {
        $set: {
          health_score: newHealth,
          fire_rate: newFire,
          water_level: newWater,
          fertilizer_level: newFert,
          growth_percent: Math.round(growthPercent),
          growth_stage: growthStage,
          updated_at: now,
        },
      });

      // -- Critical warning notification (health < 50) --
      if (warnings.length > 0 && newHealth < 50) {
        const title = 'Tarlan Tehlikede!';
        const body = warnings.join(' ') + ` Saglik: %${newHealth}`;

        const notifDoc = await Notification.create({
          userId: plot.user_id,
          type: 'sistem',
          title,
          message: body,
          relatedId: plot.plot_id,
        });

        sendPushToUser(plot.user_id, { title, body, url: '/dijital-tarla' }, notifDoc).catch(() => {});
      }

      // -- Abandoned plot check: health=0 and 7 days (168h) no watering --
      if (newHealth === 0 && hoursSinceWater > 168) {
        await FarmPlot.findByIdAndUpdate(plot._id, {
          $set: { status: 'abandoned', updated_at: now },
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

        const abandonTitle = 'Tarlan Terk Edildi';
        const abandonBody = `${plot.crop_display_name} tarlan saglik skoru 0'a dustu ve 7 gundur islem yapilmadi. Tarla terk edildi olarak isaretlendi.`;

        const notifDoc = await Notification.create({
          userId: plot.user_id,
          type: 'sistem',
          title: abandonTitle,
          message: abandonBody,
          relatedId: plot.plot_id,
        });

        sendPushToUser(plot.user_id, { title: abandonTitle, body: abandonBody, url: '/dijital-tarla' }, notifDoc).catch(() => {});
      }
    } catch (err) {
      console.error(`[HealthDecay] Plot ${plot.plot_id} hatasi:`, err);
    }
  }
}
