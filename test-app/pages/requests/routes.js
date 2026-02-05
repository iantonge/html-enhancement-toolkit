import { Router } from 'express';
import formRoutes from './forms/routes.js';
import headersRoutes from './headers/routes.js';
import historyRoutes from './history/routes.js';
import linkRoutes from './links/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/index', { title: 'Requests' });
});

router.use('/forms', formRoutes);
router.use('/headers', headersRoutes);
router.use('/history', historyRoutes);
router.use('/links', linkRoutes);

export default router;
