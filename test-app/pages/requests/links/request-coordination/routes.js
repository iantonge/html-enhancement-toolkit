import { Router } from 'express';

import abortPreviousRoutes from './abort-previous/routes.js';
import childFromParentRoutes from './child-from-parent/routes.js';
import parentFromChildRoutes from './parent-from-child/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/links/request-coordination/index', {
    title: 'Link Request Coordination',
  });
});

router.use(abortPreviousRoutes);
router.use(childFromParentRoutes);
router.use(parentFromChildRoutes);
router.use(responsesRoutes);

export default router;
