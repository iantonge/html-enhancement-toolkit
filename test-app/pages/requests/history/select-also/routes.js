import { Router } from 'express';

const router = Router();

router.get('/select-also', (request, response) => {
  response.render('requests/history/select-also/index', {
    title: 'Select also history',
    description: 'Initial select also history description',
  });
});

export default router;
