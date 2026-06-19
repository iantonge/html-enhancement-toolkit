import { Router } from 'express';

const router = Router();

router.get('/submitter-enctype-form', (request, response) => {
  response.render('requests/progressive-enhancement/forms/submitter-enctype-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
