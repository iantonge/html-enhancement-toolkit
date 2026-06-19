import { Router } from 'express';

import formControlsRoutes from './form-controls/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/disables-in-flight/index', {
    title: 'Form Disable',
  });
});

router.get('/child-target', (request, response) => {
  response.render('requests/disables-in-flight/child-target', {
    title: 'Form Disable',
    message: 'Child pane updated.',
  });
});

router.use(formControlsRoutes);

export default router;
