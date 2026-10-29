/**
 * MoneyShield OS — Core Domain Types and Data Contracts
 * Compliant with India DPDP Act 2023, RBI Account Aggregator guidelines,
 * and Indian Income Tax Act (Sections 80C, 80D, 80CCD, 24b, 44ADA).
 */

export type UserPersona = 'salaried' | 'freelancer' | 'student' | 'smb';

export type LanguageCode = 'en' | 'hi' | 'mr' | 'ta' | 'te';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  persona: UserPersona;
  panMasked: string;
  hasPasskey: boolean;
  currency: 'INR';
  preferredLanguage: LanguageCode;
  monthlyIncome: number;
  healthScore: number;
  shieldStatus: 'armed' | 'elevated_alert' | 'breach_contained';
  dataSovereignty: {
    consentGivenAt: string;
    accountAggregatorLinked: boolean;
    localEncryption: 'AES-256-GCM';
    federatedTelemetry: boolean;
  };
}

export type TransactionType = 'upi' | 'card' | 'netbanking' | 'neft_rtgs' | 'cash';
export type TransactionCategory = 
  | 'Food & Dining' 
  | 'Subscriptions & SaaS' 
  | 'Shopping & Retail' 
  | 'Utilities & Bills' 
  | 'Travel & Transit' 
  | 'Healthcare & Wellness' 
  | 'Investment & Savings' 
  | 'Income & Salary' 
  | 'Business Expense';

export type TaxTag = '80C' | '80D' | '80E' | '80G' | '44ADA_Business' | 'Standard_Deduction' | 'Non_Tax_Deductible';

export interface Transaction {
  id: string;
  date: string;
  merchantName: string;
  merchantVpa?: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  isDebit: boolean;
  taxTag?: TaxTag;
  darkPatternFlag?: boolean;
  anomalyWarning?: string;
  carbonKg: number;
  notes?: string;
}

export type DarkPatternType = 
  | 'roach_motel'
  | 'hidden_costs'
  | 'forced_continuance'
  | 'confirmshaming'
  | 'sneaking_insurance';

export interface MandateExecutionLog {
  id: string;
  date: string;
  amount: number;
  status: 'SUCCESS' | 'BLOCKED_BY_USER' | 'FAILED' | 'PRE_DEBIT_NOTIFIED';
  npciRefNumber: string;
  note?: string;
}

export type MandateFrequency = 'Monthly' | 'Quarterly' | 'Yearly' | 'As-Presented' | 'Weekly';

export interface AutoPayMandate {
  id: string;
  serviceName: string;
  logo: string;
  merchantVpa: string;
  payerVpa?: string;
  amount: number;
  maxCapAmount?: number;
  frequency: MandateFrequency;
  nextBillingDate: string;
  startDate?: string;
  endDate?: string;
  umn?: string;
  mandateType: 'UPI_AUTOPAY' | 'E_NACH' | 'CREDIT_CARD';
  status: 'ACTIVE' | 'FLAGGED' | 'REVOKED' | 'PAUSED';
  pausedUntil?: string;
  riskScore: number;
  category?: 'Entertainment' | 'Fitness' | 'Software' | 'Utilities' | 'Insurance' | 'Investment' | 'Other';
  darkPatternsDetected: {
    type: DarkPatternType;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }[];
  cancellationDifficulty: 'EASY' | 'MODERATE' | 'EXTREME';
  cancellationDeepLink: string;
  cancellationGuide: string[];
  suggestedAlternative?: {
    name: string;
    monthlySavings: number;
    reason: string;
  };
  preDebitAlertHours?: number;
  history?: MandateExecutionLog[];
}

export interface CreateMandateRequest {
  serviceName: string;
  merchantVpa: string;
  payerVpa: string;
  amount: number;
  maxCapAmount: number;
  frequency: MandateFrequency;
  startDate: string;
  endDate: string;
  category: 'Entertainment' | 'Fitness' | 'Software' | 'Utilities' | 'Insurance' | 'Investment' | 'Other';
  preDebitAlertHours: number;
}

