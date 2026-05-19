import { Router } from 'express';

const router = Router();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.get('/', (request, response) => {
  response.render('requests/ui-feedback/links/index', {
    title: 'UI feedback links',
  });
});

router.get('/custom-class', (request, response) => {
  response.render('requests/ui-feedback/links/custom-class', {
    title: 'UI feedback custom class',
  });
});

router.get('/responses/slow', async (request, response) => {
  await delay(500);
  response.render('requests/ui-feedback/links/responses/slow', {
    title: 'Slow response',
  });
});

router.get('/responses/slow-2', async (request, response) => {
  await delay(500);
  response.render('requests/ui-feedback/links/responses/slow-2', {
    title: 'Second response',
  });
});

export default router;
