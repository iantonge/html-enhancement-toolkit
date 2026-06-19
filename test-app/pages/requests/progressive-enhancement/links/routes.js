import { Router } from 'express';

import duplicatePaneRoutes from './duplicate-pane-form/routes.js';
import duplicateTargetResponseRoutes from './duplicate-target-response/routes.js';
import internalRoutes from './internal/routes.js';
import internalSpanRoutes from './internal-span/routes.js';
import missingTargetResponseRoutes from './missing-target-response/routes.js';
import noTargetRoutes from './no-target/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/progressive-enhancement/links/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

router.use(duplicatePaneRoutes);
router.use(duplicateTargetResponseRoutes);
router.use(internalRoutes);
router.use(internalSpanRoutes);
router.use(missingTargetResponseRoutes);
router.use(noTargetRoutes);
router.use(responsesRoutes);

export default router;
