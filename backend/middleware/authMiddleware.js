const jwt = require('jsonwebtoken');

exports.adminAuth = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length).trimStart();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Assuming your JWT payload includes a role
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access required.' });
        }
        req.user = decoded; // Add user payload to request
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

exports.shopAuth = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length).trimStart();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Assuming your JWT payload includes a role
        if (decoded.role !== 'shop' && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Shop worker or admin access required.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};