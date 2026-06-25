const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Calculates risk score and level deterministically, decides initial status,
 * and calls Gemini to generate adminSummary and customerFeedback.
 *
 * @param {Object} profile - User financial inputs.
 * @returns {Promise<Object>} Contains riskScore, riskLevel, status, adminSummary, customerFeedback.
 */
const evaluateRisk = async (profile) => {
  const { monthlyIncome, loanAmount, tenureMonths, existingDebt, employmentType, creditScore } = profile;

  // 1. Deterministic Calculation
  const dti = (existingDebt + loanAmount / tenureMonths) / Math.max(monthlyIncome, 1);
  const empFactor = employmentType === 'Permanent' ? 0 : employmentType === 'Contract' ? 8 : 14;
  const credit = 850 - creditScore;
  const raw = credit * 0.12 + dti * 90 + empFactor;
  const riskScore = Math.min(100, Math.max(1, Math.round(raw)));

  let riskLevel = 'Medium';
  let status = 'Pending';

  if (riskScore < 35) {
    riskLevel = 'Low';
    status = 'Approved';
  } else if (riskScore > 65) {
    riskLevel = 'High';
    status = 'Rejected';
  }

  // 2. LLM Summary generation using Gemini
  let adminSummary = '';
  let customerFeedback = '';

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are a credit underwriting AI risk engine. Generate two short text strings based on this financial application:
1. "adminSummary": A clinical, concise technical explanation of the risk factors and why this risk level was assigned, suitable for an underwriter (max 2 sentences).
2. "customerFeedback": A polite, constructive piece of advice for the customer on what they can do to improve their credit profile or approval chances (max 2 sentences).

Application details:
- Credit Score: ${creditScore} (300-850 range)
- Monthly Income: $${monthlyIncome}
- Existing Monthly Debt: $${existingDebt}
- Loan Amount: $${loanAmount}
- Tenure: ${tenureMonths} months
- Employment Type: ${employmentType}
- Calculated Risk Score: ${riskScore} / 100 (${riskLevel} Risk)

Provide your response strictly in JSON format as follows:
{
  "adminSummary": "...",
  "customerFeedback": "..."
}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = result.response.text();
      const llmOutput = JSON.parse(responseText);

      adminSummary = llmOutput.adminSummary || '';
      customerFeedback = llmOutput.customerFeedback || '';
    } catch (error) {
      console.error('Gemini Risk Engine API Error:', error);
      // Fallbacks in case LLM fails
      adminSummary = `Formula calculated risk score of ${riskScore} (${riskLevel}). LLM analysis could not be reached.`;
      customerFeedback = `Your application is currently being evaluated. Formula risk score: ${riskScore}.`;
    }
  } else {
    adminSummary = `Formula calculated risk score of ${riskScore} (${riskLevel}). No GEMINI_API_KEY configured.`;
    customerFeedback = `Your application is currently being evaluated. Formula risk score: ${riskScore}.`;
  }

  return {
    riskScore,
    riskLevel,
    status,
    adminSummary,
    customerFeedback,
  };
};

module.exports = { evaluateRisk };
