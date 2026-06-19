import { Router } from 'express';

import linkRoutes from './links/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/progressive-enhancement/index', {
    title: 'Progressive enhancement',
  });
});

router.use('/links', linkRoutes);

export default router;
