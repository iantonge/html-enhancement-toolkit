import { Router } from 'express';

import formRoutes from './forms/routes.js';
import linkRoutes from './links/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/request-coordination/index', {
    title: 'Request coordination',
  });
});

router.use('/forms', formRoutes);
router.use('/links', linkRoutes);

export default router;
