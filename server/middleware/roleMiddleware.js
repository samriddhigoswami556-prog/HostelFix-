const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required: No token provided"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied: You do not have permission to perform this action",
                requiredRoles: roles,
                userRole: req.user.role
            });
        }

        next();
    };
};

module.exports = authorizeRoles;