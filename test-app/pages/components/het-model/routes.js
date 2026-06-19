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

router.get('/checkbox', (request, response) => {
  response.render('components/het-model/checkbox', {
    title: 'Checkbox',
  });
});

router.get('/radio', (request, response) => {
  response.render('components/het-model/radio', {
    title: 'Radio',
  });
});

export default router;
