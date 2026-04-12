import { Router } from 'express';
import auth from '../middleware/auth';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
} from '../controllers/jobListingController';

const router = Router();

router.get('/jobs', getJobs);
router.get('/jobs/my', auth, getMyJobs);
router.get('/jobs/:id', getJob);
router.post('/jobs', auth, createJob);
router.put('/jobs/:id', auth, updateJob);
router.delete('/jobs/:id', auth, deleteJob);

export default router;
