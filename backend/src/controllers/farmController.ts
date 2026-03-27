import { Request, Response } from 'express';
import FarmSettings from '../models/FarmSettings';
import FarmRegion from '../models/FarmRegion';
import FarmPlot from '../models/FarmPlot';
import FarmAction from '../models/FarmAction';
import FarmTransaction from '../models/FarmTransaction';
import FarmImeceGroup from '../models/FarmImeceGroup';
import FarmDiary from '../models/FarmDiary';
import FarmSocial from '../models/FarmSocial';
import FarmHarvest from '../models/FarmHarvest';
import FarmBadge from '../models/FarmBadge';
import FarmWaitlist from '../models/FarmWaitlist';
import User from '../models/User';

// ─── Helpers ───

const generateId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const generateInviteCode = (): string => Math.random().toString(36).slice(2, 8).toUpperCase();

const getSettings = async () => {
  let settings = await FarmSettings.findOne({ key: 'digital_farm' });
  if (!settings) {
    settings = await FarmSettings.create({ key: 'digital_farm' });
  }
  return settings;
};

const ACTION_CONFIG: Record<string, { costField: string; txType: string; impacts: Record<string, number> }> = {
  water: {
    costField: 'water_per_action',
    txType: 'water',
    impacts: { water_impact: 30, health_impact: 5 },
  },
  fertilize: {
    costField: 'fertilizer_per_action',
    txType: 'fertilizer',
    impacts: { fertilizer_impact: 25, health_impact: 5 },
  },
  protect_frost: {
    costField: 'frost_protection_cost',
    txType: 'frost_protection',
    impacts: { health_impact: 10 },
  },
  protect_heat: {
    costField: 'heat_protection_cost',
    txType: 'heat_protection',
    impacts: { health_impact: 10 },
  },
};

// ═══════════════════════════════════════════════════
// ACCESS & SETTINGS
// ═══════════════════════════════════════════════════

export const checkAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await User.findOne({ userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanici bulunamadi' });
      return;
    }

    const settings = await getSettings();

    // Module disabled
    if (!settings.enabled) {
      res.json({ allowed: false, reason: 'disabled', settings: null });
      return;
    }

    // Beta mode: whitelist only
    if (settings.beta_mode) {
      const inWhitelist = settings.whitelist_user_ids.includes(userId);
      if (!inWhitelist) {
        res.json({ allowed: false, reason: 'beta_only', settings: null });
        return;
      }
      res.json({ allowed: true, reason: 'whitelisted', settings: { pricing: settings.pricing, crop_catalog: settings.crop_catalog, active_cities: settings.active_cities } });
      return;
    }

    // City check
    const userCity = (user.location || '').toLowerCase().trim();
    const activeCityNames = settings.active_cities.map(c => c.city_name.toLowerCase());
    const inWhitelist = settings.whitelist_user_ids.includes(userId);
    const inActiveCity = activeCityNames.some(cn => userCity.includes(cn));

    if (!inActiveCity && !inWhitelist) {
      res.json({ allowed: false, reason: 'city_blocked', settings: null });
      return;
    }

    res.json({
      allowed: true,
      reason: inWhitelist ? 'whitelisted' : 'city_active',
      settings: {
        pricing: settings.pricing,
        crop_catalog: settings.crop_catalog,
        active_cities: settings.active_cities,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erisim kontrolu hatasi', error });
  }
};

export const getPublicSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getSettings();
    res.json({
      enabled: settings.enabled,
      pricing: settings.pricing,
      crop_catalog: settings.crop_catalog,
      active_cities: settings.active_cities,
      fomo_thresholds: settings.fomo_thresholds,
    });
  } catch (error) {
    res.status(500).json({ message: 'Ayarlar alinamadi', error });
  }
};

// ═══════════════════════════════════════════════════
// REGIONS
// ═══════════════════════════════════════════════════

