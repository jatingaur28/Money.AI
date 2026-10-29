import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { generatePortfolioPlan } from './src/utils/portfolioDesigner';
import { generateAdvancedTaxPlan } from './src/utils/taxPlanner';
import { evaluatePaymentPreflight } from './src/utils/paymentPreflight';
import { prepareActionPlan, executeActionPlan } from './src/utils/safeActionProtocol';
import { simulateDigitalTwin } from './src/utils/digitalTwin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));

// Helper for timing out AI requests
function withTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI request timeout')), ms)),
  ]);
}

// Initialize GoogleGenAI SDK with server-side API key and User-Agent telemetry
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI:', err);
    ai = null;
  }
}

// 1. AI Copilot Endpoint
app.post('/api/ai/copilot', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (ai) {
      try {
        const systemPrompt = `You are MoneyShield OS — an enterprise-grade AI financial guardian, tax strategist, and fraud defense advisor for India.
User Context:
- Monthly Income: ₹${context?.monthlyIncome || 245000}
- Health Score: ${context?.healthScore || 780}/1000
- Persona: ${context?.persona || 'Salaried IT Professional'}
- Active AutoPay Mandates: ${context?.mandateCount || 4}
- Aggregate Portfolio: ₹${context?.portfolioValue || 5572030}

Rules:
1. Provide actionable, concise, mathematically accurate advice for Indian personal finance (INR ₹, UPI 2.0, Sections 80C, 80D, 80CCD, 44ADA).
2. Never hallucinate bank connections or claim to execute transactions without biometric passkey consent.
3. If the user asks about canceling a mandate or taking high-impact action, advise them that a cryptographic Passkey signature is required.
4. Keep tone professional, zero-trust, and protective like a high-end Swiss vault concierge.`;

        const response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: message,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          }),
          2500
        );

        const replyText = response.text || 'Analysis completed with MoneyShield Guardian.';
        return res.json({ replyText, provider: 'gemini-3.8-flash' });
      } catch (geminiError) {
        console.warn('Gemini generateContent error or timeout, using deterministic fallback:', geminiError);
      }
    }

    // Heuristic fallback if Gemini API is unreachable or key is not provided
    const lower = message.toLowerCase();
    let replyText = `MoneyShield Guardian has analyzed your financial perimeter. Your net liquidity is sound, and your health score is fortified. You can simulate portfolio rebalancing or execute tax-loss harvesting before March 31.`;
    
    if (lower.includes('tax') || lower.includes('regime')) {
      replyText = `Based on your CTC, the New Tax Regime saves approximately ₹24,800 annually with the ₹75,000 standard deduction unless your combined deductions (80C, 80D, 80CCD, 24b) exceed ₹4,25,000. Check the Advanced AI Tax Planner tab for an exact comparison.`;
    } else if (lower.includes('portfolio') || lower.includes('invest') || lower.includes('sip')) {
      replyText = `Your asset allocation is currently 58% equities, 28% fixed deposits/debt, and 14% gold/liquid reserves. We recommend maintaining an automated ₹35,000/mo SIP split across Nifty 50 and Direct ELSS to optimize risk-adjusted alpha.`;
    }

    return res.json({ replyText, provider: 'moneyshield-deterministic-engine' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 2. AI Portfolio Designer Endpoint
app.post('/api/ai/portfolio-designer', async (req, res) => {
  try {
    const { riskProfile, horizon, goal, monthlySip, assets } = req.body;
    
    // Calculate deterministic base plan
    const plan = generatePortfolioPlan({
      riskProfile: riskProfile || 'MODERATE',
      horizon: horizon || 'MEDIUM_TERM',
      goal: goal || 'WEALTH_CREATION',
      monthlySip: Number(monthlySip) || 35000,
      assets: assets || [],
    });

    // Optionally enhance executive summary with Gemini if available
    if (ai) {
      try {
        const prompt = `Review this Indian investment portfolio design:
Risk: ${plan.riskProfile}, Horizon: ${plan.horizon}, Goal: ${plan.goal}, Monthly SIP: ₹${plan.monthlySip}.
Total Assets: ₹${plan.totalPortfolioValue}. Expected Annual Return: ${plan.expectedAnnualReturn}%.
Sharpe Ratio: ${plan.sharpeRatio}.
Provide a 2-sentence executive guidance emphasizing tax efficiency, LAS credit lines, and macro resilience for an Indian investor.`;

        const geminiRes = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          }),
          2500
        );

        if (geminiRes.text) {
          plan.aiExecutiveSummary = geminiRes.text;
        }
      } catch (err) {
        console.warn('Gemini portfolio prompt failed or timed out, keeping base summary:', err);
      }
    }

    return res.json({ plan, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to design portfolio' });
  }
});

// 3. AI Tax Planner Endpoint
app.post('/api/ai/tax-planner', async (req, res) => {
  try {
    const input = req.body;
    const plan = generateAdvancedTaxPlan(input);

    if (ai) {
      try {
        const prompt = `You are a Senior Indian Chartered Accountant and Tax Strategist. Review this tax audit:
Gross Total Income: ₹${plan.grossTotalIncome}
Salary: ₹${plan.incomeSalary}, Freelance 44ADA: ₹${plan.incomeFreelance44ADA}
Old Regime Tax: ₹${plan.oldRegimeTotalTax} vs New Regime Tax: ₹${plan.newRegimeTotalTax}
Optimal Regime: ${plan.optimalRegime} (Net Tax Saved: ₹${plan.netTaxSaved})
Tax Loss Harvesting: ₹${plan.potentialHarvestTaxSavings} savable from ₹${plan.totalHarvestableLoss} loss.
Provide 3 bullet points with high-impact, legally sound tax reduction maneuvers before March 31.`;

        const geminiRes = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          }),
          2500
        );

        if (geminiRes.text) {
          const lines = geminiRes.text.split('\n').filter((l: string) => l.trim().length > 0);
          if (lines.length >= 2) {
            plan.aiTaxShieldBlueprint = lines.slice(0, 4);
          }
        }
      } catch (err) {
        console.warn('Gemini tax prompt timed out, keeping deterministic blueprint:', err);
      }
    }

    return res.json({ plan, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate tax plan' });
  }
});

