const path = require('path');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
require('dotenv').config();

const { requireAuth } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const bookRoutes = require('./routes/bookRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { formatDateTimeWIB, formatDateWIB } = require('./helpers/time');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' }
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.formatDateTimeWIB = formatDateTimeWIB;
  res.locals.formatDateWIB = formatDateWIB;
  next();
});

app.use('/', authRoutes);
app.use('/dashboard', requireAuth, dashboardRoutes);
app.use('/books', requireAuth, bookRoutes);
app.use('/transactions', requireAuth, transactionRoutes);
app.use('/admin', requireAuth, adminRoutes);
app.use('/profile', requireAuth, profileRoutes);

app.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send('Something went wrong.');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Library Management System running on http://localhost:${port}`);
});
