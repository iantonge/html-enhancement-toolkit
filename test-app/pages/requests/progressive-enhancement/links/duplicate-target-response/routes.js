import { Router } from 'express';

const router = Router();

router.get('/duplicate-target-response', (request, response) => {
  response.render('requests/progressive-enhancement/links/duplicate-target-response/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
