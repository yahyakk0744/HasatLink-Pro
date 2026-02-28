import { Router } from 'express';
import { getWeather, checkWeatherAlerts } from '../controllers/weatherController';
import auth from '../middleware/auth';

const router = Router();

router.get('/weather', getWeather);
router.get('/weather/alerts', auth, checkWeatherAlerts);

export default router;