export const getRegions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city_code } = req.query;
    const filter: Record<string, any> = { is_active: true };
    if (city_code && typeof city_code === 'string') {
      filter.city_code = city_code;
    }

    const regions = await FarmRegion.find(filter).sort({ available_percent: 1 });
    const settings = await getSettings();

    const enriched = regions.map(r => {
      const doc = r.toObject();
      let fomo_level: 'none' | 'amber' | 'red' | 'sold_out' = 'none';
      if (doc.available_area_m2 <= 0) fomo_level = 'sold_out';
      else if (doc.available_percent < settings.fomo_thresholds.red_percent) fomo_level = 'red';
      else if (doc.available_percent < settings.fomo_thresholds.amber_percent) fomo_level = 'amber';
      return { ...doc, fomo_level };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Bolgeler alinamadi', error });
  }
};

export const getRegionDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const region = await FarmRegion.findOne({ region_id: req.params.regionId });
    if (!region) {
      res.status(404).json({ message: 'Bolge bulunamadi' });
      return;
    }

    const settings = await getSettings();
    const doc = region.toObject();

    let fomo_level: 'none' | 'amber' | 'red' | 'sold_out' = 'none';
    if (doc.available_area_m2 <= 0) fomo_level = 'sold_out';
    else if (doc.available_percent < settings.fomo_thresholds.red_percent) fomo_level = 'red';
    else if (doc.available_percent < settings.fomo_thresholds.amber_percent) fomo_level = 'amber';

    const activePlots = await FarmPlot.countDocuments({ region_id: doc.region_id, status: 'active' });
    const diary = await FarmDiary.find({ region_id: doc.region_id }).sort({ created_at: -1 }).limit(5);

    res.json({ ...doc, fomo_level, active_plots: activePlots, recent_diary: diary });
  } catch (error) {
    res.status(500).json({ message: 'Bolge detayi alinamadi', error });
  }
};

// ═══════════════════════════════════════════════════
// PLOTS
// ═══════════════════════════════════════════════════

export const rentPlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { region_id, area_m2, crop_type } = req.body;

    if (!region_id || !area_m2 || !crop_type) {
      res.status(400).json({ message: 'region_id, area_m2 ve crop_type zorunlu' });
      return;
    }

    if (typeof area_m2 !== 'number' || area_m2 <= 0) {
      res.status(400).json({ message: 'area_m2 pozitif sayi olmali' });
      return;
    }

    // Validate region
    const region = await FarmRegion.findOne({ region_id, is_active: true });
    if (!region) {
      res.status(404).json({ message: 'Bolge bulunamadi veya aktif degil' });
      return;
    }

    // Validate crop type
    const settings = await getSettings();
    const cropInfo = settings.crop_catalog.find(c => c.crop_type === crop_type);
    if (!cropInfo) {
      res.status(400).json({ message: 'Gecersiz urun tipi' });
      return;
    }

    if (!region.crop_types.includes(crop_type)) {
      res.status(400).json({ message: 'Bu bolge secilen urunu desteklemiyor' });
      return;
    }

    // Check minimum area
    if (area_m2 < cropInfo.min_area_m2) {
      res.status(400).json({ message: `Minimum alan: ${cropInfo.min_area_m2} m2` });
      return;
    }

    // Check availability
    if (region.available_area_m2 < area_m2) {
      res.status(400).json({ message: `Yetersiz alan. Mevcut: ${region.available_area_m2} m2` });
      return;
    }

    // Calculate costs
    const rentCostMonthly = area_m2 * settings.pricing.rent_per_m2_monthly;
    const seedCost = area_m2 * cropInfo.seed_cost_per_m2;
    const totalInitialCost = rentCostMonthly + seedCost;

    // Check wallet balance
    const user = await User.findOne({ userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanici bulunamadi' });
      return;
    }

    if ((user.points || 0) < totalInitialCost) {
      res.status(400).json({ message: `Yetersiz bakiye. Gereken: ${totalInitialCost} TL, Mevcut: ${user.points || 0} TL` });
      return;
    }

    // Deduct from wallet
    await User.findOneAndUpdate({ userId }, { $inc: { points: -totalInitialCost } });

    // Calculate dates
    const now = new Date();
    const estimatedHarvest = new Date(now.getTime() + cropInfo.growth_days * 24 * 60 * 60 * 1000);
    const nextRentDue = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const plotId = generateId('plot');

    // Create plot
    const plot = await FarmPlot.create({
      plot_id: plotId,
      user_id: userId,
      region_id,
      area_m2,
      crop_type,
      crop_display_name: cropInfo.display_name,
      health_score: 100,
      water_level: 100,
      fertilizer_level: 100,
      fire_rate: 0,
      growth_stage: 'seed',
      growth_percent: 0,
      seed_date: now,
      estimated_harvest_date: estimatedHarvest,
      total_spent: totalInitialCost,
      rent_cost_monthly: rentCostMonthly,
      next_rent_due: nextRentDue,
      status: 'active',
    });

    // Update region availability
    const newRented = region.rented_area_m2 + area_m2;
    const newAvailable = region.total_area_m2 - newRented;
    const newPercent = (newAvailable / region.total_area_m2) * 100;

    await FarmRegion.findOneAndUpdate({ region_id }, {
      $set: {
        rented_area_m2: newRented,
        available_area_m2: newAvailable,
        available_percent: Math.max(0, newPercent),
        updated_at: now,
      },
    });

    // Create transactions
    const txBase = { user_id: userId, plot_id: plotId, payment_method: 'wallet' as const, status: 'completed' as const, created_at: now };

    await FarmTransaction.create([
      { ...txBase, transaction_id: generateId('tx'), type: 'rent', amount: rentCostMonthly, description: `Aylik kira - ${cropInfo.display_name}` },
      { ...txBase, transaction_id: generateId('tx'), type: 'seed', amount: seedCost, description: `Tohum - ${cropInfo.display_name}` },
    ]);

    // Award badge: ilk_tohum
    const existingBadge = await FarmBadge.findOne({ user_id: userId, badge_type: 'ilk_tohum' });
    if (!existingBadge) {
      await FarmBadge.create({
        user_id: userId,
        badge_type: 'ilk_tohum',
        badge_name: 'Ilk Tohum',
        badge_icon: '🌱',
        description: 'Ilk tarlani ektin!',
        earned_at: now,
      });
    }

    res.status(201).json({
      plot,
      costs: { rent: rentCostMonthly, seed: seedCost, total: totalInitialCost },
      estimated_harvest_date: estimatedHarvest,
    });
  } catch (error) {
    res.status(500).json({ message: 'Tarla kiralama hatasi', error });
  }
};

