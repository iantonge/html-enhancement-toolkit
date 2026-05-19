import { Router } from 'express';

const router = Router();

router.get('/external', (request, response) => {
  response.render('requests/progressive-enhancement/links/external/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
