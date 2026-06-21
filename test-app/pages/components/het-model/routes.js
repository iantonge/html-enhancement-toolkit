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

router.get('/typed-int', (request, response) => {
  response.render('components/het-model/typed-int', {
    title: 'Typed int',
  });
});

router.get('/checkbox', (request, response) => {
  response.render('components/het-model/checkbox', {
    title: 'Checkbox',
  });
});

router.get('/checkbox-array', (request, response) => {
  response.render('components/het-model/checkbox-array', {
    title: 'Checkbox array',
  });
});

router.get('/radio-group', (request, response) => {
  response.render('components/het-model/radio-group', {
    title: 'Radio group',
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

router.get('/invalid-property-expression', (request, response) => {
  response.render('components/het-model/invalid-property-expression', {
    title: 'Invalid property expression',
  });
});

router.get('/invalid-negation', (request, response) => {
  response.render('components/het-model/invalid-negation', {
    title: 'Invalid negation',
  });
});

export default router;
