import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createMarketplaceItem, getAllMarketplaceItems, updateMarketplaceStatus, deleteMarketplaceItem } from '../controllers/marketplaceController.js';

const router = Router();

// Create new listing (resident)
router.post('/', auth(['resident', 'admin', 'staff']), createMarketplaceItem);

// Get all listings (authenticated users)
router.get('/', auth(['resident', 'admin', 'staff', 'guard']), getAllMarketplaceItems);

// Update status (owner or admin)
router.put('/:id', auth(['resident', 'admin', 'staff']), updateMarketplaceStatus);

// Admin delete listing
router.delete('/:id', auth(['admin']), deleteMarketplaceItem);

export default router;