export const getMyPlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { status } = req.query;
    const filter: Record<string, any> = { user_id: userId };
    if (status && typeof status === 'string') {
      filter.status = status;
    }

    const plots = await FarmPlot.find(filter).sort({ created_at: -1 });
    res.json(plots);
  } catch (error) {
    res.status(500).json({ message: 'Tarlalar alinamadi', error });
  }
};

export const getPlotDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const plot = await FarmPlot.findOne({ plot_id: req.params.plotId });
    if (!plot) {
      res.status(404).json({ message: 'Tarla bulunamadi' });
      return;
    }

    // Only owner or imece members can see full detail
    let authorized = plot.user_id === userId;
    if (!authorized && plot.is_imece && plot.imece_group_id) {
      const group = await FarmImeceGroup.findOne({ group_id: plot.imece_group_id, 'members.user_id': userId, 'members.status': 'active' });
      authorized = !!group;
    }

    if (!authorized) {
      res.status(403).json({ message: 'Bu tarlaya erisim yetkiniz yok' });
      return;
    }

    const [diary, actions, region] = await Promise.all([
      FarmDiary.find({ $or: [{ plot_id: plot.plot_id }, { region_id: plot.region_id }] }).sort({ created_at: -1 }).limit(10),
      FarmAction.find({ plot_id: plot.plot_id }).sort({ created_at: -1 }).limit(20),
      FarmRegion.findOne({ region_id: plot.region_id }),
    ]);

    res.json({
      plot,
      diary,
      recent_actions: actions,
      region: region ? { region_name: region.region_name, city_name: region.city_name, district: region.district } : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Tarla detayi alinamadi', error });
  }
};

// ═══════════════════════════════════════════════════
// ACTIONS (Water / Fertilize / Protect)
// ═══════════════════════════════════════════════════

