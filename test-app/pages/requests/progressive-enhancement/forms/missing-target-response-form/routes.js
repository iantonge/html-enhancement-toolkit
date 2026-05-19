import { Router } from 'express';

const router = Router();

router.get('/missing-target-response-form', (request, response) => {
  response.render('requests/progressive-enhancement/forms/missing-target-response-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
