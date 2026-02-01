import { Router } from 'express';

import formRoutes from './form/routes.js';
import linkRoutes from './link/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/history/index', {
    title: 'History navigation',
  });
});

router.use(formRoutes);
router.use(linkRoutes);
router.use(responsesRoutes);

export default router;
