// Middleware to restrict access based on user role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This route is only for: ${roles.join(', ')}`
      });
    }
    next();
  };
};

module.exports = { authorize };
