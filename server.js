// server.js — KamoAzmiu Marketplace Backend (Buy-only)
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

// Load environment variables
dotenv.config();

// __dirname fix for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
app.use(helmet());
app.use(express.json());

// CORS
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: FRONTEND_URL === '*' ? true : FRONTEND_URL }));

// LowDB setup
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Init DB before server starts
async function initDB() {
  await db.read();

  // Check if data exists, otherwise create default
  if (!db.data) {
    db.data = { orders: [] };
    await db.write();
  }
}

// **Top-level await** ensures DB is ready before server listens
await initDB();

// POST /order — order-u DB-də saxla
app.post('/order', async (req, res) => {
  try {
    const { tokenId, price, nftContract, marketplaceContract, sellerAddress, seaportOrder, orderHash } = req.body;

    if (!tokenId || !price || !nftContract || !marketplaceContract || !sellerAddress || !seaportOrder)
      return res.status(400).json({ success: false, error: 'Missing parameters' });

    await db.read();
    const id = nanoid();
    const order = {
      id,
      tokenId: tokenId.toString(),
      price,
      nftContract,
      marketplaceContract,
      seller: sellerAddress,
      seaportOrder,
      orderHash: orderHash || null,
      onChain: !!orderHash,
      createdAt: new Date().toISOString()
    };
    db.data.orders.push(order);
    await db.write();

    res.json({ success: true, order });
  } catch (e) {
    console.error('POST /order error', e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /orders/:address? — bütün və ya user-specific order-lar
app.get('/orders/:address?', async (req, res) => {
  await db.read();
  const addr = req.params.address;
  let orders = db.data.orders || [];
  if (addr) {
    orders = orders.filter(o => o.seller && o.seller.toLowerCase() === addr.toLowerCase());
  }
  res.json({ success: true, orders });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend ${PORT}-də işləyir`));