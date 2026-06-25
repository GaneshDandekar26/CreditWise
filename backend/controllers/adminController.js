const LoanApplication = require('../models/LoanApplication');

/**
 * @desc    Get all loan applications (with filters and searching query parameters)
 * @route   GET /api/admin/applications
 * @access  Private (Admin Only)
 */
const getAllApplications = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    // Filter by status (ignore if status is 'All')
    if (status && status !== 'All') {
      query.status = status;
    }

    // Search by applicant name or email
    if (search) {
      query.$or = [
        { applicantName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const applications = await LoanApplication.find(query).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a loan application's status
 * @route   PUT /api/admin/applications/:id/status
 * @access  Private (Admin Only)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
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

    res.json(application);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated analytics metrics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin Only)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await LoanApplication.aggregate([
      {
        $facet: {
          riskDistribution: [
            {
              $group: {
                _id: '$riskLevel',
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                name: '$_id',
                value: '$count',
              },
            },
          ],
          amountAnalysis: [
            {
              $group: {
                _id: null,
                totalRequested: { $sum: '$loanAmount' },
                totalApproved: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Approved'] }, '$loanAmount', 0],
                  },
                },
              },
            },
          ],
          approvalRate: [
            {
              $group: {
                _id: null,
                totalCount: { $sum: 1 },
                approvedCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                rate: {
                  $cond: [
                    { $gt: ['$totalCount', 0] },
                    {
                      $round: [
                        { $multiply: [{ $divide: ['$approvedCount', '$totalCount'] }, 100] },
                        1,
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          ],
        },
      },
    ]);

    // Format output safely
    const result = analytics[0] || {};
    const riskDistribution = result.riskDistribution || [];
    const amountAnalysis = result.amountAnalysis[0] || { totalRequested: 0, totalApproved: 0 };
    const approvalRate = result.approvalRate[0] ? result.approvalRate[0].rate : 0;

    res.json({
      riskDistribution,
      amountAnalysis: {
        totalRequested: amountAnalysis.totalRequested,
        totalApproved: amountAnalysis.totalApproved,
      },
      approvalRate,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllApplications,
  updateApplicationStatus,
  getAnalytics,
};
