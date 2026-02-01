import { Router } from 'express';

import insideResponseRoutes from './inside-response/routes.js';
import insideTargetRoutes from './inside-target/routes.js';
import missingCurrentRoutes from './missing-current/routes.js';
import missingResponseRoutes from './missing-response/routes.js';
import multiRoutes from './multi/routes.js';
import partialRoutes from './partial/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/forms/het-also/index', {
    title: 'Form het-also',
  });
});

router.use(insideResponseRoutes);
router.use(insideTargetRoutes);
router.use(missingCurrentRoutes);
router.use(missingResponseRoutes);
router.use(multiRoutes);
router.use(partialRoutes);
router.use(responsesRoutes);

export default router;
