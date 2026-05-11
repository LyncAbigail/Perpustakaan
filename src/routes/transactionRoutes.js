const express = require('express');
const transactionController = require('../controllers/transactionController');
const { requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', transactionController.index);
router.get('/logs', requireRoles(ROLES.ADMIN, ROLES.MODERATOR), transactionController.logs);
router.post('/borrow', transactionController.borrow);
router.post('/:id/return', requireRoles(ROLES.ADMIN, ROLES.MODERATOR), transactionController.returnBook);

module.exports = router;
