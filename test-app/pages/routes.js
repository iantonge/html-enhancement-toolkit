import { Router } from 'express';
import componentsRoutes from './components/routes.js';
import integrationRoutes from './integration/routes.js';
import requestRoutes from './requests/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('index', { title: 'HTML Enhancement Toolkit' });
});

router.use('/requests', requestRoutes);
router.use('/components', componentsRoutes);
router.use('/integration', integrationRoutes);

export default router;
