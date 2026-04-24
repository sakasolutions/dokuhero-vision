function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  req.accessToken = token;

  const userIdHeader = req.headers['x-user-id'];
  req.userId = typeof userIdHeader === 'string' && userIdHeader.trim() ? userIdHeader.trim() : null;

  return next();
}

module.exports = requireAuth;