// 4. Payment Preflight Analysis Endpoint
app.post('/api/preflight/analyze', async (req, res) => {
  try {
    const { rawInput, contextNote, expectedMerchant } = req.body;
    if (!rawInput) {
      return res.status(400).json({ error: 'Payment payload or text input is required.' });
    }

    const analysis = evaluatePaymentPreflight({
      rawInput,
      contextNote,
      expectedMerchant,
    });

    // Optional LLM deep scan for adversarial obfuscation
    if (ai && analysis.verdict !== 'DANGEROUS') {
      try {
        const prompt = `Analyze this Indian payment intent or message for subtle social engineering or fraud:
Raw text: "${rawInput}"
Context note: "${contextNote || 'None'}"
Current rule score: ${analysis.riskScore}/100.
If there are hidden coercion tricks (e.g., impersonating an electricity board, fake customs fees, bank KYC urgency), state in 1 sentence.`;

        const geminiRes = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          }),
          2000
        );

        if (geminiRes.text && geminiRes.text.length > 5) {
          analysis.safeNextStep = `${analysis.safeNextStep} [AI Sentinel]: ${geminiRes.text.trim()}`;
        }
      } catch (err) {
        // Fallback silently to rule-based result
      }
    }

    return res.json({ analysis, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Preflight evaluation failed' });
  }
});

// 5. Safe Action Protocol: Prepare Action Plan
app.post('/api/safe-action/prepare', (req, res) => {
  try {
    const { title, description, impactLevel, targetEntity, parameters, previewChanges, rollbackPlan } = req.body;
    if (!title || !impactLevel) {
      return res.status(400).json({ error: 'Title and impactLevel are required.' });
    }

    const plan = prepareActionPlan({
      title,
      description: description || '',
      impactLevel,
      targetEntity: targetEntity || 'GENERAL_SYSTEM',
      parameters: parameters || {},
      previewChanges: previewChanges || [],
      rollbackPlan: rollbackPlan || 'Manual re-configuration required.',
    });

    return res.json({ plan, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to prepare action plan' });
  }
});

// 6. Safe Action Protocol: Execute Approved Plan
app.post('/api/safe-action/execute', (req, res) => {
  try {
    const { plan, passkeySignature } = req.body;
    if (!plan || !plan.id) {
      return res.status(400).json({ error: 'Valid ActionPlan is required.' });
    }

    const receipt = executeActionPlan(plan, passkeySignature);
    return res.json({ receipt, success: true });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Action execution denied' });
  }
});

// 7. Personal Financial Digital Twin: What-If Simulator
app.post('/api/digital-twin/simulate', (req, res) => {
  try {
    const { baseState, scenario } = req.body;
    if (!baseState || !scenario) {
      return res.status(400).json({ error: 'baseState and scenario are required.' });
    }

    const result = simulateDigitalTwin(baseState, scenario);
    return res.json({ result, success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Simulation failed' });
  }
});

// Mount Vite or serve static assets
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`MoneyShield OS server running on http://0.0.0.0:${port}`);
});
