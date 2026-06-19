import { Router } from 'express';

const router = Router();

router.get('/formmethod', (request, response) => {
  response.render('requests/progressive-enhancement/forms/formmethod/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
