import { Router } from 'express';

const router = Router();

router.get('/responses/link', (request, response) => {
  response.render('requests/history/responses/link', {
    title: 'Link response',
    description: 'Response link history description',
  });
});

router.get('/responses/form', (request, response) => {
  response.render('requests/history/responses/form', {
    title: 'Form response',
    description: 'Response form history description',
  });
});

router.get('/responses/select-also', (request, response) => {
  response.render('requests/history/responses/select-also', {
    title: 'Select also response',
    description: 'Response select also history description',
  });
});

export default router;
