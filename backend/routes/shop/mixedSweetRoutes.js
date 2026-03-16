const express = require('express');
const router = express.Router();
const mixedSweetController = require('../../controllers/shop/mixedSweetController');
const { shopAuth } = require('../../middleware/auth');

// All routes are protected and require 'shop' role
router.use(shopAuth);
router.use((req, res, next) => {
    if (req.user.role !== 'shop') {
        return res.status(403).json({ message: 'Only shop users can manufacture mixed sweets.' });
    }
    next();
});

router.get('/', mixedSweetController.getMixedSweetProductions);
router.post('/', mixedSweetController.createMixedSweetProduction);
router.get('/product/:productId', mixedSweetController.getMixedSweetByProductId);
router.delete('/:id', mixedSweetController.deleteMixedSweetProduction);

module.exports = router;