export const performAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { plot_id, action_type } = req.body;

    if (!plot_id || !action_type) {
      res.status(400).json({ message: 'plot_id ve action_type zorunlu' });
      return;
    }

    const config = ACTION_CONFIG[action_type];
    if (!config) {
      res.status(400).json({ message: 'Gecersiz aksiyon tipi. Gecerli: water, fertilize, protect_frost, protect_heat' });
      return;
    }

    const plot = await FarmPlot.findOne({ plot_id, status: 'active' });
    if (!plot) {
      res.status(404).json({ message: 'Aktif tarla bulunamadi' });
      return;
    }

    // Check authorization: owner or imece member
    let authorized = plot.user_id === userId;
    let imeceGroup = null;
    if (!authorized && plot.is_imece && plot.imece_group_id) {
      imeceGroup = await FarmImeceGroup.findOne({ group_id: plot.imece_group_id, 'members.user_id': userId, 'members.status': 'active', status: 'active' });
      authorized = !!imeceGroup;
    }

    if (!authorized) {
      res.status(403).json({ message: 'Bu tarlada islem yapma yetkiniz yok' });
      return;
    }

    const settings = await getSettings();
    const cost = (settings.pricing as any)[config.costField] as number;

    // Imece: split cost among active members
    if (imeceGroup) {
      const activeMembers = imeceGroup.members.filter(m => m.status === 'active');
      const splitCost = cost / activeMembers.length;

      // Check if the acting user has enough balance
      const actingUser = await User.findOne({ userId });
      if (!actingUser || (actingUser.points || 0) < splitCost) {
        res.status(400).json({ message: `Yetersiz bakiye. Payin: ${splitCost.toFixed(2)} TL` });
        return;
      }

      // Deduct from acting user
      await User.findOneAndUpdate({ userId }, { $inc: { points: -splitCost } });

      // Create split transaction
      const imeceSplit = activeMembers.map(m => ({
        user_id: m.user_id,
        amount: splitCost,
        paid: m.user_id === userId,
      }));

      await FarmTransaction.create({
        transaction_id: generateId('tx'),
        user_id: userId,
        plot_id,
        group_id: imeceGroup.group_id,
        type: config.txType,
        amount: cost,
        description: `${action_type} - Imece (${activeMembers.length} kisi)`,
        payment_method: 'wallet',
        status: 'completed',
        imece_split: imeceSplit,
      });

      // Update member total_paid
      await FarmImeceGroup.findOneAndUpdate(
        { group_id: imeceGroup.group_id, 'members.user_id': userId },
        { $inc: { 'members.$.total_paid': splitCost } },
      );
    } else {
      // Solo: check wallet and deduct
      const user = await User.findOne({ userId });
      if (!user || (user.points || 0) < cost) {
        res.status(400).json({ message: `Yetersiz bakiye. Gereken: ${cost} TL` });
        return;
      }

      await User.findOneAndUpdate({ userId }, { $inc: { points: -cost } });

      await FarmTransaction.create({
        transaction_id: generateId('tx'),
        user_id: userId,
        plot_id,
        type: config.txType,
        amount: cost,
        description: `${action_type} - ${plot.crop_display_name}`,
        payment_method: 'wallet',
        status: 'completed',
      });
    }

    // Update plot state
    const updates: Record<string, any> = { updated_at: new Date() };
    const impacts = config.impacts;

    if (impacts.water_impact) {
      updates.water_level = Math.min(100, plot.water_level + impacts.water_impact);
      updates.last_watered_at = new Date();
    }
    if (impacts.fertilizer_impact) {
      updates.fertilizer_level = Math.min(100, plot.fertilizer_level + impacts.fertilizer_impact);
      updates.last_fertilized_at = new Date();
    }
    if (impacts.health_impact) {
      updates.health_score = Math.min(100, plot.health_score + impacts.health_impact);
    }
    if (action_type === 'protect_frost' || action_type === 'protect_heat') {
      updates.last_protected_at = new Date();
      updates.fire_rate = Math.max(0, plot.fire_rate - 10);
    }

    updates.total_spent = plot.total_spent + cost;

    await FarmPlot.findOneAndUpdate({ plot_id }, { $set: updates });

    // Create action record
    const action = await FarmAction.create({
      plot_id,
      user_id: userId,
      action_type,
      cost,
      health_impact: impacts.health_impact || 0,
      water_impact: impacts.water_impact || 0,
      fertilizer_impact: impacts.fertilizer_impact || 0,
      auto_triggered: false,
    });

    res.json({
      action,
      cost,
      updated_levels: {
        health_score: updates.health_score ?? plot.health_score,
        water_level: updates.water_level ?? plot.water_level,
        fertilizer_level: updates.fertilizer_level ?? plot.fertilizer_level,
        fire_rate: updates.fire_rate ?? plot.fire_rate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Aksiyon hatasi', error });
  }
};

// ═══════════════════════════════════════════════════
// IMECE (Shared Farming)
// ═══════════════════════════════════════════════════

export const createImeceGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { plot_id, expense_split_type, max_members } = req.body;

    if (!plot_id) {
      res.status(400).json({ message: 'plot_id zorunlu' });
      return;
    }

    const plot = await FarmPlot.findOne({ plot_id, user_id: userId, status: 'active' });
    if (!plot) {
      res.status(404).json({ message: 'Aktif tarlaniz bulunamadi' });
      return;
    }

    if (plot.is_imece) {
      res.status(400).json({ message: 'Bu tarla zaten bir imece grubunda' });
      return;
    }

    const user = await User.findOne({ userId });
    const groupId = generateId('imece');
    const inviteCode = generateInviteCode();
    const maxMem = Math.min(max_members || 5, 5);

    const group = await FarmImeceGroup.create({
      group_id: groupId,
      plot_id,
      owner_id: userId,
      members: [{
        user_id: userId,
        name: user?.name || '',
        share_percent: 100,
        joined_at: new Date(),
        status: 'active',
        total_paid: plot.total_spent,
      }],
      invite_code: inviteCode,
      expense_split_type: expense_split_type || 'equal',
      max_members: maxMem,
      status: 'active',
    });

    // Update plot
    await FarmPlot.findOneAndUpdate({ plot_id }, { $set: { is_imece: true, imece_group_id: groupId, updated_at: new Date() } });

    // Award badge: imece_lideri
    const existingBadge = await FarmBadge.findOne({ user_id: userId, badge_type: 'imece_lideri' });
    if (!existingBadge) {
      await FarmBadge.create({
        user_id: userId,
        badge_type: 'imece_lideri',
        badge_name: 'Imece Lideri',
        badge_icon: '🤝',
        description: 'Ortak tarla olusturdun!',
      });
    }

    res.status(201).json({ group, invite_code: inviteCode });
  } catch (error) {
    res.status(500).json({ message: 'Imece grubu olusturma hatasi', error });
  }
};

