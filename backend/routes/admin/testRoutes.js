const express = require('express');
const router = express.Router();

// Test with a simple function first
function testHandler(req, res) {
    res.json({ message: 'Test successful' });
}

console.log('About to add route');
router.post('/test', testHandler);
console.log('Route added successfully');

module.exports = router;