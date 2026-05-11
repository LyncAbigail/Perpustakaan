const ROLES = {
  ADMIN: 1,
  MODERATOR: 2,
  USER: 3
};

const ROLE_NAMES = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MODERATOR]: 'Moderator',
  [ROLES.USER]: 'User'
};

module.exports = { ROLES, ROLE_NAMES };
