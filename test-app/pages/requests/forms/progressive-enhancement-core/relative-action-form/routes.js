import { Router } from 'express';

const router = Router();

router.get('/relative-action-form', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/relative-action-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