export interface ModifyMandateRequest {
  amount?: number;
  maxCapAmount?: number;
  frequency?: MandateFrequency;
  nextBillingDate?: string;
}

export interface ThreatItem {
  id: string;
  timestamp: string;
  type: 'SMS_PHISHING' | 'UPI_QR_SPOOF' | 'MALICIOUS_URL' | 'WHATSAPP_SCAM' | 'HOMOGRAPH_DOMAIN';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  rawPayload: string;
  riskScore: number;
  indicators: string[];
  recommendedAction: string;
  isContained: boolean;
  source: 'LOCAL_SCANNER' | 'FEDERATED_FEED' | 'USER_SUBMITTED';
}

export type AssetType = 
  | 'FIXED_DEPOSIT' 
  | 'STOCKS' 
  | 'MUTUAL_FUNDS' 
  | 'EPF' 
  | 'PPF' 
  | 'GOLD' 
  | 'BANK_SAVINGS' 
  | 'REAL_ESTATE';

export interface InvestmentAsset {
  id: string;
  name: string;
  symbol?: string; // e.g. 'RELIANCE', 'HDFCBANK', 'MIRAE_ELSS'
  type: AssetType;
  subCategory?: string; // 'ELSS Tax Saver', 'Large Cap Equity', '5-Yr Tax Saving FD', 'SGB 2028', 'Nifty 50 Index'
  currentValue: number;
  investedValue: number;
  returnsPercentage: number;
  unrealizedPnl: number;
  expenseRatio?: number;
  isDirectPlan?: boolean;
  interestRate?: number; // For FD e.g. 7.65%
  maturityDate?: string;
  taxTag?: '80C' | 'Tax_Free' | 'LTCG_Eligible' | 'STCG_Eligible';
  isPledgedForLoan?: boolean;
  pledgedValue?: number;
  maxLtvPercent?: number; // e.g. 50% for Stocks/Equity MF, 85% for FD/Debt
  liquidityTier: 'INSTANT' | 'T+1_DAYS' | 'LOCKED_TAX_SAVER';
}

export interface LoanAgainstSecurities {
  id: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  collateralValue: number;
  approvedLtvPercent: number; // e.g. 50% or 80%
  drawingPower: number; // Maximum limit available to withdraw
  utilizedAmount: number; // Current loan drawn
  interestRate: number; // e.g. 9.75%
  monthlyInterestDue: number;
  marginCallPriceLevel?: number;
  marginHealth: 'FORTIFIED' | 'STABLE' | 'WARNING' | 'MARGIN_CALL';
  interestSavedVsPersonalLoan: number; // Compared to 16% personal loan
  lenderEntity: string; // e.g. 'HDFC Bank LAS Enclave' or 'Bajaj Finserv Securities'
}

export interface AITaxSuggestion {
  id: string;
  section: '80C' | '80D' | '80CCD(1B)' | '24(b)' | '44ADA' | 'TAX_LOSS_HARVESTING';
  title: string;
  category: string;
  deductionLimit: number;
  utilizedDeduction: number;
  unutilizedHeadroom: number;
  estimatedTaxSavings: number; // Real tax saved based on 30% or 20% slab
  urgency: 'HIGH_PRIORITY' | 'RECOMMENDED' | 'OPTIMIZED';
  actionPrompt: string;
  recommendedInstruments: string[];
  reasoning: string;
  status: 'RECOMMENDED' | 'APPLIED' | 'DISMISSED';
}

export interface LiabilityItem {
  id: string;
  name: string;
  type: 'CREDIT_CARD' | 'HOME_LOAN' | 'PERSONAL_LOAN' | 'BNPL' | 'EDUCATION_LOAN' | 'LOAN_AGAINST_SECURITIES';
  principalOutstanding: number;
  interestRate: number;
  monthlyEmi: number;
}

export interface AIAssistantMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  content: string;
  toolCall?: {
    toolName: string;
    args: Record<string, unknown>;
    status: 'pending_approval' | 'executed' | 'rejected';
    outputSummary?: string;
    requiresBiometricAuth?: boolean;
  };
}

