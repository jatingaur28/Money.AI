/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Data Provenance & Confidence
export type ProvenanceTag = 
  | 'VERIFIED_FACT'      // Direct API sync from bank/NPCI with cryptographic confirmation
  | 'USER_ENTERED'       // Self-declared by user
  | 'IMPORTED_RECORD'    // Parsed from bank statement, PDF, or email receipt
  | 'INFERENCE'          // Derived via statistical or rule-based models
  | 'FORECAST'           // Predictive extrapolation into future
  | 'STALE'              // Verified in past, but not refreshed in >30 days
  | 'UNKNOWN';           // Data point is missing or indeterminate

export interface FinancialFact<T = any> {
  id: string;
  category: 'INCOME' | 'LIQUIDITY' | 'OBLIGATION' | 'INVESTMENT' | 'DEBT' | 'INSURANCE' | 'TAX';
  label: string;
  value: T;
  currency: string;
  effectiveDate: string;
  lastObservedDate: string;
  provenance: ProvenanceTag;
  confidenceScore: number; // 0 to 1.0
  sourceLabel: string;
  verificationProof?: string;
  isStale: boolean;
  notes?: string;
}

export interface CoverageItem {
  id: string;
  domain: 'BANK_ACCOUNTS' | 'CREDIT_CARDS' | 'MANDATES' | 'LOANS_EMIS' | 'INVESTMENTS' | 'INSURANCE' | 'TAX_DOCS';
  label: string;
  status: 'CONNECTED' | 'PARTIAL' | 'STALE' | 'MISSING' | 'UNLINKED';
  provenance: ProvenanceTag;
  lastSyncedAt?: string;
  freshnessDays: number;
  gapImpactDescription?: string;
  recommendedAction?: string;
}

export interface CoverageGapAudit {
  overallCoverageScore: number; // 0 to 100
  verifiedFactsCount: number;
  inferredFactsCount: number;
  staleFactsCount: number;
  unlinkedDomainsCount: number;
  items: CoverageItem[];
  highPriorityGaps: string[];
}

// Obligation & Collision Radar
export interface Obligation {
  id: string;
  title: string;
  payee: string;
  amount: number;
  dueDate: string; // ISO date YYYY-MM-DD
  frequency: 'ONCE' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  category: 'EMI' | 'UTILITY' | 'MANDATE' | 'CREDIT_CARD' | 'TAX' | 'SIP' | 'RENT';
  isMandateLinked: boolean;
  umn?: string;
  isVariableAmount: boolean;
  provenance: ProvenanceTag;
  consequenceOfDelay: 'CIVIL_PENALTY' | 'CREDIT_SCORE_HIT' | 'SERVICE_CUT' | 'INTEREST_COMPOUND';
}

export interface CashFlowCollision {
  id: string;
  date: string;
  windowDays: number;
  projectedBalanceBefore: number;
  totalObligationsDue: number;
  projectedShortfall: number;
  severity: 'CRITICAL_SHORTFALL' | 'TIGHT_BUFFER' | 'BALANCED' | 'HEALTHY';
  competingObligations: Obligation[];
  expectedInflows: {
    source: string;
    amount: number;
    expectedDate: string;
    reliabilityScore: number;
  }[];
  mitigationStrategies: {
    id: string;
    title: string;
    description: string;
    type: 'PAUSE_MANDATE' | 'LAS_CREDIT_LINE' | 'FD_OVERDRAFT' | 'ADJUST_SIP_DATE';
    impactAmount: number;
    actionPlanId?: string;
  }[];
}

// Payment Preflight
export interface ParsedUPIPayload {
  vpa: string;
  payeeName?: string;
  merchantCode?: string;
  amount?: number;
  transactionRef?: string;
  url?: string;
  rawPayload: string;
}

export interface PreflightRiskIndicator {
  ruleId: string;
  category: 'HOMOGRAPH_DOMAIN' | 'SUSPICIOUS_VPA' | 'URGENCY_INJECTION' | 'CREDENTIAL_PROMPT' | 'UNVERIFIED_MERCHANT' | 'PAYEE_MISMATCH';
  severity: 'INFO' | 'WARNING' | 'BLOCK';
  description: string;
  evidence: string;
}

export interface PreflightAnalysis {
  id: string;
  analyzedAt: string;
  targetPayee: string;
  targetVpa: string;
  requestedAmount?: number;
  currency: string;
  intentSummary: string;
  verdict: 'CLEAN' | 'CAUTION' | 'DANGEROUS';
  riskScore: number; // 0 (pristine) to 100 (lethal)
  flags: PreflightRiskIndicator[];
  parsedUpi?: ParsedUPIPayload;
  safeNextStep: string;
}

// Bill Truth & Contract Drift
export interface BillDriftItem {
  id: string;
  merchant: string;
  originalAgreedAmount: number;
  currentBilledAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  detectedDriftType: 'STEALTH_HIKE' | 'TRIAL_CONVERSION' | 'FOREIGN_FX_MARKUP' | 'DUPLICATE_DEBIT' | 'UNNOTIFIED_ADDON';
  evidenceDate: string;
  umn?: string;
  mandateReference?: string;
  receiptSnippet?: string;
  disputePacketReady: boolean;
}

export interface DisputePacket {
  id: string;
  merchant: string;
  transactionId: string;
  umn?: string;
  amountDisputed: number;
  dateDisputed: string;
  grounds: string;
  regulatoryReference: string; // e.g., RBI/2020-21/74 DPSS.CO.OD No.753/06.11.001/2020-21
  statutoryResolutionWindow: string; // "T+1 days per RBI Harmonisation Guidelines"
  complaintLetterDraft: string;
}

// Safe Action Protocol
export type ActionImpactLevel = 'READ_ONLY' | 'REVERSIBLE_LOCAL' | 'CONSEQUENTIAL_EXTERNAL';

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  impactLevel: ActionImpactLevel;
  targetEntity: string;
  parameters: Record<string, any>;
  previewChanges: {
    field: string;
    currentValue: string;
    newValue: string;
  }[];
  rollbackPlan: string;
  requiresPasskey: boolean;
  sha256Fingerprint: string;
  createdAt: string;
  status: 'PENDING_PREVIEW' | 'APPROVED' | 'EXECUTED' | 'FAILED' | 'REVERTED';
}

export interface OutcomeReceipt {
  receiptId: string;
  actionPlanId: string;
  actionTitle: string;
  executedAt: string;
  biometricVerificationProof: string;
  idempotencyKey: string;
  executionStatus: 'SUCCESS' | 'EXTERNAL_REJECTED';
  auditHash: string;
  undoPermittedUntil?: string;
  summaryText: string;
}

// Personal Financial Digital Twin
export interface DigitalTwinScenario {
  id: string;
  name: string;
  description: string;
  salaryDelayDays: number;
  rentHikePercent: number;
  equityMarketShockPercent: number; // e.g. -15 for 15% drop
  lumpSumExpenseAmount: number; // e.g. 150000 emergency dental or travel
  prepayDebtAmount: number;
}

export interface DigitalTwinDayProjection {
  dayIndex: number;
  date: string;
  baselineBalance: number;
  stressedBalance: number;
  isDeficit: boolean;
  stressFactorNote?: string;
}

export interface DigitalTwinResult {
  scenarioId: string;
  scenarioName: string;
  baselineMinBalance: number;
  stressedMinBalance: number;
  firstDeficitDay?: string;
  lasMarginCallTriggered: boolean;
  requiredEmergencyBuffer: number;
  projections: DigitalTwinDayProjection[];
  actionableInsights: string[];
}
