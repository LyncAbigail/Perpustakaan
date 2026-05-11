const db = require('../config/db');
const { formatDateTimeWIB } = require('./time');

function formatAuditMessage(username, action, details, timestamp = new Date()) {
  return `${username || 'System'} performed ${action} on ${details || 'N/A'} at ${formatDateTimeWIB(timestamp)}`;
}

async function logActivity(user, action, details, connection = db) {
  const userId = user && user.id ? user.id : null;
  const username = user && user.username ? user.username : 'System';
  const message = formatAuditMessage(username, action, details);

  await connection.query(
    'INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)',
    [userId, action, message]
  );

  return message;
}

module.exports = { logActivity, formatAuditMessage };
