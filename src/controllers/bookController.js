const db = require('../config/db');
const { ROLES } = require('../constants/roles');
const { logActivity } = require('../helpers/auditLogger');

exports.index = async (req, res, next) => {
  try {
    const { q = '', category = '' } = req.query;
    const filters = [];
    const values = [];

    if (q) {
      filters.push('(title LIKE ? OR author LIKE ?)');
      values.push(`%${q}%`, `%${q}%`);
      await logActivity(req.session.user, 'Searching for books', `query "${q}"`);
    }

    if (category) {
      filters.push('category = ?');
      values.push(category);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const [books] = await db.query(`SELECT * FROM books ${whereClause} ORDER BY title ASC`, values);
    const [categories] = await db.query('SELECT DISTINCT category FROM books ORDER BY category ASC');

    return res.render('books/index', {
      books,
      categories,
      filters: { q, category },
      canManageBooks: req.session.user.role_id === ROLES.MODERATOR || req.session.user.role_id === ROLES.ADMIN
    });
  } catch (error) {
    return next(error);
  }
};

exports.new = (req, res) => {
  res.render('books/form', { book: null });
};

exports.create = async (req, res, next) => {
  try {
    const { title, author, stock, category } = req.body;
    await db.query('INSERT INTO books (title, author, stock, category) VALUES (?, ?, ?, ?)', [
      title,
      author,
      Number(stock),
      category
    ]);
    await logActivity(req.session.user, 'Adding book', `${title} by ${author}`);
    req.flash('success', 'Book added.');
    return res.redirect('/books');
  } catch (error) {
    return next(error);
  }
};

exports.edit = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).send('Book not found');
    return res.render('books/form', { book: rows[0] });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { title, author, stock, category } = req.body;
    await db.query('UPDATE books SET title = ?, author = ?, stock = ?, category = ? WHERE id = ?', [
      title,
      author,
      Number(stock),
      category,
      req.params.id
    ]);
    await logActivity(req.session.user, 'Editing book', `book id ${req.params.id}: ${title}`);
    req.flash('success', 'Book updated.');
    return res.redirect('/books');
  } catch (error) {
    return next(error);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    await db.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    await logActivity(req.session.user, 'Deleting data', `book id ${req.params.id}`);
    req.flash('success', 'Book deleted.');
    return res.redirect('/books');
  } catch (error) {
    return next(error);
  }
};
