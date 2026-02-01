import { Router } from 'express';

import debounceClicksRoutes from './debounce-clicks/routes.js';
import autofocusRoutes from './autofocus/routes.js';
import hetAlsoRoutes from './het-also/routes.js';
import hetSelectRoutes from './het-select/routes.js';
import navPanesRoutes from './nav-panes/routes.js';
import requestCoordinationRoutes from './request-coordination/routes.js';
import progressiveEnhancementCoreRoutes from './progressive-enhancement-core/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/links/index', {
    title: 'Links',
  });
});

router.use('/debounce-clicks', debounceClicksRoutes);
router.use('/autofocus', autofocusRoutes);
router.use('/het-also', hetAlsoRoutes);
router.use('/het-select', hetSelectRoutes);
router.use('/nav-panes', navPanesRoutes);
router.use('/request-coordination', requestCoordinationRoutes);
router.use('/progressive-enhancement-core', progressiveEnhancementCoreRoutes);

export default router;
