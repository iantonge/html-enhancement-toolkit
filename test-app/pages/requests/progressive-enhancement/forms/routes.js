import { Router } from 'express';

import additionalRoutes from './additional/routes.js';
import defaultActionRoutes from './default-action-form/routes.js';
import defaultMethodRoutes from './default-method-form/routes.js';
import duplicatePaneRoutes from './duplicate-pane-form/routes.js';
import duplicateTargetResponseRoutes from './duplicate-target-response-form/routes.js';
import externalRoutes from './external-form/routes.js';
import formactionRoutes from './formaction/routes.js';
import formmethodRoutes from './formmethod/routes.js';
import getRoutes from './get/routes.js';
import missingTargetResponseRoutes from './missing-target-response-form/routes.js';
import noTargetRoutes from './no-target-form/routes.js';
import postRoutes from './post/routes.js';
import relativeActionRoutes from './relative-action-form/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/progressive-enhancement/forms/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

router.use(additionalRoutes);
router.use(defaultActionRoutes);
router.use(defaultMethodRoutes);
router.use(duplicatePaneRoutes);
router.use(duplicateTargetResponseRoutes);
router.use(externalRoutes);
router.use(formactionRoutes);
router.use(formmethodRoutes);
router.use(getRoutes);
router.use(missingTargetResponseRoutes);
router.use(noTargetRoutes);
router.use(postRoutes);
router.use(relativeActionRoutes);
router.use(responsesRoutes);

export default router;
