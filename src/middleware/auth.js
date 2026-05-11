const { ROLE_NAMES } = require('../constants/roles');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please sign in first.');
    return res.redirect('/login');
  }

  return next();
}

function requireRoles(...allowedRoleIds) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error', 'Please sign in first.');
      return res.redirect('/login');
    }

    const currentRoleId = req.session.user.role_id;
    if (!allowedRoleIds.includes(currentRoleId)) {
      req.flash('error', 'You do not have permission to access that page.');
      return res.status(403).render('errors/403', {
        user: req.session.user,
        allowedRoles: allowedRoleIds.map((id) => ROLE_NAMES[id]).join(', ')
      });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRoles };
