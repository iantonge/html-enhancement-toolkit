import { Router } from 'express';

const router = Router();

router.get('/get-form', (request, response) => {
  const someField = request.query['some-field'] ?? '';
  response.render('requests/progressive-enhancement/forms/responses/get-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `GET form submitted: ${someField}`,
  });
});

router.get('/default-form', (request, response) => {
  const someField = request.query['some-field'] ?? '';
  response.render('requests/progressive-enhancement/forms/responses/default-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `Default form submitted: ${someField}`,
  });
});

router.get('/default-action', (request, response) => {
  response.render('requests/progressive-enhancement/forms/responses/default-action', {
    title: 'Form Progressive Enhancement (Core)',
    message: `Default action submitted: ${request.query['default-action']}`,
  });
});

router.get('/no-target', (request, response) => {
  response.render('requests/progressive-enhancement/forms/responses/no-target', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

router.get('/duplicate-target', (request, response) => {
  response.render('requests/progressive-enhancement/forms/responses/duplicate-target', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

router.post('/post-form', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  response.render('requests/progressive-enhancement/forms/responses/post-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `POST form submitted: ${someField}`,
  });
});

export default router;
