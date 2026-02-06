import { Router } from 'express';
import formRoutes from './forms/routes.js';
import headersRoutes from './headers/routes.js';
import historyRoutes from './history/routes.js';
import lifecycleEventsRoutes from './lifecycle-events/routes.js';
import linkRoutes from './links/routes.js';
import replaceContentRoutes from './replace-content/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/index', { title: 'Requests' });
});

router.use('/forms', formRoutes);
router.use('/headers', headersRoutes);
router.use('/history', historyRoutes);
router.use('/lifecycle-events', lifecycleEventsRoutes);
router.use('/links', linkRoutes);
router.use('/replace-content', replaceContentRoutes);

export default router;