export const joinImece = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { invite_code } = req.body;

    if (!invite_code || typeof invite_code !== 'string') {
      res.status(400).json({ message: 'invite_code zorunlu' });
      return;
    }

    const group = await FarmImeceGroup.findOne({ invite_code: invite_code.toUpperCase(), status: 'active' });
    if (!group) {
      res.status(404).json({ message: 'Gecersiz veya suresi dolmus davet kodu' });
      return;
    }

    const activeMembers = group.members.filter(m => m.status === 'active');

    if (activeMembers.length >= group.max_members) {
      res.status(400).json({ message: 'Grup dolu' });
      return;
    }

    const alreadyMember = group.members.find(m => m.user_id === userId && m.status === 'active');
    if (alreadyMember) {
      res.status(400).json({ message: 'Zaten bu gruptasiniz' });
      return;
    }

    const user = await User.findOne({ userId });
    if (!user) {
      res.status(404).json({ message: 'Kullanici bulunamadi' });
      return;
    }

    // Redistribute shares equally
    const newMemberCount = activeMembers.length + 1;
    const equalShare = Math.floor((100 / newMemberCount) * 100) / 100;
    const ownerShare = 100 - equalShare * (newMemberCount - 1);

    // Update existing members' shares
    for (const member of group.members) {
      if (member.status === 'active') {
        member.share_percent = member.user_id === group.owner_id ? ownerShare : equalShare;
      }
    }

    // Add new member
    group.members.push({
      user_id: userId,
      name: user.name,
      share_percent: equalShare,
      joined_at: new Date(),
      status: 'active',
      total_paid: 0,
    } as any);

    await group.save();

    res.json({ message: 'Gruba katildiniz', group });
  } catch (error) {
    res.status(500).json({ message: 'Gruba katilma hatasi', error });
  }
};

