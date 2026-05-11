const express = require('express');
const adminController = require('../controllers/adminController');
const { requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.use(requireRoles(ROLES.ADMIN));
router.get('/users', adminController.users);
router.post('/users', adminController.createUser);
router.post('/users/:id/role', adminController.updateRole);
router.get('/logs', adminController.logs);
router.get('/settings', adminController.settings);

module.exports = router;
