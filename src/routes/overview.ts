import express from 'express';
import sessionVerify from '../middleware/sessionVerify';
import tokenVerify from '../middleware/tokenVerify';
import { OverviewController } from 'src/controllers/OverviewController';

const router = express.Router();

router.use(tokenVerify, sessionVerify);

router.get('/', OverviewController.overview);

export default router;
