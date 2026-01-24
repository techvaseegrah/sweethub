const express = require('express');
const router = express.Router();

// Simple test route to verify the router works
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;