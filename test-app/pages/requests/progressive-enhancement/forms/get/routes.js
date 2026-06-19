import { Router } from 'express';

const router = Router();

router.get('/get', (request, response) => {
  response.render('requests/progressive-enhancement/forms/get/index', {
    title: 'Form Progressive Enhancement (Core)',
  });
});

export default router;
