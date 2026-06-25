const LoanApplication = require('../models/LoanApplication');
const { evaluateRisk } = require('../utils/riskEngine');

/**
 * @desc    Apply for a new loan
 * @route   POST /api/loans/apply
 * @access  Private (Customer)
 */
const applyForLoan = async (req, res, next) => {
  try {
    const { monthlyIncome, employmentType, creditScore, loanAmount, tenureMonths, existingDebt } = req.body;

    if (!monthlyIncome || !employmentType || !creditScore || !loanAmount || !tenureMonths || existingDebt === undefined) {
      res.status(400);
      throw new Error('Please enter all required financial parameters');
    }

    // Compute risk and fetch LLM feedback asynchronously using Gemini
    const riskResult = await evaluateRisk({
      monthlyIncome: Number(monthlyIncome),
      loanAmount: Number(loanAmount),
      tenureMonths: Number(tenureMonths),
      existingDebt: Number(existingDebt),
      employmentType,
      creditScore: Number(creditScore),
    });

    // Save application linked to user
    const application = await LoanApplication.create({
      user: req.user._id,
      applicantName: req.user.name,
      email: req.user.email,
      monthlyIncome: Number(monthlyIncome),
      employmentType,
      creditScore: Number(creditScore),
      loanAmount: Number(loanAmount),
      tenureMonths: Number(tenureMonths),
      existingDebt: Number(existingDebt),
      riskScore: riskResult.riskScore,
      riskLevel: riskResult.riskLevel,
      status: riskResult.status,
      adminSummary: riskResult.adminSummary,
      customerFeedback: riskResult.customerFeedback,
    });

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get loan application history
 * @route   GET /api/loans/history
 * @access  Private
 */
const getLoanHistory = async (req, res, next) => {
  try {
    let applications;

    // Admin can see all applications; Customer can only see their own
    if (req.user.role === 'admin') {
      applications = await LoanApplication.find({}).sort({ createdAt: -1 });
    } else {
      applications = await LoanApplication.find({ user: req.user._id }).sort({ createdAt: -1 });
    }

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update loan application status
 * @route   PATCH /api/loans/:id/status
 * @access  Private (Admin Only)
 */
const updateLoanStatus = async (req, res, next) => {
  try {
    // Role check
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Access denied. Admin role required.');
    }

    const { status } = req.body;
    if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }

    const application = await LoanApplication.findById(req.params.id);
    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    application.status = status;
    await application.save();

    res.json({ id: application._id, status: application.status });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForLoan,
  getLoanHistory,
  updateLoanStatus,
};
