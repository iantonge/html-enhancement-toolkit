import { Router } from 'express';

const router = Router();

router.get('/internal', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/internal/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
