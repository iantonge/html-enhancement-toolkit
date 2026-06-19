import { Router } from 'express';

const router = Router();

router.get('/get-form', (request, response) => {
  response.render('requests/progressive-enhancement/forms/responses/get-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: 'GET form submitted',
  });
});

router.get('/no-target', (request, response) => {
  response.render('requests/progressive-enhancement/forms/responses/no-target', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
