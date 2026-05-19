import { Router } from 'express';

const router = Router();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.get('/', (request, response) => {
  response.render('requests/ui-feedback/forms/index', {
    title: 'UI feedback forms',
  });
});

router.get('/responses/slow', async (request, response) => {
  await delay(500);
  response.render('requests/ui-feedback/forms/responses/slow', {
    title: 'Form slow response',
  });
});

export default router;
