import { Router } from 'express';

import lifecycleRoutes from './lifecycle/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/index', {
    title: 'Components',
  });
});

router.use('/lifecycle', lifecycleRoutes);

export default router;
