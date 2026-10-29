import test from 'node:test';
import assert from 'node:assert/strict';
import { detectHomographAttack, analyzeUpiVpa, scoreSmsPayload } from './fraudDetection';

test('Homograph Detector: Catches Cyrillic character spoof in domain', () => {
  // 'paytm' with Cyrillic 'а' (\u0430)
  const spoofedDomain = 'pаytm-kyc.com';
  const result = detectHomographAttack(spoofedDomain);
  assert.equal(result.hasHomograph, true);
  assert.ok(result.offendingChars.length > 0);

  const cleanDomain = 'paytm.com';
  const cleanResult = detectHomographAttack(cleanDomain);
  assert.equal(cleanResult.hasHomograph, false);
});

test('UPI VPA Analyzer: Flags corporate refund impersonation handles', () => {
  const scamHandle = 'swiggy.refund.desk99@okhdfcbank';
  const analysis = analyzeUpiVpa(scamHandle);

  assert.equal(analysis.isSuspicious, true);
  assert.equal(analysis.threatLevel, 'CRITICAL');
  assert.ok(analysis.score >= 70);
  assert.ok(analysis.flags.some(f => f.includes('impersonation')));
});

test('SMS Scorer: Identifies electricity disconnection scam', () => {
  const scamMessage = 'Dear customer, your electricity power will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately contact power officer on 9876543210 or install http://bit.ly/quick-bill.apk';
  const analysis = scoreSmsPayload(scamMessage);

  assert.equal(analysis.isSuspicious, true);
  assert.equal(analysis.threatLevel, 'CRITICAL');
  assert.ok(analysis.score >= 80);
});

test('SMS Scorer: Benign OTP message scored clean', () => {
  const benignMessage = '184920 is your OTP to authenticate transaction at HDFC Bank NetBanking. Valid for 10 minutes. Do not share OTP with anyone.';
  const analysis = scoreSmsPayload(benignMessage);

  assert.equal(analysis.isSuspicious, false);
  assert.equal(analysis.threatLevel, 'CLEAN');
  assert.ok(analysis.score < 30);
});
