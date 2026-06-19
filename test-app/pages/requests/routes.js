import { Router } from 'express';
import progressiveEnhancementRoutes from './progressive-enhancement/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/index', { title: 'Requests' });
});

router.use('/progressive-enhancement', progressiveEnhancementRoutes);

export default router;
