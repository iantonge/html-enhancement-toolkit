import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-model/index', {
    title: 'het-model',
  });
});

router.get('/text-input', (request, response) => {
  response.render('components/het-model/text-input', {
    title: 'Text input',
  });
});

export default router;
