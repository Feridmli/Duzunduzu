import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet());
app.use(express.json());

const FRONTEND_URL = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: FRONTEND_URL === '*' ? true : FRONTEND_URL }));

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

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

app.get('/orders/:address?', async (req, res) => {
  await db.read();
  let orders = db.data.orders || [];
  const addr = req.params.address;
  if (addr) {
    orders = orders.filter(o => o.seller && o.seller.toLowerCase() === addr.toLowerCase());
  }
  res.json({ success: true, orders });
});

// Async server start
async function startServer() {
  await db.read();
  if (!db.data) {
    db.data = { orders: [] };
    await db.write();
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Backend ${PORT}-də işləyir`));
}

startServer();
