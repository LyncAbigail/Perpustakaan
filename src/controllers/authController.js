const bcrypt = require('bcrypt');
const db = require('../config/db');
const { ROLE_NAMES } = require('../constants/roles');
const { logActivity } = require('../helpers/auditLogger');

exports.showLogin = (req, res) => {
  res.render('auth/login');
};

exports.login = async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role_name: ROLE_NAMES[user.role_id]
    };

    await logActivity(req.session.user, 'Login', `session for ${user.username}`);
    req.flash('success', `Welcome, ${user.username}.`);
    return res.redirect('/dashboard');
  } catch (error) {
    return next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (user) {
      await logActivity(user, 'Logout', `session for ${user.username}`);
    }

    req.session.destroy((error) => {
      if (error) return next(error);
      return res.redirect('/login');
    });
  } catch (error) {
    return next(error);
  }
};
