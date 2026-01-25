import { Router } from 'express';
import requestRoutes from './requests/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('index', { title: 'HTML Enhancement Toolkit' });
});

router.use('/requests', requestRoutes);

export default router;
