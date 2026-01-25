import { Router } from 'express';

const router = Router();

router.get('/default-action-form', (request, response) => {
  if (request.query['default-action']) {
    response.render('requests/forms/progressive-enhancement-core/responses/default-action', {
      title: 'Form Progressive Enhancement (Core)',
      message: `Default action submitted: ${request.query['default-action']}`,
    });
    return;
  }

  response.render('requests/forms/progressive-enhancement-core/default-action-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
