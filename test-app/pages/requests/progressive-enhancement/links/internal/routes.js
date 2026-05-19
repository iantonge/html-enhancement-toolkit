import { Router } from 'express';

const router = Router();

router.get('/internal', (request, response) => {
  response.render('requests/progressive-enhancement/links/internal/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
