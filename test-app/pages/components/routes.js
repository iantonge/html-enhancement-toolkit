import { Router } from 'express';

import acquisitionRoutes from './acquisition/routes.js';
import baseFlowRoutes from './base-flow/routes.js';
import hetAttrsRoutes from './het-attrs/routes.js';
import hetModelRoutes from './het-model/routes.js';
import hetOnRoutes from './het-on/routes.js';
import hetPropsRoutes from './het-props/routes.js';
import mutationObserverRoutes from './mutation-observer/routes.js';
import scopedRefsRoutes from './scoped-refs/routes.js';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/index', {
    title: 'Components',
  });
});

router.use('/acquisition', acquisitionRoutes);
router.use('/base-flow', baseFlowRoutes);
router.use('/het-attrs', hetAttrsRoutes);
router.use('/het-model', hetModelRoutes);
router.use('/het-on', hetOnRoutes);
router.use('/het-props', hetPropsRoutes);
router.use('/mutation-observer', mutationObserverRoutes);
router.use('/scoped-refs', scopedRefsRoutes);

export default router;
