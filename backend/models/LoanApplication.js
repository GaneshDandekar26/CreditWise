const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    monthlyIncome: {
      type: Number,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['Permanent', 'Contract', 'Self-employed'],
      required: true,
    },
    creditScore: {
      type: Number,
      required: true,
      min: 300,
      max: 850,
    },
    loanAmount: {
      type: Number,
      required: true,
    },
    tenureMonths: {
      type: Number,
      required: true,
    },
    existingDebt: {
      type: Number,
      required: true,
    },
    riskScore: {
      type: Number,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      required: true,
    },
    adminSummary: {
      type: String,
    },
    customerFeedback: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
