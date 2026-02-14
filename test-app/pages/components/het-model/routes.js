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

router.get('/invalid-expression-empty', (request, response) => {
  response.render('components/het-model/invalid-expression-empty', {
    title: 'Invalid expression: empty',
  });
});

router.get('/invalid-expression-extra-equals', (request, response) => {
  response.render('components/het-model/invalid-expression-extra-equals', {
    title: 'Invalid expression: extra equals',
  });
});

export default router;
