import { Router } from 'express';

const router = Router();

router.get('/internal-span', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/internal-span/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
