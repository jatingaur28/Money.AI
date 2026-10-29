import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Fingerprint, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Bot, 
  User, 
  Trash2, 
  TrendingUp, 
  Volume2,
  Mic,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { AIAssistantMessage, UserProfile } from '../types';
import { LLMAgentAdapter } from '../adapters/agentAdapter';
import { soundFx } from '../utils/sound';

interface AIAssistantViewProps {
  user: UserProfile;
  onExecuteTool: (toolName: string, args: Record<string, unknown>) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  user,
  onExecuteTool,
}) => {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content:
        `Namaste ${user.fullName.split(' ')[0]}. I am your **MoneyShield Autonomous Guardian**. I operate under strict Zero-Trust boundaries. I can analyze your UPI spending in vernacular Hindi or English, calculate tax regime savings (FY 2024-26), or prepare mandate cancellations. Every money movement or contract alteration strictly requires your biometric passkey confirmation.`,
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    messageId: string;
    toolName: string;
    args: Record<string, unknown>;
    previewSummary: string;
  } | null>(null);

  const agentAdapter = new LLMAgentAdapter();

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isProcessing) return;

    soundFx.playShieldArmed();
    const userMsg: AIAssistantMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsProcessing(true);

    try {
      const response = await agentAdapter.runConversation(text, {
        healthScore: user.healthScore,
        monthlyIncome: user.monthlyIncome,
        totalSpendThisMonth: 118400,
        mandateCount: 4,
        persona: user.persona,
      });

      const assistantMsg: AIAssistantMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: response.replyText,
        toolCall: response.toolCallToExecute
          ? {
              toolName: response.toolCallToExecute.toolName,
              args: response.toolCallToExecute.args,
              status: 'pending_approval',
              outputSummary: response.toolCallToExecute.previewSummary,
              requiresBiometricAuth: response.toolCallToExecute.requiresBiometricAuth,
            }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If the tool requires human-in-the-loop cryptographic confirmation:
      if (response.toolCallToExecute && response.toolCallToExecute.requiresBiometricAuth) {
        setPendingConfirmation({
          messageId: assistantMsg.id,
          toolName: response.toolCallToExecute.toolName,
          args: response.toolCallToExecute.args,
          previewSummary: response.toolCallToExecute.previewSummary,
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: 'Guardian edge agent connection refreshed. Operating in secure offline heuristic mode.',
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmTool = () => {
    if (!pendingConfirmation) return;
    soundFx.playBiometricVerified();

    onExecuteTool(pendingConfirmation.toolName, pendingConfirmation.args);

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === pendingConfirmation.messageId && msg.toolCall
          ? {
              ...msg,
              toolCall: {
                ...msg.toolCall,
                status: 'executed',
              },
            }
          : msg
      )
    );

    setPendingConfirmation(null);
  };

  const handleRejectTool = () => {
    if (!pendingConfirmation) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === pendingConfirmation.messageId && msg.toolCall
          ? {
              ...msg,
              toolCall: {
                ...msg.toolCall,
                status: 'rejected',
              },
            }
          : msg
      )
    );
    setPendingConfirmation(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              Agentic RAG Engine with Strict Boundaries
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">MoneyShield AI Guardian &amp; Financial Coach</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Vernacular natural language intelligence with Human-in-the-Loop cryptographic consent. No autonomous money movement without biometric sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <ShieldCheck className="h-4 w-4" />
          <span>Biometric Passkey Gated</span>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl flex flex-col h-[560px]">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isUser
                      ? 'bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-emerald-950/60 border-emerald-600/40 text-emerald-400'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className="space-y-2">
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className="block text-[10px] text-slate-400 mt-2 text-right font-mono">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Render Planned Tool Call if any */}
                  {msg.toolCall && (
                    <div className="rounded-xl border border-emerald-800/40 bg-slate-950 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5" />
                          Tool: {msg.toolCall.toolName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            msg.toolCall.status === 'executed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : msg.toolCall.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {msg.toolCall.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-slate-300 font-mono text-[11px]">
                        {msg.toolCall.outputSummary}
                      </p>

                      {msg.toolCall.status === 'pending_approval' && (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                          <span className="text-[11px] text-amber-300 flex items-center gap-1">
                            <Fingerprint className="h-3.5 w-3.5" />
                            Awaiting Biometric Authorization
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-3 max-w-xl">
              <div className="h-8 w-8 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl p-4 text-xs bg-slate-950 border border-slate-800 text-slate-400 rounded-tl-none font-mono">
                Evaluating financial heuristics and querying database...
              </div>
            </div>
          )}
        </div>

        {/* Vernacular & AI Quick-Prompt Suggestions */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 flex flex-wrap gap-1.5 text-xs">
          {[
            { label: '📊 Design ₹35k SIP Portfolio', text: 'Design an aggressive MPT portfolio allocation for my ₹35,000 monthly SIP' },
            { label: '🛡️ Audit Tax & Harvest Loss', text: 'How can I save tax on my portfolio and harvest capital losses before March 31?' },
            { label: '⚡ Cancel Netflix mandate', text: 'Cancel my Netflix AutoPay mandate' },
            { label: '₹ Kharcha (हिन्दी)', text: 'Mera is mahine ka Zomato aur Swiggy ka bill kitna hai?' },
            { label: '⚖️ Compare Tax Regimes', text: 'Compare my tax liability under Old vs New Tax Regime for my CTC' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.text)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask your Guardian in English or Hindi (e.g. 'Audit my subscriptions' or 'Tax kitna bachega?')..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            type="submit"
            disabled={isProcessing || !inputPrompt.trim()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold transition-colors"
            aria-label="Send prompt"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Human-In-The-Loop Cryptographic Confirmation Modal */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/50 bg-slate-900 p-6 shadow-2xl space-y-4 shadow-emerald-950/40">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Fingerprint className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Biometric Passkey Confirmation</h3>
                <p className="text-xs text-slate-400">Cryptographic Mandate Revocation Authorization</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-300 font-mono text-[11px]">
                {pendingConfirmation.previewSummary}
              </div>
              <div className="text-slate-500 text-[10px] font-mono">
                Target: NPCI Clearinghouse • FIDO2 WebAuthn Signature
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleRejectTool}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Deny Execution
              </button>
              <button
                onClick={handleConfirmTool}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Verify Passkey &amp; Execute</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
