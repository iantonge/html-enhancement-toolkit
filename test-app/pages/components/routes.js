import { Router } from 'express';

import acquisitionRoutes from './acquisition/routes.js';
import hetAttrsRoutes from './het-attrs/routes.js';
import hetBoolAttrsRoutes from './het-bool-attrs/routes.js';
import hetImportsRoutes from './het-imports/routes.js';
import hetModelRoutes from './het-model/routes.js';
import hetOnRoutes from './het-on/routes.js';
import hetPropsRoutes from './het-props/routes.js';
import lifecycleRoutes from './lifecycle/routes.js';
import negationRoutes from './negation/routes.js';
import registrationRoutes from './registration/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/index', {
    title: 'Components',
  });
});

router.use('/acquisition', acquisitionRoutes);
router.use('/het-attrs', hetAttrsRoutes);
router.use('/het-bool-attrs', hetBoolAttrsRoutes);
router.use('/het-imports', hetImportsRoutes);
router.use('/het-model', hetModelRoutes);
router.use('/het-on', hetOnRoutes);
router.use('/het-props', hetPropsRoutes);
router.use('/lifecycle', lifecycleRoutes);
router.use('/negation', negationRoutes);
router.use('/registration', registrationRoutes);

export default router;
