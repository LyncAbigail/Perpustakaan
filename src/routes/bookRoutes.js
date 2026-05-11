const express = require('express');
const bookController = require('../controllers/bookController');
const { requireRoles } = require('../middleware/auth');
const { ROLES } = require('../constants/roles');

const router = express.Router();

router.get('/', bookController.index);
router.get('/new', requireRoles(ROLES.ADMIN, ROLES.MODERATOR), bookController.new);
router.post('/', requireRoles(ROLES.ADMIN, ROLES.MODERATOR), bookController.create);
router.get('/:id/edit', requireRoles(ROLES.ADMIN, ROLES.MODERATOR), bookController.edit);
router.put('/:id', requireRoles(ROLES.ADMIN, ROLES.MODERATOR), bookController.update);
router.delete('/:id', requireRoles(ROLES.ADMIN), bookController.destroy);

module.exports = router;
