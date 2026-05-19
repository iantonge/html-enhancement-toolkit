import { Router } from 'express';

const router = Router();

router.get('/duplicate-pane-form', (request, response) => {
  response.render('requests/progressive-enhancement/forms/duplicate-pane-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
