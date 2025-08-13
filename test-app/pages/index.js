import express from 'express'

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Index' });
});

export default router;
