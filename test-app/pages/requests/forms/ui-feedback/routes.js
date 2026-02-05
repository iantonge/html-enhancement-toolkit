import { Router } from 'express';

const router = Router();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.get('/', (request, response) => {
  response.render('requests/forms/ui-feedback/index', {
    title: 'UI feedback forms',
  });
});

router.get('/responses/slow', async (request, response) => {
  await delay(500);
  response.render('requests/forms/ui-feedback/responses/slow', {
    title: 'Form slow response',
  });
});

export default router;
