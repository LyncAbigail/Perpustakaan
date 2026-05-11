const db = require('../config/db');
const { ROLES } = require('../constants/roles');

exports.index = async (req, res, next) => {
  try {
    const user = req.session.user;
    const data = {};

    if (user.role_id === ROLES.ADMIN) {
      const [[usersCount]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
      const [[logsCount]] = await db.query('SELECT COUNT(*) AS total_logs FROM logs');
      const [recentLogs] = await db.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 10');
      data.totalUsers = usersCount.total_users;
      data.totalLogs = logsCount.total_logs;
      data.recentLogs = recentLogs;
    }

    if (user.role_id === ROLES.MODERATOR) {
      const [[pendingReturns]] = await db.query(
        "SELECT COUNT(*) AS pending_returns FROM transactions WHERE status = 'borrowed'"
      );
      const [lowStockBooks] = await db.query('SELECT * FROM books WHERE stock <= 2 ORDER BY stock ASC');
      data.pendingReturns = pendingReturns.pending_returns;
      data.lowStockBooks = lowStockBooks;
    }

    if (user.role_id === ROLES.USER) {
      const [borrowedBooks] = await db.query(
        `SELECT t.*, b.title, b.author
         FROM transactions t
         JOIN books b ON b.id = t.book_id
         WHERE t.user_id = ? AND t.status = 'borrowed'
         ORDER BY t.borrow_date DESC`,
        [user.id]
      );
      data.borrowedBooks = borrowedBooks;
    }

    return res.render('dashboard/index', { data });
  } catch (error) {
    return next(error);
  }
};
