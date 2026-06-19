import { Router } from 'express';
import integrationRoutes from './integration/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('index', { title: 'HTML Enhancement Toolkit' });
});

router.use('/integration', integrationRoutes);

export default router;
