const bcrypt = require('bcrypt');
const db = require('../config/db');
const { logActivity } = require('../helpers/auditLogger');

exports.users = async (req, res, next) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.role_id, r.role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ORDER BY u.username ASC`
    );
    const [roles] = await db.query('SELECT * FROM roles ORDER BY id ASC');
    return res.render('admin/users', { users, roles });
  } catch (error) {
    return next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { username, password, role_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)', [
      username,
      hashedPassword,
      Number(role_id)
    ]);
    await logActivity(req.session.user, 'Creating user', `${username} with role id ${role_id}`);
    req.flash('success', 'User created.');
    return res.redirect('/admin/users');
  } catch (error) {
    return next(error);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const { role_id } = req.body;
    await db.query('UPDATE users SET role_id = ? WHERE id = ?', [Number(role_id), req.params.id]);
    await logActivity(req.session.user, 'Changing user roles', `user id ${req.params.id} to role id ${role_id}`);
    req.flash('success', 'User role updated.');
    return res.redirect('/admin/users');
  } catch (error) {
    return next(error);
  }
};

exports.logs = async (req, res, next) => {
  try {
    const [logs] = await db.query(
      `SELECT l.*, u.username
       FROM logs l
       LEFT JOIN users u ON u.id = l.user_id
       ORDER BY l.created_at DESC
       LIMIT 200`
    );
    return res.render('admin/logs', { logs });
  } catch (error) {
    return next(error);
  }
};

exports.settings = async (req, res, next) => {
  try {
    await logActivity(req.session.user, 'System configuration changes', 'opened system settings');
    return res.render('admin/settings');
  } catch (error) {
    return next(error);
  }
};
