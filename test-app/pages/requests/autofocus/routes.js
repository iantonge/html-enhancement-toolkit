import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('requests/autofocus/index', {
    title: 'Autofocus links',
  });
});

router.get('/responses/basic', (request, response) => {
  response.render('requests/autofocus/responses/basic', {
    title: 'Autofocus response',
  });
});

router.get('/responses/target', (request, response) => {
  response.render('requests/autofocus/responses/target', {
    title: 'Autofocus target response',
  });
});

export default router;
