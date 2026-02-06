import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/replace-content/index', {
    title: 'Replace content',
  });
});

router.get('/response', (request, response) => {
  response.render('requests/replace-content/response', {
    title: 'Replace response',
  });
});

export default router;
