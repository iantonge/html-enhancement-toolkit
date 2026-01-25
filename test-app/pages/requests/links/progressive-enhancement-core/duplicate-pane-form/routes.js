import { Router } from 'express';

const router = Router();

router.get('/duplicate-pane-form', (request, response) => {
  response.render('requests/links/progressive-enhancement-core/duplicate-pane-form/index', {
    title: 'Link Progressive Enhancement (Core)',
  });
});

export default router;
