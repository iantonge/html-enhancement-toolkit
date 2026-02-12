import { Router } from 'express';

import baseFlowRoutes from './base-flow/routes.js';
import hetOnRoutes from './het-on/routes.js';
import hetPropsRoutes from './het-props/routes.js';
import scopedRefsRoutes from './scoped-refs/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/index', {
    title: 'Components',
  });
});

router.use('/base-flow', baseFlowRoutes);
router.use('/het-on', hetOnRoutes);
router.use('/het-props', hetPropsRoutes);
router.use('/scoped-refs', scopedRefsRoutes);

export default router;
