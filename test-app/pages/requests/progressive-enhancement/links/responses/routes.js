import { Router } from 'express';

const router = Router();

router.get('/responses/internal-link', (request, response) => {
  response.render('requests/progressive-enhancement/links/responses/internal-link', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
