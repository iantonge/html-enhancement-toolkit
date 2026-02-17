import { Router } from 'express';

import basicRoutes from './basic/routes.js';
import responsesRoutes from './responses/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/forms/nav-panes/index', {
    title: 'Form Nav Panes',
  });
});

router.use(basicRoutes);
router.use(responsesRoutes);

export default router;
