import { Router } from 'express';

const router = Router();

router.get('/external-form', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/external-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
