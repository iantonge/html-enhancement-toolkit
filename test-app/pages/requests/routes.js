import { Router } from 'express';
import headersRoutes from './headers/routes.js';
import hetAlsoRoutes from './het-also/routes.js';
import hetSelectRoutes from './het-select/routes.js';
import historyRoutes from './history/routes.js';
import lifecycleEventsRoutes from './lifecycle-events/routes.js';
import navPanesRoutes from './nav-panes/routes.js';
import progressiveEnhancementRoutes from './progressive-enhancement/routes.js';
import requestCoordinationRoutes from './request-coordination/routes.js';
import uiFeedbackRoutes from './ui-feedback/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/index', { title: 'Requests' });
});

router.use('/headers', headersRoutes);
router.use('/het-also', hetAlsoRoutes);
router.use('/het-select', hetSelectRoutes);
router.use('/history', historyRoutes);
router.use('/lifecycle-events', lifecycleEventsRoutes);
router.use('/nav-panes', navPanesRoutes);
router.use('/progressive-enhancement', progressiveEnhancementRoutes);
router.use('/request-coordination', requestCoordinationRoutes);
router.use('/ui-feedback', uiFeedbackRoutes);

export default router;
