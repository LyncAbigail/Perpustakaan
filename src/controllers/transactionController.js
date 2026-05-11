const db = require('../config/db');
const { ROLES } = require('../constants/roles');
const { logActivity } = require('../helpers/auditLogger');

const DAILY_FINE = 1.0;
const LOAN_DAYS = 14;

function calculateFine(borrowDate, returnDate = new Date()) {
  const borrowedAt = new Date(borrowDate);
  const dueAt = new Date(borrowedAt);
  dueAt.setDate(dueAt.getDate() + LOAN_DAYS);

  if (returnDate <= dueAt) return 0;

  const overdueMs = returnDate - dueAt;
  const overdueDays = Math.ceil(overdueMs / (1000 * 60 * 60 * 24));
  return overdueDays * DAILY_FINE;
}

exports.index = async (req, res, next) => {
  try {
    const user = req.session.user;
    const values = [];
    let whereClause = '';

    // RBAC check in the controller: regular members can only see their own
    // borrowing records, while Admin and Moderator can review all transactions.
    if (user.role_id === ROLES.USER) {
      whereClause = 'WHERE t.user_id = ?';
      values.push(user.id);
    }

    const [transactions] = await db.query(
      `SELECT t.*, u.username, b.title
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       JOIN books b ON b.id = t.book_id
       ${whereClause}
       ORDER BY t.created_at DESC`,
      values
    );

    return res.render('transactions/index', { transactions });
  } catch (error) {
    return next(error);
  }
};

exports.logs = async (req, res, next) => {
  try {
    // RBAC check in the controller: Moderators are limited to operational
    // transaction logs, while Admins can use the global audit page.
    const transactionActions = [
      'Borrowing book',
      'Marking book as returned',
      'Updating fines'
    ];
    const [logs] = await db.query(
      `SELECT l.*, u.username
       FROM logs l
       LEFT JOIN users u ON u.id = l.user_id
       WHERE l.action IN (?, ?, ?)
       ORDER BY l.created_at DESC
       LIMIT 100`,
      transactionActions
    );

    return res.render('transactions/logs', { logs });
  } catch (error) {
    return next(error);
  }
};

exports.borrow = async (req, res, next) => {
  const connection = await db.getConnection();

  try {
    const user = req.session.user;
    const requestedUserId = Number(req.body.user_id || user.id);
    const bookId = Number(req.body.book_id);

    // RBAC check in the controller: members may borrow only for themselves.
    // Moderators/Admins may create a borrowing transaction for any member.
    if (user.role_id === ROLES.USER && requestedUserId !== user.id) {
      req.flash('error', 'You can only borrow books for your own account.');
      return res.redirect('/books');
    }

    await connection.beginTransaction();

    const [[book]] = await connection.query('SELECT * FROM books WHERE id = ? FOR UPDATE', [bookId]);
    if (!book || book.stock <= 0) {
      await connection.rollback();
      req.flash('error', 'This book is not available right now.');
      return res.redirect('/books');
    }

    await connection.query('UPDATE books SET stock = stock - 1 WHERE id = ?', [bookId]);
    await connection.query(
      `INSERT INTO transactions (user_id, book_id, borrow_date, status, fine_amount)
       VALUES (?, ?, CURRENT_DATE, 'borrowed', 0)`,
      [requestedUserId, bookId]
    );
    await logActivity(user, 'Borrowing book', `${book.title} for user id ${requestedUserId}`, connection);

    await connection.commit();
    req.flash('success', 'Book borrowed.');
    return res.redirect('/transactions');
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
};

exports.returnBook = async (req, res, next) => {
  const connection = await db.getConnection();

  try {
    const user = req.session.user;

    // RBAC check in the controller: only library staff roles can complete
    // returns because this changes stock, return status, and fine records.
    if (user.role_id !== ROLES.MODERATOR && user.role_id !== ROLES.ADMIN) {
      req.flash('error', 'Only library staff can process returns.');
      return res.redirect('/transactions');
    }

    await connection.beginTransaction();

    const [[transaction]] = await connection.query(
      `SELECT t.*, b.title
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       WHERE t.id = ? FOR UPDATE`,
      [req.params.id]
    );

    if (!transaction || transaction.status === 'returned') {
      await connection.rollback();
      req.flash('error', 'Transaction is not available for return.');
      return res.redirect('/transactions');
    }

    const fineAmount = calculateFine(transaction.borrow_date);

    await connection.query(
      `UPDATE transactions
       SET return_date = CURRENT_DATE, status = 'returned', fine_amount = ?
       WHERE id = ?`,
      [fineAmount, transaction.id]
    );
    await connection.query('UPDATE books SET stock = stock + 1 WHERE id = ?', [transaction.book_id]);
    await logActivity(
      user,
      'Marking book as returned',
      `transaction id ${transaction.id}, book ${transaction.title}, fine ${fineAmount.toFixed(2)}`,
      connection
    );

    if (fineAmount > 0) {
      await logActivity(
        user,
        'Updating fines',
        `transaction id ${transaction.id}, user id ${transaction.user_id}, amount ${fineAmount.toFixed(2)}`,
        connection
      );
    }

    await connection.commit();
    req.flash('success', `Book returned. Fine: $${fineAmount.toFixed(2)}.`);
    return res.redirect('/transactions');
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
};

module.exports.calculateFine = calculateFine;
