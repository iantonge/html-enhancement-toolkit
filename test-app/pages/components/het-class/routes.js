import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/het-class/index', {
    title: 'het-class',
  });
});

export default router;
