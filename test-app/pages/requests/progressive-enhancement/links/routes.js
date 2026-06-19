import { Router } from 'express';

import internalRoutes from './internal/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/progressive-enhancement/links/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

router.use(internalRoutes);
router.use(responsesRoutes);

export default router;
