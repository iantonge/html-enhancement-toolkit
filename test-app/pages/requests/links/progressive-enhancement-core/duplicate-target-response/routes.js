import { Router } from 'express';

const router = Router();

router.get('/duplicate-target-response', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/duplicate-target-response/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
