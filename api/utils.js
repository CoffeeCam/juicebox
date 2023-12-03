const { getUserById } = require('../db/index');

async function requireUser(req, res, next) {
  try {
    // Check if user is logged in
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized: User not logged in',
      });
    }

    // Attach the user to the request object
    req.user = await getUserById(req.user.id);

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireUser,
};