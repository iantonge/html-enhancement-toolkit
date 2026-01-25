import { Router } from 'express';

const router = Router();

router.get('/get-form', (request, response) => {
  const someField = request.query['some-field'] ?? '';
  const additional = request.query['additional-value'];
  const suffix = additional ? ` - ${additional}` : '';
  response.render('requests/forms/progressive-enhancement-core/responses/get-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `GET form submitted: ${someField}${suffix}`,
  });
});

router.get('/another-get-form', (request, response) => {
  const someField = request.query['some-field'] ?? '';
  response.render('requests/forms/progressive-enhancement-core/responses/another-get-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `Another GET form submitted: ${someField}`,
  });
});

router.get('/default-form', (request, response) => {
  const someField = request.query['some-field'] ?? '';
  response.render('requests/forms/progressive-enhancement-core/responses/default-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `Default form submitted: ${someField}`,
  });
});

router.get('/default-action', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/responses/default-action', {
    title: 'Form Progressive Enhancement (Core)',
    message: `Default action submitted: ${request.query['default-action']}`,
  });
});

router.get('/no-target', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/responses/no-target', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

router.get('/duplicate-target', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/responses/duplicate-target', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

router.post('/post-form', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  const additional = request.body['additional-value'];
  const suffix = additional ? ` - ${additional}` : '';
  response.render('requests/forms/progressive-enhancement-core/responses/post-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `POST form submitted: ${someField}${suffix}`,
  });
});

router.post('/enctype-multipart', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  const contentType = request.get('content-type') ?? '';
  response.render('requests/forms/progressive-enhancement-core/responses/post-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `Multipart form submitted: ${someField} (${contentType})`,
  });
});

router.post('/enctype-override', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  const contentType = request.get('content-type') ?? '';
  response.render('requests/forms/progressive-enhancement-core/responses/post-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `Override form submitted: ${someField} (${contentType})`,
  });
});

router.post('/enctype-submitter-multipart', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  const contentType = request.get('content-type') ?? '';
  response.render('requests/forms/progressive-enhancement-core/responses/post-form', {
    title: 'Form Progressive Enhancement (Core)',
    message: `Submitter enctype submitted: ${someField} (${contentType})`,
  });
});

router.get('/child-target', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/responses/child-target', {
    title: 'Form Progressive Enhancement (Core)',
    message: 'Child pane updated.',
  });
});

export default router;
