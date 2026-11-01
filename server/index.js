const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize the database connection
db.initDatabase();

// ─── USER ROUTES ──────────────────────────────────────────
app.post('/api/users/register', (req, res) => res.json(db.registerUser(req.body)));
app.get('/api/users', (req, res) => res.json(db.getAllUsers()));
app.get('/api/users/email/:email', (req, res) => res.json(db.getUserByEmail(req.params.email) || null));

app.get('/', (req, res) => res.send('Backend API is running. Please access the application at http://localhost:5173'));

// ─── ASSET ROUTES ─────────────────────────────────────────
app.get('/api/assets', (req, res) => res.json(db.getAllAssets()));
app.post('/api/assets', (req, res) => res.json(db.addAsset(req.body)));
app.put('/api/assets/:id', (req, res) => res.json(db.updateAsset(parseInt(req.params.id), req.body)));
app.delete('/api/assets/:id', (req, res) => res.json(db.deleteAsset(parseInt(req.params.id))));

// ─── VOUCHER ROUTES ───────────────────────────────────────
app.get('/api/vouchers/m19', (req, res) => res.json(db.getAllVouchersM19()));
app.post('/api/vouchers/m19', (req, res) => res.json(db.createVoucherM19(req.body)));

app.get('/api/vouchers/m20', (req, res) => res.json(db.getAllVouchersM20()));
app.post('/api/vouchers/m20', (req, res) => res.json(db.createVoucherM20(req.body)));

app.get('/api/vouchers/m22', (req, res) => res.json(db.getAllVouchersM22()));
app.post('/api/vouchers/m22', (req, res) => res.json(db.createVoucherM22(req.body)));

app.get('/api/vouchers/nextNumber/:type', (req, res) => res.json({ nextNumber: db.getNextVoucherNumber(req.params.type) }));

// ─── ANALYTICS, TRANSACTIONS & MAINTENANCE ────────────────
app.get('/api/stats', (req, res) => res.json(db.getDashboardStats()));
app.get('/api/transactions', (req, res) => res.json(db.getAllTransactions()));

app.get('/api/maintenance', (req, res) => res.json(db.getMaintenanceLogs()));
app.post('/api/maintenance', (req, res) => res.json(db.addMaintenance(req.body)));
app.put('/api/maintenance/:id', (req, res) => res.json(db.updateMaintenance(parseInt(req.params.id), req.body)));

// ─── PENDING REQUESTS (Approval Workflow) ──────────────
app.get('/api/pending', (req, res) => res.json(db.getPendingRequests(req.query.status)));
app.post('/api/pending', (req, res) => res.json(db.createPendingRequest(req.body)));
app.put('/api/pending/:id/review', (req, res) => {
  const { action, reviewedBy, reviewNote } = req.body;
  res.json(db.reviewPendingRequest(parseInt(req.params.id), action, reviewedBy, reviewNote));
});

// ─── INVENTORY COUNTS & DISPOSALS ─────────────────────────
app.get('/api/inventory-counts', (req, res) => res.json(db.getAllInventoryCounts()));
app.get('/api/inventory-counts/:id', (req, res) => res.json(db.getInventoryCountById(parseInt(req.params.id))));
app.post('/api/inventory-counts', (req, res) => res.json(db.createInventoryCount(req.body)));
app.get('/api/disposals', (req, res) => res.json(db.getAllDisposals()));
app.post('/api/disposals', (req, res) => res.json(db.createDisposal(req.body)));

// ─── AMIS HIERARCHIES, TRANSFERS & ALLOCATIONS ────────────
app.get('/api/hierarchies', (req, res) => res.json(db.getAllHierarchies ? db.getAllHierarchies() : []));
app.post('/api/hierarchies', (req, res) => res.json(db.createHierarchy ? db.createHierarchy(req.body) : { success: true }));
app.delete('/api/hierarchies/:id', (req, res) => res.json(db.deleteHierarchy ? db.deleteHierarchy(parseInt(req.params.id)) : { success: true }));
app.get('/api/transfers', (req, res) => res.json(db.getAllTransfers ? db.getAllTransfers() : []));
app.post('/api/transfers', (req, res) => res.json(db.createTransfer ? db.createTransfer(req.body) : { success: true }));
app.put('/api/transfers/:id/respond', (req, res) => res.json(db.respondTransfer ? db.respondTransfer(parseInt(req.params.id), req.body.status, req.body.note) : { success: true }));
app.get('/api/allocations', (req, res) => res.json(db.getAllAllocations ? db.getAllAllocations() : []));
app.post('/api/allocations', (req, res) => res.json(db.createAllocation ? db.createAllocation(req.body) : { success: true }));
app.post('/api/auth/change-password', (req, res) => res.json(db.changeUserPassword ? db.changeUserPassword(req.body.userId, req.body.newPassword) : { success: true }));

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Backend API Server running on http://localhost:${PORT}`);
});
