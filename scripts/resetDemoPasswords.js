const bcrypt = require('bcrypt');
const db = require('../src/config/db');

const DEMO_PASSWORD = 'password123';
const DEMO_USERS = ['admin', 'librarian', 'member', 'wahid'];

async function resetDemoPasswords() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [result] = await db.query(
    `UPDATE users
     SET password = ?
     WHERE username IN (?, ?, ?, ?)`,
    [hashedPassword, ...DEMO_USERS]
  );

  console.log(`Updated ${result.affectedRows} demo account(s).`);
  console.log(`Demo password is now: ${DEMO_PASSWORD}`);
  await db.end();
}

resetDemoPasswords().catch(async (error) => {
  console.error(error);
  await db.end();
  process.exit(1);
});