export const leaveImece = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { group_id } = req.body;

    if (!group_id) {
      res.status(400).json({ message: 'group_id zorunlu' });
      return;
    }

    const group = await FarmImeceGroup.findOne({ group_id, status: 'active' });
    if (!group) {
      res.status(404).json({ message: 'Grup bulunamadi' });
      return;
    }

    // Owner cannot leave (must dissolve)
    if (group.owner_id === userId) {
      res.status(400).json({ message: 'Grup sahibi ayrilamaz. Grubu feshetmeniz gerekiyor.' });
      return;
    }

    const member = group.members.find(m => m.user_id === userId && m.status === 'active');
    if (!member) {
      res.status(400).json({ message: 'Bu grupta aktif uyeliginiz yok' });
      return;
    }

    // Mark as left
    member.status = 'left';

    // Redistribute shares among remaining active members
    const remaining = group.members.filter(m => m.status === 'active');
    if (remaining.length > 0) {
      const equalShare = Math.floor((100 / remaining.length) * 100) / 100;
      const ownerShare = 100 - equalShare * (remaining.length - 1);
      for (const m of remaining) {
        m.share_percent = m.user_id === group.owner_id ? ownerShare : equalShare;
      }
    }

    await group.save();
    res.json({ message: 'Gruptan ayrildiniz' });
  } catch (error) {
    res.status(500).json({ message: 'Gruptan ayrilma hatasi', error });
  }
};

export const getImeceGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const group = await FarmImeceGroup.findOne({ group_id: req.params.groupId });
    if (!group) {
      res.status(404).json({ message: 'Grup bulunamadi' });
      return;
    }

    // Only members can view
    const isMember = group.members.some(m => m.user_id === userId);
    if (!isMember) {
      res.status(403).json({ message: 'Bu gruba erisim yetkiniz yok' });
      return;
    }

    const expenses = await FarmTransaction.find({ group_id: group.group_id }).sort({ created_at: -1 }).limit(50);
    const plot = await FarmPlot.findOne({ plot_id: group.plot_id });

    res.json({ group, expenses, plot });
  } catch (error) {
    res.status(500).json({ message: 'Grup bilgisi alinamadi', error });
  }
};

// ═══════════════════════════════════════════════════
// DIARY
// ═══════════════════════════════════════════════════

export const getDiary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plot_id, region_id } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const filter: Record<string, any> = {};
    if (plot_id && typeof plot_id === 'string') filter.plot_id = plot_id;
    if (region_id && typeof region_id === 'string') filter.region_id = region_id;

    if (!filter.plot_id && !filter.region_id) {
      res.status(400).json({ message: 'plot_id veya region_id zorunlu' });
      return;
    }

    const [entries, total] = await Promise.all([
      FarmDiary.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit),
      FarmDiary.countDocuments(filter),
    ]);

    res.json({ entries, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Gunluk alinamadi', error });
  }
};

export const uploadDiary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { region_id, plot_id, type, media_url, thumbnail_url, description, week_number, season_year } = req.body;

    if (!region_id || !type) {
      res.status(400).json({ message: 'region_id ve type zorunlu' });
      return;
    }

    const validTypes = ['photo', 'video', 'note'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ message: 'Gecersiz type. Gecerli: photo, video, note' });
      return;
    }

    const region = await FarmRegion.findOne({ region_id });
    if (!region) {
      res.status(404).json({ message: 'Bolge bulunamadi' });
      return;
    }

    const user = await User.findOne({ userId });
    const diaryId = generateId('diary');

    const entry = await FarmDiary.create({
      diary_id: diaryId,
      plot_id: plot_id || '',
      region_id,
      type,
      media_url: media_url || '',
      thumbnail_url: thumbnail_url || '',
      description: description || '',
      uploaded_by: userId,
      uploader_name: user?.name || 'Saha Ekibi',
      week_number: week_number || 0,
      season_year: season_year || '',
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Gunluk yukleme hatasi', error });
  }
};

