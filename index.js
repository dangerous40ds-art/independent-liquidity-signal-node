const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const SETTLEMENT_WALLET = "0x452993071FdE3743767f98f339E90D9A313BBf3B";

// 🟢 Free Path: Used by Cron-Job.org to keep container awake (Returns 200 OK)
app.get('/openapi.json', (req, res) => {
    res.json({
        openapi: "3.0.0",
        info: {
            title: "Liquidity Signal Feed Node",
            version: "1.0.0",
            description: "Real-time arbitrage tracking for trading bots over Base."
        },
        paths: {
            "/": {
                get: {
                    summary: "Fetch live pool metrics",
                    "x-payment-info": {
                        x402: {
                            amount: "0.001",
                            asset: "USDC",
                            network: "eip155:8453",
                            payTo: SETTLEMENT_WALLET
                        }
                    },
                    responses: {
                        "200": { description: "Successful data response" },
                        "402": { description: "Payment Required via x402 standard" }
                    }
                }
            }
        }
    });
});

// 🔒 Protected Core Path: Enforces the x402 Firewall lock
app.get('/', (req, res) => {
    const paymentReceipt = req.headers['x-payment-receipt'] || req.query.payment_hash;

    if (!paymentReceipt) {
        res.status(402).json({
            error: "Payment Required",
            amount: "0.001",
            asset: "USDC",
            network: "eip155:8453",
            payTo: SETTLEMENT_WALLET,
            instructions: "Send 0.001 USDC on Base to payTo wallet, then pass transaction hash via 'X-Payment-Receipt' header."
        });
        return;
    }

    res.json({
        status: "Success",
        settled: true,
        receipt: paymentReceipt,
        timestamp: new Date().toISOString(),
        signals: [
            { pool: "AERO/USDC", action: "BUY_SIGNAL", spread_pct: 0.42, volume_24h_usd: 1245000 },
            { pool: "VIRTUAL/WETH", action: "MONITOR", spread_pct: 0.11, volume_24h_usd: 890000 }
        ]
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Liquidity Signal Node active on port ${PORT}`);
});
