import { Router } from 'express';

const router = Router();

router.get('/missing-pane', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/missing-pane/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
