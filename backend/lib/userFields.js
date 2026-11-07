// The only user fields that may be sent to the browser.
// passwordHash is never in this list.

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
};

// Copies only the safe fields from a full user record
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = { publicUserSelect, toPublicUser };