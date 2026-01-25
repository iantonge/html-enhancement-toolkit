import { Router } from 'express';

const router = Router();

router.get('/default-method-form', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/default-method-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
