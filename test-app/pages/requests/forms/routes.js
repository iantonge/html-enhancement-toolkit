import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  if (request.query['default-action']) {
    response.render('requests/forms/default-action', {
      title: 'Form Interception',
      message: `Default action submitted: ${request.query['default-action']}`,
    });
    return;
  }

  response.render('requests/forms/index', {
    title: 'Form Interception',
  });
});

router.get('/get-form', (request, response) => {
  const someField = request.query['some-field'] ?? '';
  const additional = request.query['additional-value'];
  const suffix = additional ? ` - ${additional}` : '';
  response.render('requests/forms/get-form', {
    title: 'Form Interception',
    message: `GET form submitted: ${someField}${suffix}`,
  });
});

router.get('/another-get-form', (request, response) => {
  const someField = request.query['some-field'] ?? '';
  response.render('requests/forms/another-get-form', {
    title: 'Form Interception',
    message: `Another GET form submitted: ${someField}`,
  });
});

router.get('/default-form', (request, response) => {
  const someField = request.query['some-field'] ?? '';
  response.render('requests/forms/default-form', {
    title: 'Form Interception',
    message: `Default form submitted: ${someField}`,
  });
});

router.get('/child-target', (request, response) => {
  response.render('requests/forms/child-target', {
    title: 'Form Interception',
    message: 'Child pane updated.',
  });
});

router.get('/no-target', (request, response) => {
  response.render('requests/forms/no-target', {
    title: 'Form Interception',
  });
});

router.get('/duplicate-target', (request, response) => {
  response.render('requests/forms/duplicate-target', {
    title: 'Form Interception',
  });
});

router.get('/duplicate-pane', (request, response) => {
  response.render('requests/forms/duplicate-pane', {
    title: 'Form Interception',
  });
});

router.post('/post-form', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  const additional = request.body['additional-value'];
  const suffix = additional ? ` - ${additional}` : '';
  response.render('requests/forms/post-form', {
    title: 'Form Interception',
    message: `POST form submitted: ${someField}${suffix}`,
  });
});

router.post('/enctype-multipart', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  const contentType = request.get('content-type') ?? '';
  response.render('requests/forms/post-form', {
    title: 'Form Interception',
    message: `Multipart form submitted: ${someField} (${contentType})`,
  });
});

router.post('/enctype-override', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  const contentType = request.get('content-type') ?? '';
  response.render('requests/forms/post-form', {
    title: 'Form Interception',
    message: `Override form submitted: ${someField} (${contentType})`,
  });
});

router.post('/enctype-submitter-multipart', (request, response) => {
  const someField = request.body['some-field'] ?? '';
  const contentType = request.get('content-type') ?? '';
  response.render('requests/forms/post-form', {
    title: 'Form Interception',
    message: `Submitter enctype submitted: ${someField} (${contentType})`,
  });
});

export default router;
