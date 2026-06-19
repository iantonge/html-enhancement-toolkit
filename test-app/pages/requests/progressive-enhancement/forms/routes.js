import { Router } from 'express';

import getRoutes from './get/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/progressive-enhancement/forms/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

router.use(getRoutes);
router.use(responsesRoutes);

export default router;
