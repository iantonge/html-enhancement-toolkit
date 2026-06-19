import { Router } from 'express';

const router = Router();

router.get('/submitter-target-form', (request, response) => {
  response.render('requests/progressive-enhancement/forms/submitter-target-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
