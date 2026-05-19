import { Router } from 'express';

const router = Router();

router.get('/internal-span', (request, response) => {
  response.render('requests/progressive-enhancement/links/internal-span/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