export interface ConsentRecord {
  id: string;
  purpose: string;
  dataCategory: string;
  grantedOn: string;
  expiresOn: string;
  status: 'ACTIVE' | 'REVOKED';
  regulatoryBasis: 'DPDP_Act_2023_Sec_6' | 'RBI_AA_Framework';
}

// PORTFOLIO DESIGNER TYPES
export type RiskProfileType = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'ULTRA_GROWTH';
export type InvestmentHorizonType = 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'GENERATIONAL';
export type PortfolioGoalType = 'WEALTH_CREATION' | 'RETIREMENT_CORPUS' | 'DOWN_PAYMENT' | 'TAX_OPTIMIZATION';

export interface AssetAllocationBucket {
  id: string;
  name: string;
  category: 'LARGE_CAP_EQUITY' | 'MID_SMALL_CAP' | 'DEBT_AND_FD' | 'GOLD_AND_SGB' | 'TAX_SAVER_ELSS' | 'LIQUID_RESERVES';
  targetPercent: number;
  currentPercent: number;
  currentValue: number;
  targetValue: number;
  driftPercent: number; // positive = overweighted, negative = underweighted
  rebalanceAction: 'BUY' | 'TRIM' | 'BALANCED';
  suggestedMonthlySipAllocation: number;
  recommendedInstruments: string[];
  rationale: string;
}

export interface MacroStressScenario {
  id: string;
  name: string;
  triggerEvent: string;
  portfolioImpactPercent: number;
  estimatedValueChange: number;
  resilienceRating: 'SHIELDED' | 'MODERATE_EXPOSURE' | 'HIGH_VOLATILITY';
  recoveryStrategy: string;
}

export interface PortfolioDesignerPlan {
  riskProfile: RiskProfileType;
  horizon: InvestmentHorizonType;
  goal: PortfolioGoalType;
  monthlySip: number;
  totalPortfolioValue: number;
  expectedAnnualReturn: number;
  sharpeRatio: number;
  maxDrawdownRisk: number;
  buckets: AssetAllocationBucket[];
  stressScenarios: MacroStressScenario[];
  aiExecutiveSummary: string;
  rebalancingBlueprint: string[];
}

// ADVANCED TAX PLANNER TYPES
export interface TaxLossHarvestItem {
  assetId: string;
  assetName: string;
  symbol: string;
  units: number;
  buyPrice: number;
  currentPrice: number;
  holdingType: 'SHORT_TERM' | 'LONG_TERM';
  unrealizedLoss: number;
  potentialTaxOffset: number;
  recommendedAction: string;
  deadline: string;
}

export interface AdvanceTaxQuarter {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  dueDate: string;
  statutoryCumulativePercent: number;
  cumulativeTaxDue: number;
  taxPaidToDate: number;
  shortfallAmount: number;
  interestPenaltySec234C: number;
  status: 'PAID' | 'DUE' | 'UPCOMING';
}

export interface AdvancedTaxPlanResult {
  financialYear: '2024-25' | '2025-26';
  grossTotalIncome: number;
  incomeSalary: number;
  incomeFreelance44ADA: number;
  incomeCapitalGains: number;
  incomeOtherSources: number;
  deductionsChapterVIA: {
    sec80C: { claimed: number; maxLimit: number; eligibleItems: string[] };
    sec80CCD1B: { claimed: number; maxLimit: number; eligibleItems: string[] };
    sec80D: { claimed: number; maxLimit: number; eligibleItems: string[] };
    sec24b: { claimed: number; maxLimit: number; eligibleItems: string[] };
    sec80E: { claimed: number; maxLimit: number; eligibleItems: string[] };
    sec80TTA: { claimed: number; maxLimit: number; eligibleItems: string[] };
  };
  oldRegimeTotalTax: number;
  newRegimeTotalTax: number;
  optimalRegime: 'NEW_REGIME' | 'OLD_REGIME';
  netTaxSaved: number;
  effectiveTaxRate: number;
  advanceTaxSchedule: AdvanceTaxQuarter[];
  taxLossHarvesting: TaxLossHarvestItem[];
  totalHarvestableLoss: number;
  potentialHarvestTaxSavings: number;
  aiTaxShieldBlueprint: string[];
}

