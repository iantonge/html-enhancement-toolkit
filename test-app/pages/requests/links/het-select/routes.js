import { Router } from 'express';

import missingCurrentRoutes from './missing-current/routes.js';
import missingResponseRoutes from './missing-response/routes.js';
import multiRoutes from './multi/routes.js';
import partialRoutes from './partial/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/links/het-select/index', {
    title: 'Link het-select',
  });
});

router.use(missingCurrentRoutes);
router.use(missingResponseRoutes);
router.use(multiRoutes);
router.use(partialRoutes);
router.use(responsesRoutes);

export default router;
