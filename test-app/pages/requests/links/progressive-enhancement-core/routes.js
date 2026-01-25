import { Router } from 'express';

import duplicatePaneRoutes from './duplicate-pane-form/routes.js';
import duplicateTargetResponseRoutes from './duplicate-target-response/routes.js';
import externalRoutes from './external/routes.js';
import internalRoutes from './internal/routes.js';
import internalSpanRoutes from './internal-span/routes.js';
import missingPaneRoutes from './missing-pane/routes.js';
import missingTargetResponseRoutes from './missing-target-response/routes.js';
import noTargetRoutes from './no-target/routes.js';
import responsesRoutes from './responses/routes.js';
import targetAttrRoutes from './target-attr/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

router.use(duplicatePaneRoutes);
router.use(duplicateTargetResponseRoutes);
router.use(externalRoutes);
router.use(internalRoutes);
router.use(internalSpanRoutes);
router.use(missingPaneRoutes);
router.use(missingTargetResponseRoutes);
router.use(noTargetRoutes);
router.use(responsesRoutes);
router.use(targetAttrRoutes);

export default router;
