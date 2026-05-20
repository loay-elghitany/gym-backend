const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    tenantSlug: { type: String, required: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    transactions: [
      {
        type: { type: String },
        amount: { type: Number },
        meta: { type: Object },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, collection: "wallets" },
);

module.exports = mongoose.model("Wallet", walletSchema);
