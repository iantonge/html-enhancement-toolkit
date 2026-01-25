import { Router } from 'express';

const router = Router();

router.get('/responses/internal-link', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/responses/internal-link', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

router.get('/responses/no-target', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/responses/no-target', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

router.get('/responses/duplicate-target', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/responses/duplicate-target', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
