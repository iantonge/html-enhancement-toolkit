import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/debounce-clicks/index', {
    title: 'Link Debounce Clicks',
  });
});

router.get('/responses/internal-link', (request, response) => {
  response.render('requests/debounce-clicks/responses/internal-link', {
    title: 'Link Debounce Clicks',
  });
});

export default router;