// ═══════════════════════════════════════════════════
// SOCIAL
// ═══════════════════════════════════════════════════

export const visitPlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const visitorId = (req as any).userId;
    const { plot_id, rating, comment } = req.body;

    if (!plot_id || !rating) {
      res.status(400).json({ message: 'plot_id ve rating zorunlu' });
      return;
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      res.status(400).json({ message: 'rating 1-5 arasi tam sayi olmali' });
      return;
    }

    if (comment && typeof comment === 'string' && comment.length > 200) {
      res.status(400).json({ message: 'Yorum max 200 karakter' });
      return;
    }

    const plot = await FarmPlot.findOne({ plot_id });
    if (!plot) {
      res.status(404).json({ message: 'Tarla bulunamadi' });
      return;
    }

    if (plot.user_id === visitorId) {
      res.status(400).json({ message: 'Kendi tarlaniza yorum birakamazsiniz' });
      return;
    }

    // Upsert: one review per visitor per plot
    const social = await FarmSocial.findOneAndUpdate(
      { visitor_id: visitorId, plot_id },
      {
        $set: {
          rating,
          comment: comment || '',
          plot_owner_id: plot.user_id,
          created_at: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    // Check badge: sosyal_ciftci (10 reviews)
    const reviewCount = await FarmSocial.countDocuments({ visitor_id: visitorId });
    if (reviewCount >= 10) {
      const existing = await FarmBadge.findOne({ user_id: visitorId, badge_type: 'sosyal_ciftci' });
      if (!existing) {
        await FarmBadge.create({
          user_id: visitorId,
          badge_type: 'sosyal_ciftci',
          badge_name: 'Sosyal Ciftci',
          badge_icon: '💬',
          description: '10 tarlaya yorum biraktin!',
        });
      }
    }

    res.json(social);
  } catch (error) {
    res.status(500).json({ message: 'Ziyaret hatasi', error });
  }
};

export const getPlotSocial = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const plotId = req.params.plotId;

    const [reviews, total, avgResult] = await Promise.all([
      FarmSocial.find({ plot_id: plotId }).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit),
      FarmSocial.countDocuments({ plot_id: plotId }),
      FarmSocial.aggregate([
        { $match: { plot_id: plotId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const stats = avgResult[0] || { avg: 0, count: 0 };

    res.json({
      reviews,
      total,
      page,
      limit,
      average_rating: Math.round((stats.avg || 0) * 10) / 10,
      total_reviews: stats.count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Sosyal veriler alinamadi', error });
  }
};

// ═══════════════════════════════════════════════════
// HARVEST
// ═══════════════════════════════════════════════════

export const getHarvests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const harvests = await FarmHarvest.find({ user_id: userId }).sort({ created_at: -1 });
    res.json(harvests);
  } catch (error) {
    res.status(500).json({ message: 'Hasat gecmisi alinamadi', error });
  }
};

export const setShippingAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { harvest_id, full_name, phone, address_line, city, district, postal_code } = req.body;

    if (!harvest_id) {
      res.status(400).json({ message: 'harvest_id zorunlu' });
      return;
    }

    if (!full_name || !phone || !address_line || !city) {
      res.status(400).json({ message: 'full_name, phone, address_line ve city zorunlu' });
      return;
    }

    const harvest = await FarmHarvest.findOne({ harvest_id, user_id: userId });
    if (!harvest) {
      res.status(404).json({ message: 'Hasat bulunamadi' });
      return;
    }

    if (harvest.shipping_status !== 'pending') {
      res.status(400).json({ message: 'Adres sadece bekleyen hasatlar icin guncellenebilir' });
      return;
    }

    const updated = await FarmHarvest.findOneAndUpdate(
      { harvest_id, user_id: userId },
      {
        $set: {
          shipping_address: {
            full_name,
            phone,
            address_line,
            city,
            district: district || '',
            postal_code: postal_code || '',
          },
        },
      },
      { new: true },
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Adres guncelleme hatasi', error });
  }
};

// ═══════════════════════════════════════════════════
// BADGES & WAITLIST
// ═══════════════════════════════════════════════════

export const getMyBadges = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const badges = await FarmBadge.find({ user_id: userId }).sort({ earned_at: -1 });
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: 'Rozetler alinamadi', error });
  }
};

