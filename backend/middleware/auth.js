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

// New middleware to allow both shop users and attendance-only users to access shop attendance
exports.shopAttendanceAuth = (req, res, next) => {
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
        
        // Allow access if user is admin OR a shop user OR an attendance-only user with shop association
        if (decoded.role === 'admin' || 
            (decoded.role === 'shop' && decoded.shopId) ||
            (decoded.role === 'attendance-only' && decoded.shopId)) {
            req.user = decoded;
            // Attach shopId to the request if it exists
            if (decoded.shopId) {
                req.shopId = decoded.shopId;
            }
            next();
        } else if (decoded.role === 'attendance-only' && !decoded.shopId) {
            // Attendance-only user without shopId should only access admin attendance
            console.log('Attendance-only user without shopId, access denied to shop attendance');
            return res.status(403).json({ message: 'Forbidden: Access denied to shop attendance.' });
        } else {
            console.log('Access denied, role:', decoded.role);
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }
    } catch (error) {
        console.log('Token verification failed:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// New middleware to allow both admin users and admin attendance-only users (without shopId) to access admin attendance
exports.adminAttendanceAuth = (req, res, next) => {
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
        
        // Allow access if user is admin OR an attendance-only user without shop association
        if (decoded.role === 'admin' || 
            (decoded.role === 'attendance-only' && !decoded.shopId)) {
            req.user = decoded;
            next();
        } else if (decoded.role === 'attendance-only' && decoded.shopId) {
            // Attendance-only user with shopId should only access shop attendance
            console.log('Attendance-only user with shopId, access denied to admin attendance');
            return res.status(403).json({ message: 'Forbidden: Access denied to admin attendance.' });
        } else {
            console.log('Access denied, role:', decoded.role);
            return res.status(403).json({ message: 'Forbidden: Access denied.' });
        }
    } catch (error) {
        console.log('Token verification failed:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

exports.attendanceOnlyAuth = (req, res, next) => {
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
        
        // Allow access if user has attendance-only role
        if (decoded.role === 'attendance-only') {
            req.user = decoded;
            next();
        } else {
            console.log('Access denied, role:', decoded.role);
            return res.status(403).json({ message: 'Forbidden: Attendance-only access required.' });
        }
    } catch (error) {
        console.log('Token verification failed:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};