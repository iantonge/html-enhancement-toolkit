import { Router } from 'express';

import getRoutes from './get/routes.js';
import relativeActionRoutes from './relative-action-form/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/progressive-enhancement/forms/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

router.use(getRoutes);
router.use(relativeActionRoutes);
router.use(responsesRoutes);

export default router;
