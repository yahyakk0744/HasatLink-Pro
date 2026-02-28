import { Request, Response } from 'express';
import { fetchRealHalPrices, fetchAllHalPrices, fetchWeeklyPrices } from '../services/halPriceService';

export const getMarketPrices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const prices = await fetchRealHalPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: 'Hal fiyatları alınamadı', error });
  }
};

export const getAllMarketPrices = async (_req: Request, res: Response): Promise<void> => {
  try {
    const prices = await fetchAllHalPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: 'Tüm hal fiyatları alınamadı', error });
  }
};

export const getWeeklyPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = req.query.product as string | undefined;
    const weekly = await fetchWeeklyPrices(product);
    res.json(weekly);
  } catch (error) {
    res.status(500).json({ message: 'Haftalık fiyatlar alınamadı', error });
  }
};
