const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false, // Don't return password by default
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["superadmin", "gymowner", "receptionist", "trainer", "member"],
      default: "member",
    },
    healthProfile: {
      injuries: [
        {
          type: String,
          trim: true,
        },
      ],
      inBodyHistory: [
        {
          date: {
            type: Date,
            required: true,
          },
          weight: {
            type: Number,
            required: true,
            min: 0,
          },
          bodyFatPercentage: {
            type: Number,
            min: 0,
            max: 100,
          },
          muscleMass: {
            type: Number,
            min: 0,
          },
          visceralFat: {
            type: Number,
            min: 0,
          },
          bodyWaterPercentage: {
            type: Number,
            min: 0,
            max: 100,
          },
        },
      ],
      bloodMarkers: {
        vitaminD: {
          value: { type: Number },
          unit: { type: String, default: "ng/mL" },
          safeRange: { type: String, default: "30-100" },
        },
        iron: {
          value: { type: Number },
          unit: { type: String, default: "ug/dL" },
          safeRange: { type: String, default: "50-170" },
        },
        testosterone: {
          value: { type: Number },
          unit: { type: String, default: "ng/dL" },
          safeRange: { type: String, default: "300-1000" },
        },
      },
    },
    gamification: {
      attendanceStreak: {
        type: Number,
        default: 0,
        min: 0,
      },
      badges: [
        {
          name: String,
          description: String,
          awardedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      points: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    attendanceHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        checkInType: {
          type: String,
          enum: ["gym", "class", "training"],
          default: "gym",
        },
      },
    ],
    lastAttendanceAt: {
      type: Date,
      default: null,
    },
    subscription: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Membership",
      },
      status: {
        type: String,
        enum: ["active", "expired", "paused"],
        default: "active",
      },
      startDate: {
        type: Date,
      },
      expiresAt: {
        type: Date,
      },
      autoRenew: {
        type: Boolean,
        default: true,
      },
      frozenUntil: {
        type: Date,
      },
    },
    // Multi-tenancy field
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: [true, "TenantId is required"],
      index: true, // Important for multi-tenancy queries
    },
    // Tenant slug for quick reference
    tenantSlug: {
      type: String,
      required: true,
      index: true,
    },
    // For superadmins managing multiple tenants
    managedTenants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    permissions: [
      {
        type: String,
        enum: [
          "manage_members",
          "manage_trainers",
          "manage_classes",
          "manage_billing",
          "view_reports",
          "manage_tenant",
        ],
      },
    ],
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// Indexes for multi-tenancy
userSchema.index({ tenantId: 1, email: 1 });

// Normalize email and hash password before saving
userSchema.pre("save", async function () {
  if (this.isModified("email") && typeof this.email === "string") {
    this.email = this.email.trim().toLowerCase();
  }

  if (!this.isModified("password") || !this.password) return;

  // If the password already looks like a bcrypt hash, skip re-hashing
  // Bcrypt hashes typically start with $2a$, $2b$, or $2y$
  const bcryptHashRegex = /^\$2[aby]\$\d{2}\$/;
  if (bcryptHashRegex.test(this.password)) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
