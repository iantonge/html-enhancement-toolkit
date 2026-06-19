import { Router } from 'express';

const router = Router();

router.get('/', (request, response) => {
  response.render('components/mutation-observer/index', {
    title: 'Mutation observer',
  });
});

router.get('/mount-added', (request, response) => {
  response.render('components/mutation-observer/mount-added', {
    title: 'Mount added components',
  });
});

router.get('/unmount-removed', (request, response) => {
  response.render('components/mutation-observer/unmount-removed', {
    title: 'Unmount removed components',
  });
});

router.get('/depth-order', (request, response) => {
  response.render('components/mutation-observer/depth-order', {
    title: 'Depth ordering',
  });
});

export default router;
