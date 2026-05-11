CREATE DATABASE IF NOT EXISTS library_rbac;
USE library_rbac;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_books_title_author (title, author),
  INDEX idx_books_title (title),
  INDEX idx_books_category (category)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  borrow_date DATE NOT NULL,
  return_date DATE NULL,
  status ENUM('borrowed', 'returned') NOT NULL DEFAULT 'borrowed',
  fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_users FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_transactions_books FOREIGN KEY (book_id) REFERENCES books(id),
  INDEX idx_transactions_status (status)
);

CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(150) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_logs_user_id (user_id),
  INDEX idx_logs_action (action),
  INDEX idx_logs_created_at (created_at)
);

INSERT INTO roles (id, role_name) VALUES
  (1, 'Admin'),
  (2, 'Moderator'),
  (3, 'User')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Password for all demo users is: password123
INSERT INTO users (username, password, role_id) VALUES
  ('admin', '$2b$10$pzUQ98DjuNF7vVQf8OLPpuHHc1gND1F88b4hGl1TMY3aQcTuTPjhu', 1),
  ('wahid', '$2b$10$EPfLwv9VWSv6S7V8N1.7A.m9E8M6hLp5.pE8M6hLp5.pE8M6hLp5', 1),
  ('librarian', '$2b$10$pzUQ98DjuNF7vVQf8OLPpuHHc1gND1F88b4hGl1TMY3aQcTuTPjhu', 2),
  ('member', '$2b$10$pzUQ98DjuNF7vVQf8OLPpuHHc1gND1F88b4hGl1TMY3aQcTuTPjhu', 3)
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT INTO books (title, author, stock, category) VALUES
  ('Clean Code', 'Robert C. Martin', 5, 'Software Engineering'),
  ('The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 3, 'Software Engineering'),
  ('Atomic Habits', 'James Clear', 2, 'Self Improvement')
ON DUPLICATE KEY UPDATE title = VALUES(title);
