import { Router } from 'express';

const router = Router();

router.get('/no-target-form', (request, response) => {
  response.render('requests/progressive-enhancement/forms/no-target-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
