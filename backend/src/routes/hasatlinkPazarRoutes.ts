import { Router } from 'express';
import {
  getHasatlinkPazarPrices,
  getHasatlinkWeeklyPrices,
  getHasatlinkHourlyPrices,
} from '../controllers/hasatlinkPazarController';

const router = Router();

router.get('/hasatlink-pazar', getHasatlinkPazarPrices);
router.get('/hasatlink-pazar/weekly', getHasatlinkWeeklyPrices);
router.get('/hasatlink-pazar/hourly', getHasatlinkHourlyPrices);

export default router;
