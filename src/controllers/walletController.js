const Wallet = require("../models/Wallet");

// POST /api/wallet/order
exports.createOrder = async (req, res, next) => {
  try {
    const { tenantId } = req.tenant || {};
    const userId = req.user && req.user._id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { productId, price, metadata } = req.body;
    const wallet = await Wallet.findOne({ tenantId, userId });
    if (!wallet)
      return res
        .status(400)
        .json({ success: false, message: "Wallet not found" });

    if (wallet.balance < price) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient wallet balance" });
    }

    wallet.balance = wallet.balance - price;
    wallet.transactions.push({
      type: "order",
      amount: -price,
      meta: { productId, metadata },
    });
    await wallet.save();

    res.json({ success: true, data: { balance: wallet.balance } });
  } catch (err) {
    next(err);
  }
};

// GET /api/wallet/balance
exports.getBalance = async (req, res, next) => {
  try {
    const { tenantId } = req.tenant || {};
    const userId = req.user && req.user._id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const wallet = await Wallet.findOne({ tenantId, userId });
    res.json({ success: true, data: { balance: wallet ? wallet.balance : 0 } });
  } catch (err) {
    next(err);
  }
};
