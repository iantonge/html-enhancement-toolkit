import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-attrs/index', {
    title: 'het-attrs directives',
  });
});

router.get('/attrs', (request, response) => {
  response.render('components/het-attrs/attrs', {
    title: 'het-attrs',
  });
});

router.get('/bool-attrs', (request, response) => {
  response.render('components/het-attrs/bool-attrs', {
    title: 'het-bool-attrs',
  });
});

router.get('/class', (request, response) => {
  response.render('components/het-attrs/class', {
    title: 'het-class',
  });
});

router.get('/negation', (request, response) => {
  response.render('components/het-attrs/negation', {
    title: 'Negation',
  });
});

export default router;
