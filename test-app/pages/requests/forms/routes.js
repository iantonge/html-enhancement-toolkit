import { Router } from 'express';

import disableRoutes from './disables-in-flight/routes.js';
import hetAlsoRoutes from './het-also/routes.js';
import hetSelectRoutes from './het-select/routes.js';
import navPanesRoutes from './nav-panes/routes.js';
import progressiveEnhancementCoreRoutes from './progressive-enhancement-core/routes.js';
import requestCoordinationRoutes from './request-coordination/routes.js';
import uiFeedbackRoutes from './ui-feedback/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/forms/index', {
    title: 'Form Requests',
  });
});

router.use('/progressive-enhancement-core', progressiveEnhancementCoreRoutes);
router.use('/het-also', hetAlsoRoutes);
router.use('/het-select', hetSelectRoutes);
router.use('/nav-panes', navPanesRoutes);
router.use('/ui-feedback', uiFeedbackRoutes);
router.use('/request-coordination', requestCoordinationRoutes);
router.use('/disables-in-flight', disableRoutes);

export default router;
