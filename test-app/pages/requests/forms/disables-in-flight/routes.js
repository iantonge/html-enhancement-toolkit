import { Router } from 'express';

import externalControlsRoutes from './external-controls/routes.js';
import formControlsRoutes from './form-controls/routes.js';
import preDisabledRoutes from './pre-disabled/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/forms/disables-in-flight/index', {
    title: 'Form Disable',
  });
});

router.get('/child-target', (request, response) => {
  response.render('requests/forms/disables-in-flight/child-target', {
    title: 'Form Disable',
    message: 'Child pane updated.',
  });
});

router.use(externalControlsRoutes);
router.use(formControlsRoutes);
router.use(preDisabledRoutes);

export default router;
