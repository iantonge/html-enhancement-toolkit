import { Router } from 'express';

const router = Router();

router.get('/responses/link', (request, response) => {
  response.render('requests/history/responses/link', {
    title: 'Link response',
  });
});

router.get('/responses/form', (request, response) => {
  response.render('requests/history/responses/form', {
    title: 'Form response',
  });
});

export default router;
