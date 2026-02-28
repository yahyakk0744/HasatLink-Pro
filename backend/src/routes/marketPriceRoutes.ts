import { Router } from 'express';
import {
  getMarketPrices,
  getAllMarketPrices,
  getWeeklyPrices,
} from '../controllers/marketPriceController';

const router = Router();

router.get('/market-prices', getMarketPrices);
router.get('/market-prices/all', getAllMarketPrices);
router.get('/market-prices/weekly', getWeeklyPrices);

export default router;
