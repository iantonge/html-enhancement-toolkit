import { Router } from 'express';

import baseFlowRoutes from './base-flow/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/index', {
    title: 'Components',
  });
});

router.use('/base-flow', baseFlowRoutes);

export default router;
