# Multi-Shop Separate Bill ID & Billing Isolation

This document describes the implementation of multi-shop separate bill ID generation and billing isolation in the SweetHub application.

## Overview

The implementation ensures that:
1. Each shop generates its own unique Bill IDs in the format: `SHP-{SHOPCODE}-XXXX`
2. Admin bills use a separate format: `ADM-XXXX`
3. Shops can only see their own bills
4. Admin can see all bills but with proper filtering
5. Bill numbering continues sequentially without daily resets

## Implementation Details

### 1. Shop Code Generation

When a new shop is created, a unique shop code is generated based on the location or shop name:
- Format: `{LOCATION_CODE}{SEQUENCE_NUMBER}` or `{NAME_CODE}{SEQUENCE_NUMBER}`
- Location code: First 2 letters of the location/state in uppercase
- Name code: First 2 letters of the shop name in uppercase (fallback if location not provided)
- Sequence number: 2-digit sequential number starting from 01

Example shop codes:
- TN01 (Tamil Nadu, first shop)
- KA01 (Karnataka, first shop)
- KL01 (Kerala, first shop)
- SH01 (Generic fallback)

### 2. Backward Compatibility

The implementation handles existing shops that were created before the shopCode field was added:
- Automatically generates and assigns shop codes to existing shops
- Migration script updates all existing shops and bills
- No data loss during the upgrade process

### 3. Bill ID Generation (Continuous Numbering)

#### Shop Bills
- Format: `SHP-{SHOPCODE}-XXXX`
- Continuous numbering (no daily reset)
- Increments only within that shop
- Example: `SHP-TN01-0001`, `SHP-TN01-0002`, etc.

#### Admin Bills
- Format: `ADM-XXXX`
- Completely separate from shop bills
- Continuous numbering (no daily reset)
- Example: `ADM-0001`, `ADM-0002`, etc.

### 4. Bill Isolation

- Shop bills are isolated by shop ID
- Admin can filter bills by shop or view only admin bills
- Proper database queries ensure data isolation

## Files Modified

### Backend
1. `backend/models/shopModel.js` - Added shopCode field
2. `backend/models/billModel.js` - Added billId field
3. `backend/controllers/admin/adminShopController.js` - Added shop code generation
4. `backend/controllers/admin/billingController.js` - Updated to use new bill ID generation
5. `backend/controllers/shop/billController.js` - Updated to use new bill ID generation
6. `backend/utils/billIdGenerator.js` - Created utility functions for bill ID generation

### Frontend
1. `frontend/src/components/shop/billing/ShopViewBills.js` - Updated to display new billId
2. `frontend/src/components/admin/billing/AdminViewBills.js` - Updated to display new billId
3. `frontend/src/components/shop/billing/BillDetailView.js` - Updated to display new billId
4. `frontend/src/components/admin/billing/BillDetailView.js` - Updated to display new billId
5. `frontend/src/utils/generateBillPdf.js` - Updated to use new billId in PDFs

### Scripts
1. `backend/scripts/migrateBillIds.js` - Migration script for existing bills
2. `backend/scripts/testShopCodeGeneration.js` - Test script for shop code generation

## Migration

To migrate existing bills to use the new billId format:

```bash
node backend/scripts/migrateBillIds.js
```

This script will:
1. Find all shops without a shopCode and generate one
2. Find all bills without a billId
3. Generate appropriate bill IDs based on shop/admin status with continuous numbering
4. Update the bills with the new billId field

## Testing

To test shop code generation:

```bash
node backend/scripts/testShopCodeGeneration.js
```

This script will simulate the shop code generation logic and show sample shop codes.

## Verification

After implementation, verify that:
1. New shops get unique shop codes
2. New bills get unique bill IDs in the correct format
3. Shops can only see their own bills
4. Admin can filter bills appropriately
5. PDFs display the correct bill IDs
6. Existing bills can be migrated successfully
7. Bill numbering continues sequentially without daily resets

## Troubleshooting

### 500 Internal Server Error when creating bills

This error typically occurs when:
1. Existing shops don't have shop codes assigned
2. Database connectivity issues
3. Missing environment variables

**Solution:**
1. Run the migration script to ensure all shops have shop codes
2. Check MongoDB connection
3. Verify all required environment variables are set

## Future Considerations

1. Consider adding validation to ensure shop codes are unique
2. Add UI to manage/edit shop codes if needed
3. Consider adding audit logs for bill ID generation