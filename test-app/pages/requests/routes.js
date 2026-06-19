import { Router } from 'express';
import hetAlsoRoutes from './het-also/routes.js';
import lifecycleEventsRoutes from './lifecycle-events/routes.js';
import progressiveEnhancementRoutes from './progressive-enhancement/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/index', { title: 'Requests' });
});

router.use('/het-also', hetAlsoRoutes);
router.use('/lifecycle-events', lifecycleEventsRoutes);
router.use('/progressive-enhancement', progressiveEnhancementRoutes);

export default router;