export const joinWaitlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { region_id, requested_area_m2, crop_type, notify_email, notify_push } = req.body;

    if (!region_id || !requested_area_m2) {
      res.status(400).json({ message: 'region_id ve requested_area_m2 zorunlu' });
      return;
    }

    if (typeof requested_area_m2 !== 'number' || requested_area_m2 <= 0) {
      res.status(400).json({ message: 'requested_area_m2 pozitif sayi olmali' });
      return;
    }

    const region = await FarmRegion.findOne({ region_id });
    if (!region) {
      res.status(404).json({ message: 'Bolge bulunamadi' });
      return;
    }

    // Check if already on waitlist
    const existing = await FarmWaitlist.findOne({ user_id: userId, region_id, status: 'waiting' });
    if (existing) {
      res.status(400).json({ message: 'Bu bolge icin zaten bekleme listesindesiniz' });
      return;
    }

    const entry = await FarmWaitlist.create({
      user_id: userId,
      region_id,
      requested_area_m2,
      crop_type: crop_type || '',
      notify_email: notify_email !== false,
      notify_push: notify_push !== false,
      status: 'waiting',
    });

    // Increment waitlist count on region
    await FarmRegion.findOneAndUpdate({ region_id }, { $inc: { waitlist_count: 1 } });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Bekleme listesi hatasi', error });
  }
};

// ═══════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════

export const adminUpdateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const allowedFields = [
      'enabled', 'beta_mode', 'whitelist_user_ids',
      'active_cities', 'fomo_thresholds', 'pricing', 'crop_catalog',
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: 'Guncellenecek alan yok' });
      return;
    }

    updates.updated_at = new Date();
    updates.updated_by = userId;

    const settings = await FarmSettings.findOneAndUpdate(
      { key: 'digital_farm' },
      { $set: updates },
      { new: true, upsert: true },
    );

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Ayar guncelleme hatasi', error });
  }
};

export const adminGetDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalRegions,
      activeRegions,
      totalPlots,
      activePlots,
      regionStats,
      revenueResult,
      activeUsers,
      waitlistTotal,
    ] = await Promise.all([
      FarmRegion.countDocuments(),
      FarmRegion.countDocuments({ is_active: true }),
      FarmPlot.countDocuments(),
      FarmPlot.countDocuments({ status: 'active' }),
      FarmRegion.aggregate([
        { $group: { _id: null, total_area: { $sum: '$total_area_m2' }, rented_area: { $sum: '$rented_area_m2' } } },
      ]),
      FarmTransaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total_revenue: { $sum: '$amount' } } },
      ]),
      FarmPlot.distinct('user_id', { status: 'active' }),
      FarmWaitlist.countDocuments({ status: 'waiting' }),
    ]);

    const areaStats = regionStats[0] || { total_area: 0, rented_area: 0 };
    const revenue = revenueResult[0] || { total_revenue: 0 };

    // Revenue by type
    const revenueByType = await FarmTransaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Recent transactions
    const recentTransactions = await FarmTransaction.find({ status: 'completed' }).sort({ created_at: -1 }).limit(10);

    res.json({
      regions: { total: totalRegions, active: activeRegions },
      plots: { total: totalPlots, active: activePlots },
      area: {
        total_m2: areaStats.total_area,
        rented_m2: areaStats.rented_area,
        available_m2: areaStats.total_area - areaStats.rented_area,
        utilization_percent: areaStats.total_area > 0
          ? Math.round((areaStats.rented_area / areaStats.total_area) * 100 * 10) / 10
          : 0,
      },
      revenue: {
        total: revenue.total_revenue,
        by_type: revenueByType,
      },
      users: {
        active_farmers: activeUsers.length,
        waitlist: waitlistTotal,
      },
      recent_transactions: recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Dashboard hatasi', error });
  }
};
