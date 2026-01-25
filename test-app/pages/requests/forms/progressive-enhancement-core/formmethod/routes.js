import { Router } from 'express';

const router = Router();

router.get('/formmethod', (request, response) => {
  response.render('requests/forms/progressive-enhancement-core/formmethod/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
