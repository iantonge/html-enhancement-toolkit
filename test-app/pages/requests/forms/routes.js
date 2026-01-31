import { Router } from 'express';

import disableRoutes from './disables-in-flight/routes.js';
import progressiveEnhancementCoreRoutes from './progressive-enhancement-core/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/forms/index', {
    title: 'Form Requests',
  });
});

router.use('/progressive-enhancement-core', progressiveEnhancementCoreRoutes);
router.use('/disables-in-flight', disableRoutes);

export default router;
