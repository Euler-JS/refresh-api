const express = require('express');
const { getSubscriptions, addSubscription } = require('../controllers/subscriptionController');
const auth = require('../middlewares/auth');
const router = express.Router();

router.get('/', auth, getSubscriptions);
router.post('/', auth, addSubscription);

module.exports = router;