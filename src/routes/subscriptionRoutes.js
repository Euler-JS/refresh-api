const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, subscriptionController.getSubscription);
router.post('/', auth, subscriptionController.createSubscription);
router.patch('/:subscriptionId/renew', auth, subscriptionController.renewSubscription);

module.exports = router;