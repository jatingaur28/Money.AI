/**
 * MoneyShield OS — Banking & Account Aggregator (AA) & UPI 2.0 AutoPay Adapter
 * Conforms to RBI Master Direction – Information Technology Framework for the NBFC-Account Aggregator
 * and RBI Circular on Processing of e-mandates on cards/PPIs/UPI for recurring transactions.
 */

import { Transaction, AutoPayMandate, CreateMandateRequest, ModifyMandateRequest } from '../types';
import { generateNpciUmn, computeNextBillingDate } from '../utils/mandates';

export interface ConsentRequestParams {
  customerId: string;
  pan: string;
  fiTypes: ('DEPOSIT' | 'TERM_DEPOSIT' | 'RECURRING_DEPOSIT' | 'MUTUAL_FUNDS' | 'EQUITIES')[];
  consentStart: string;
  consentExpiry: string;
  fetchFrequency: 'ONCE' | 'DAILY' | 'REALTIME';
}

export interface ConsentResponse {
  consentHandle: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED';
  redirectUrl?: string;
  aaEntity: 'OneMoney' | 'Setu' | 'Finvu' | 'Anumati';
}

export interface FinancialAccountSummary {
  accountId: string;
  maskedAccNo: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'CREDIT_CARD' | 'EPF' | 'DEMAT';
  balance: number;
  currency: 'INR';
  lastSyncedAt: string;
}

export interface IBankingAdapter {
  initiateConsent(params: ConsentRequestParams): Promise<ConsentResponse>;
  checkConsentStatus(consentHandle: string): Promise<ConsentResponse>;
  revokeConsent(consentHandle: string): Promise<boolean>;
  getLinkedAccounts(): Promise<FinancialAccountSummary[]>;
  fetchStatements(accountId: string, fromDate: string, toDate: string): Promise<Transaction[]>;
  fetchAutoPayMandates(): Promise<AutoPayMandate[]>;
  createMandate(request: CreateMandateRequest): Promise<{ success: boolean; mandate: AutoPayMandate; umn: string }>;
  pauseMandate(mandateId: string, pausedUntil?: string): Promise<{ success: boolean; umn: string; pausedUntil?: string }>;
  resumeMandate(mandateId: string): Promise<{ success: boolean; umn: string }>;
  modifyMandate(mandateId: string, updates: ModifyMandateRequest): Promise<{ success: boolean; umn: string }>;
  cancelMandate(mandateId: string, userSignature: string): Promise<{ success: boolean; referenceNumber: string }>;
}

/**
 * MockBankingAdapter: High-fidelity simulator for Account Aggregator & UPI 2.0 AutoPay flows
 * Simulates network latency, NPCI Clearinghouse responses, and cryptographic UMN issuance.
 */
export class MockBankingAdapter implements IBankingAdapter {
  private consentStore = new Map<string, ConsentResponse>();

