import React, { useState } from 'react';
import { 
  Terminal, 
  Database, 
  Layers, 
  ShieldCheck, 
  Copy, 
  CheckCircle2, 
  X, 
  Code2, 
  Server, 
  Smartphone,
  Cpu
} from 'lucide-react';
import { soundFx } from '../utils/sound';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'MERMAID' | 'SCHEMA' | 'INIT_SCRIPT' | 'ADAPTERS' | 'COMPLIANCE'>('MERMAID');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    soundFx.playBiometricVerified();
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const mermaidDiagram = `graph TB
  subgraph Client_Enclave [Client Application & Edge Enclave]
    PWA[Next.js PWA / React SPA]
    RN[React Native Expo Mobile]
    WASM[Local Edge WASM ML & Regex Heuristics]
    WebAuthn[Biometric Passkey / Enclave]
    Store[CRDTs / Local Encrypted Storage AES-256]
  end

  subgraph API_Edge [Zero-Trust API Gateway & Orchestration]
    tRPC[tRPC / REST Typed Gateway]
    AuthGuard[DPDP Consent & RBAC Guard]
    Queue[Background Job Queue - Inngest/Upstash]
  end

  subgraph AI_Mesh [Autonomous Financial Guardian Mesh]
    Gemini[Gemini 2.5 Flash / Interactions API]
    RAG[LangChain RAG Pipeline]
    pgvector[(pgvector Semantic Transaction Embeddings)]
    HumanInLoop{Cryptographic User Passkey Confirmation}
  end

  subgraph External_Adapters [Pluggable Adapter Interface Layer]
    AA_Adapter[IBankingAdapter: Setu / OneMoney Account Aggregator]
    Threat_Adapter[IThreatIntelAdapter: Sandboxed Detonator & VirusTotal]
    NPCI_Adapter[UPI 2.0 AutoPay & e-NACH Clearinghouse Adapter]
    Cyber1930[National Cyber Crime 1930 Integration]
  end

  PWA --> WASM
  RN --> WASM
  PWA --> WebAuthn
  PWA --> tRPC
  RN --> tRPC
  tRPC --> AuthGuard
  AuthGuard --> Queue

  tRPC --> Gemini
  Gemini --> RAG
  RAG --> pgvector
  Gemini --> HumanInLoop
  HumanInLoop -- User Approves via Passkey --> NPCI_Adapter

  tRPC --> AA_Adapter
  tRPC --> Threat_Adapter
  tRPC --> Cyber1930`;

  const initCommands = `# ==============================================================================
# MONEYSHIELD OS — ENTERPRISE MONOREPO INITIALIZATION SCRIPT
# Scaffolding Turborepo + Next.js App Router + React Native Expo + Supabase + Drizzle
# ==============================================================================

# 1. Initialize Turborepo Monorepo Root
npx create-turbo@latest moneyshield-os --package-manager npm
cd moneyshield-os

# 2. Scaffold Next.js Web App (apps/web)
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir

# 3. Scaffold Expo React Native Mobile App (apps/mobile)
npx create-expo-app@latest apps/mobile -t tabs@52

# 4. Initialize Shared Packages (packages/core-finance, packages/threat-intel, packages/db)
mkdir -p packages/core-finance/src packages/threat-intel/src packages/db/src packages/ui/src

# 5. Install Core Dependencies in packages/db
npm install drizzle-orm pg postgres @types/pg --workspace=packages/db
npm install -D drizzle-kit tsx typescript --workspace=packages/db

# 6. Install AI & Encryption Dependencies in packages/ai-agent
npm install @google/genai langchain @langchain/community @langchain/core --workspace=packages/ai-agent

# 7. Setup Supabase Local Development & pgvector
npx supabase init
npx supabase start
npx supabase db branch create feature/moneyshield-vault

# 8. Run Database Migrations
npx drizzle-kit push`;

  const drizzleSchema = `// packages/db/src/schema.ts
import { pgTable, text, timestamp, integer, boolean, numeric, uuid, jsonb, vector } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  persona: text('persona').$type<'salaried' | 'freelancer' | 'student' | 'smb'>().default('salaried'),
  panMasked: text('pan_masked'),
  hasPasskey: boolean('has_passkey').default(false),
  monthlyIncome: numeric('monthly_income', { precision: 12, scale: 2 }).notNull(),
  healthScore: integer('health_score').default(700),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  merchantName: text('merchant_name').notNull(),
  merchantVpa: text('merchant_vpa'),
  category: text('category').notNull(),
  type: text('type').$type<'upi' | 'card' | 'netbanking' | 'neft_rtgs'>().notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  isDebit: boolean('is_debit').notNull(),
  taxTag: text('tax_tag').$type<'80C' | '80D' | '80E' | '44ADA_Business' | 'Standard_Deduction'>(),
  anomalyWarning: text('anomaly_warning'),
  embedding: vector('embedding', { dimensions: 768 }), // pgvector for semantic search
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const autopayMandates = pgTable('autopay_mandates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  serviceName: text('service_name').notNull(),
  merchantVpa: text('merchant_vpa').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: text('frequency').notNull(),
  nextBillingDate: timestamp('next_billing_date').notNull(),
  mandateType: text('mandate_type').$type<'UPI_AUTOPAY' | 'E_NACH' | 'CREDIT_CARD'>().notNull(),
  status: text('status').$type<'ACTIVE' | 'FLAGGED' | 'REVOKED' | 'PAUSED'>().default('ACTIVE'),
  riskScore: integer('risk_score').default(0),
  darkPatternsDetected: jsonb('dark_patterns_detected').default([]),
  cancellationDifficulty: text('cancellation_difficulty').default('MODERATE'),
  cancellationDeepLink: text('cancellation_deep_link'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const threatSignatures = pgTable('threat_signatures', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(),
  severity: text('severity').$type<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO'>().notNull(),
  rawPayload: text('raw_payload').notNull(),
  riskScore: integer('risk_score').notNull(),
  indicators: jsonb('indicators').default([]),
  isContained: boolean('is_contained').default(false),
  source: text('source').default('FEDERATED_FEED'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const consentAuditLogs = pgTable('consent_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  purpose: text('purpose').notNull(),
  dataCategory: text('data_category').notNull(),
  grantedOn: timestamp('granted_on').defaultNow().notNull(),
  status: text('status').$type<'ACTIVE' | 'REVOKED'>().default('ACTIVE'),
  regulatoryBasis: text('regulatory_basis').default('DPDP_Act_2023_Sec_6'),
});`;

  const complianceChecklist = `INDIA FINTECH & CYBERSECURITY DEPLOYMENT CHECKLIST
================================================================================
1. RBI Account Aggregator (AA) Compliance:
   - Certified with NBFC-AA specifications (OneMoney, Setu, Finvu).
   - Dynamic consent artifact generation with fetch frequency caps.
   - Immediate consent revocation webhook listener implemented.

2. Digital Personal Data Protection (DPDP) Act 2023:
   - Plain-language notice in Schedule 8 Indian languages (Hindi, Tamil, Marathi, etc.).
   - Explicit opt-in consent; no pre-ticked checkboxes.
   - Right to Correction and Erasure (Right to be Forgotten) 1-click execution.
   - Dedicated Data Protection Officer (DPO) contact published in privacy policy.

3. RBI Digital Lending & Mandate Guidelines (DPSS):
   - Direct revocation of e-NACH / UPI 2.0 AutoPay mandates via clearinghouse.
   - Upfront disclosure of all processing fees, penalty APR, and cooling-off periods.
   - No unauthorized access to contacts, storage, or location in mobile apps.

4. Indian Cybercrime Coordination Centre (I4C) & CERT-In:
   - Automated reporting integration for 1930 Helpline and cybercrime.gov.in.
   - Mandatory 6-hour cybersecurity incident reporting to CERT-In.
   - Customer transaction logs preserved for minimum 5 years in ISO/IEC 27001 encrypted archives.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 shadow-emerald-950/20 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="MoneyShield Architecture & Specs"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">System Architecture &amp; Engineering Blueprint</h3>
              <p className="text-xs text-slate-400 font-mono">Turborepo • Drizzle ORM • pgvector • Gemini Tool-Calling • RBI Stack</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'MERMAID', label: 'Architecture Diagram (Mermaid)', icon: Layers },
            { id: 'INIT_SCRIPT', label: 'Monorepo Init Commands', icon: Terminal },
            { id: 'SCHEMA', label: 'Drizzle Postgres Schema', icon: Database },
            { id: 'COMPLIANCE', label: 'India Fintech Compliance', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="relative">
          {activeTab === 'MERMAID' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Mermaid Architecture Flowchart:</span>
                <button
                  onClick={() => handleCopy(mermaidDiagram, 'mermaid')}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copiedKey === 'mermaid' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'mermaid' ? 'Copied' : 'Copy Mermaid Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-96">
                {mermaidDiagram}
              </pre>
            </div>
          )}

          {activeTab === 'INIT_SCRIPT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Scaffolding Script for Turborepo, Next.js, Expo, &amp; Supabase:</span>
                <button
                  onClick={() => handleCopy(initCommands, 'init')}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copiedKey === 'init' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'init' ? 'Copied' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96">
                {initCommands}
              </pre>
            </div>
          )}

          {activeTab === 'SCHEMA' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Drizzle PostgreSQL Schema with pgvector &amp; DPDP Audit:</span>
                <button
                  onClick={() => handleCopy(drizzleSchema, 'schema')}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copiedKey === 'schema' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'schema' ? 'Copied' : 'Copy Schema'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-96">
                {drizzleSchema}
              </pre>
            </div>
          )}

          {activeTab === 'COMPLIANCE' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>RBI, DPDP Act 2023, &amp; I4C Cybercrime Requirements:</span>
                <button
                  onClick={() => handleCopy(complianceChecklist, 'compliance')}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copiedKey === 'compliance' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'compliance' ? 'Copied' : 'Copy Checklist'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96">
                {complianceChecklist}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
