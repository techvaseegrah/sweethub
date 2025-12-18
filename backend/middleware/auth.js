const jwt = require('jsonwebtoken');

exports.adminAuth = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        console.log('No token provided in request headers');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length).trimStart();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            console.log('User is not admin, role:', decoded.role);
            return res.status(403).json({ message: 'Forbidden: Admin access required.' });
        }
        req.user = decoded; 
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

exports.shopAuth = (req, res, next) => {
    let token = req.header('Authorization');

    if (!token) {
        console.log('No token provided in request headers');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trimStart();
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Allow access if user is admin OR a shop user with a valid shopId
        if (decoded.role === 'admin' || (decoded.role === 'shop' && decoded.shopId)) {
            req.user = decoded;
            // Attach shopId to the request if it exists
            if (decoded.shopId) {
                req.shopId = decoded.shopId;
            }
            next();
        } else {
            console.log('Access denied, role:', decoded.role);
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }
    } catch (error) {
        console.log('Token verification failed:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};