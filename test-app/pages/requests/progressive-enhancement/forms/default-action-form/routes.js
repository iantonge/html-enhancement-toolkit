import { Router } from 'express';

const router = Router();

router.get('/default-action-form', (request, response) => {
  if (request.query['default-action']) {
    response.render('requests/progressive-enhancement/forms/responses/default-action', {
      title: 'Form Progressive Enhancement (Core)',
      message: `Default action submitted: ${request.query['default-action']}`,
    });
    return;
  }

  response.render('requests/progressive-enhancement/forms/default-action-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
