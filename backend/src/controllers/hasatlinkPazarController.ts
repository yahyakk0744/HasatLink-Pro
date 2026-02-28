import { Request, Response } from 'express';
import {
  fetchHasatlinkPazarPrices,
  fetchHasatlinkWeeklyPrices,
  fetchHasatlinkHourlyPrices,
} from '../services/hasatlinkPazarService';

export const getHasatlinkPazarPrices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const prices = await fetchHasatlinkPazarPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: 'HasatLink pazar fiyatları alınamadı', error });
  }
};

export const getHasatlinkWeeklyPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = req.query.product as string | undefined;
    const weekly = await fetchHasatlinkWeeklyPrices(product);
    res.json(weekly);
  } catch (error) {
    res.status(500).json({ message: 'Haftalık fiyatlar alınamadı', error });
  }
};

export const getHasatlinkHourlyPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = req.query.product as string | undefined;
    const hourly = await fetchHasatlinkHourlyPrices(product);
    res.json(hourly);
  } catch (error) {
    res.status(500).json({ message: 'Saatlik fiyatlar alınamadı', error });
  }
};
