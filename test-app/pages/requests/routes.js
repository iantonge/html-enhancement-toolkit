import { Router } from 'express';
import linkRoutes from './links/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/index', { title: 'Requests' });
});

router.use('/links', linkRoutes);

export default router;
