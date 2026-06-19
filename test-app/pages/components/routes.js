import { Router } from 'express';

import acquisitionRoutes from './acquisition/routes.js';
import lifecycleRoutes from './lifecycle/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/index', {
    title: 'Components',
  });
});

router.use('/acquisition', acquisitionRoutes);
router.use('/lifecycle', lifecycleRoutes);

export default router;
