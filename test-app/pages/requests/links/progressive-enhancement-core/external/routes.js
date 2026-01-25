import { Router } from 'express';

const router = Router();

router.get('/external', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/external/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