  async initiateConsent(params: ConsentRequestParams): Promise<ConsentResponse> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const handle = `AA-REQ-${Date.now().toString(36).toUpperCase()}`;
    const response: ConsentResponse = {
      consentHandle: handle,
      status: 'ACTIVE',
      aaEntity: 'Setu',
      redirectUrl: `https://aa-sandbox.setu.co/consent/${handle}`,
    };
    this.consentStore.set(handle, response);
    return response;
  }

  async checkConsentStatus(consentHandle: string): Promise<ConsentResponse> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.consentStore.get(consentHandle) || {
      consentHandle,
      status: 'REJECTED',
      aaEntity: 'Setu',
    };
  }

  async revokeConsent(consentHandle: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (this.consentStore.has(consentHandle)) {
      const entry = this.consentStore.get(consentHandle)!;
      entry.status = 'REVOKED';
      return true;
    }
    return true;
  }

  async getLinkedAccounts(): Promise<FinancialAccountSummary[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [
      {
        accountId: 'acc-hdfc-01',
        maskedAccNo: 'HDFC Bank •••• 4892',
        bankName: 'HDFC Bank',
        accountType: 'SAVINGS',
        balance: 142580,
        currency: 'INR',
        lastSyncedAt: new Date().toISOString(),
      },
      {
        accountId: 'acc-icici-02',
        maskedAccNo: 'ICICI Bank •••• 1034',
        bankName: 'ICICI Bank',
        accountType: 'CURRENT',
        balance: 84200,
        currency: 'INR',
        lastSyncedAt: new Date().toISOString(),
      },
    ];
  }

  async fetchStatements(_accountId: string, _fromDate: string, _toDate: string): Promise<Transaction[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [];
  }

  async fetchAutoPayMandates(): Promise<AutoPayMandate[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [];
  }

  /**
   * UPI 2.0: Create Mandate and register with NPCI clearinghouse
   */
  async createMandate(request: CreateMandateRequest): Promise<{ success: boolean; mandate: AutoPayMandate; umn: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const umn = generateNpciUmn(request.serviceName, 'HDFC');
    const nextDate = computeNextBillingDate(request.frequency);

    const mandate: AutoPayMandate = {
      id: `man-upi-${Date.now().toString(36)}`,
      serviceName: request.serviceName,
      logo: '⚡',
      merchantVpa: request.merchantVpa,
      payerVpa: request.payerVpa,
      amount: request.amount,
      maxCapAmount: request.maxCapAmount,
      frequency: request.frequency,
      nextBillingDate: nextDate,
      startDate: request.startDate,
      endDate: request.endDate,
      umn,
      mandateType: 'UPI_AUTOPAY',
      status: 'ACTIVE',
      riskScore: 10,
      category: request.category,
      darkPatternsDetected: [],
      cancellationDifficulty: 'EASY',
      cancellationDeepLink: 'https://moneyshield.internal/mandate/' + encodeURIComponent(umn),
      cancellationGuide: [
        'Open MoneyShield or UPI app (PhonePe/GPay)',
        'Select Mandate -> Tap Cancel / Revoke',
        'Authorized directly at NPCI level without merchant mediation',
      ],
      preDebitAlertHours: request.preDebitAlertHours || 24,
      history: [
        {
          id: `log-reg-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          amount: request.amount,
          status: 'SUCCESS',
          npciRefNumber: `NPCI-AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          note: 'Initial UPI 2.0 Mandate Creation & Registration Authenticated via AFA/Biometric',
        },
      ],
    };

    return {
      success: true,
      mandate,
      umn,
    };
  }

  /**
   * UPI 2.0: Pause Mandate at NPCI level
   */
  async pauseMandate(mandateId: string, pausedUntil?: string): Promise<{ success: boolean; umn: string; pausedUntil?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      umn: `UMN-2026-PAUSE-${mandateId.slice(-6).toUpperCase()}`,
      pausedUntil: pausedUntil || 'Until Resumed',
    };
  }

  /**
   * UPI 2.0: Resume Mandate at NPCI level
   */
  async resumeMandate(mandateId: string): Promise<{ success: boolean; umn: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      success: true,
      umn: `UMN-2026-RESUME-${mandateId.slice(-6).toUpperCase()}`,
    };
  }

  /**
   * UPI 2.0: Modify Mandate parameters (amount, cap, frequency) with AFA confirmation
   */
  async modifyMandate(mandateId: string, updates: ModifyMandateRequest): Promise<{ success: boolean; umn: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      success: true,
      umn: `UMN-2026-MOD-${mandateId.slice(-6).toUpperCase()}`,
    };
  }

  /**
   * UPI 2.0: Revoke Mandate directly at clearinghouse
   */
  async cancelMandate(mandateId: string, _userSignature: string): Promise<{ success: boolean; referenceNumber: string }> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return {
      success: true,
      referenceNumber: `RBI-URN-${Date.now().toString(36).toUpperCase()}-${mandateId.slice(-4)}`,
    };
  }
}
