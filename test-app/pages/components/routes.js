import { Router } from 'express';

import acquisitionRoutes from './acquisition/routes.js';
import hetImportsRoutes from './het-imports/routes.js';
import hetModelRoutes from './het-model/routes.js';
import hetOnRoutes from './het-on/routes.js';
import lifecycleRoutes from './lifecycle/routes.js';
import registrationRoutes from './registration/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/index', {
    title: 'Components',
  });
});

router.use('/acquisition', acquisitionRoutes);
router.use('/het-imports', hetImportsRoutes);
router.use('/het-model', hetModelRoutes);
router.use('/het-on', hetOnRoutes);
router.use('/lifecycle', lifecycleRoutes);
router.use('/registration', registrationRoutes);

export default router;
