const db = require('../config/db');
const { ROLES } = require('../constants/roles');

exports.show = async (req, res, next) => {
  try {
    const user = req.session.user;

    // RBAC check in the controller: profile/fine details are member-owned
    // data, so regular users only receive rows tied to their own account.
    if (user.role_id !== ROLES.USER) {
      req.flash('error', 'Profiles are only available for member accounts.');
      return res.redirect('/dashboard');
    }

    const [fines] = await db.query(
      `SELECT t.*, b.title
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       WHERE t.user_id = ? AND t.fine_amount > 0
       ORDER BY t.return_date DESC`,
      [user.id]
    );

    const [[totals]] = await db.query(
      'SELECT COALESCE(SUM(fine_amount), 0) AS total_fines FROM transactions WHERE user_id = ?',
      [user.id]
    );

    return res.render('profile/show', { fines, totalFines: totals.total_fines });
  } catch (error) {
    return next(error);
  }
};
