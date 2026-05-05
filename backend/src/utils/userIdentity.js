const { v5: uuidv5 } = require('uuid');

const GOOGLE_USER_UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function resolveGoogleIdentity(user) {
  const googleId = String(user?.sub || user?.id || user?.email || '').trim();
  if (!googleId) {
    throw new Error('Google user identity missing');
  }

  return {
    googleId,
    userId: uuidv5(googleId, GOOGLE_USER_UUID_NAMESPACE),
  };
}

module.exports = {
  resolveGoogleIdentity,
};
