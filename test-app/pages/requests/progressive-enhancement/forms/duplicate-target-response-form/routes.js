import { Router } from 'express';

const router = Router();

router.get('/duplicate-target-response-form', (request, response) => {
  response.render('requests/progressive-enhancement/forms/duplicate-target-response-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
