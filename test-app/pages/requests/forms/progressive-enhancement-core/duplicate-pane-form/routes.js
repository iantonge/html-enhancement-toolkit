import { Router } from 'express';

const router = Router();

router.get('/duplicate-pane-form', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/duplicate-pane-form/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
