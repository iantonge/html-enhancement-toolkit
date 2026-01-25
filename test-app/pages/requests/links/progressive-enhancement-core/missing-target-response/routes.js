import { Router } from 'express';

const router = Router();

router.get('/missing-target-response', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/missing-target-response/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
