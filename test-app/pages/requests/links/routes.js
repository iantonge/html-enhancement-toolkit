import { Router } from 'express';

import debounceClicksRoutes from './debounce-clicks/routes.js';
import hetSelectRoutes from './het-select/routes.js';
import requestCoordinationRoutes from './request-coordination/routes.js';
import progressiveEnhancementCoreRoutes from './progressive-enhancement-core/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/links/index', {
    title: 'Links',
  });
});

router.use('/debounce-clicks', debounceClicksRoutes);
router.use('/het-select', hetSelectRoutes);
router.use('/request-coordination', requestCoordinationRoutes);
router.use('/progressive-enhancement-core', progressiveEnhancementCoreRoutes);

export default router;
