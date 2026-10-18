import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PARTNER_SETTINGS as S,
  commissionCents,
  contributionProfitCents,
  decideCommissionStatus,
  earnsCash,
  estimatedProcessingFeeCents,
  netCollectedCents,
  referralCreditCents,
  referralOldEnough,
  reversalDeltaCents,
  sharedCostPerMemberCents,
  splitSponsored,
} from './math'

test('referral credit is $33 per active referral, up to three', () => {
  assert.equal(referralCreditCents(0, 9900, S), 0)
  assert.equal(referralCreditCents(1, 9900, S), 3300)
  assert.equal(referralCreditCents(2, 9900, S), 6600)
  assert.equal(referralCreditCents(3, 9900, S), 9900)
  assert.equal(referralCreditCents(7, 9900, S), 9900)
})

test('referral credit never exceeds the bill', () => {
  assert.equal(referralCreditCents(3, 5000, S), 5000)
  assert.equal(referralCreditCents(3, 0, S), 0)
})

test('first three active referrals fill credit slots, the rest earn cash', () => {
  assert.equal(earnsCash(0, S), false)
  assert.equal(earnsCash(2, S), false)
  assert.equal(earnsCash(3, S), true)
  assert.equal(earnsCash(10, S), true)
})

test('20% of a $99 bill is $19.80', () => {
  assert.equal(commissionCents(netCollectedCents(9900), S.referral_rate), 1980)
  assert.equal(commissionCents(netCollectedCents(14900), S.referral_rate), 2980)
})

test('net collected excludes tax', () => {
  assert.equal(netCollectedCents(9900, 900), 9000)
  assert.equal(netCollectedCents(100, 900), 0)
})

test('sponsored commission is half cash until ad spend is recovered', () => {
  assert.deepEqual(splitSponsored(1980, 50000, S), { cash: 990, recovery: 990 })
  assert.deepEqual(splitSponsored(1980, 400, S), { cash: 1580, recovery: 400 })
  assert.deepEqual(splitSponsored(1980, 0, S), { cash: 1980, recovery: 0 })
})

test('processing fee estimate is 3.49% + $0.49', () => {
  assert.equal(estimatedProcessingFeeCents(9900, S), 346 + 49)
  assert.equal(estimatedProcessingFeeCents(0, S), 0)
})

test('contribution profit subtracts every cost', () => {
  const c = contributionProfitCents({
    netCollectedCents: 9900,
    refundedCents: 0,
    chargebackCents: 0,
    referralCommissionCents: 1980,
    processingCents: 394,
    usageCostCents: 1200,
    sharedCostCents: 300,
    supportCents: 0,
    adRecoveryCents: 0,
  })
  assert.equal(c, 6026)
})

test('commission waits out the refund window when profit clears the floor', () => {
  const paidAt = new Date('2026-10-01T00:00:00Z')
  const d = decideCommissionStatus({ paidAt, netCents: 9900, totalCommissionCents: 1980, contributionCents: 6000, s: S })
  assert.equal(d.status, 'pending')
  assert.equal(d.holdUntil.toISOString(), '2026-10-31T00:00:00.000Z')
})

test('commission is held below the $40 floor', () => {
  const d = decideCommissionStatus({ paidAt: new Date(), netCents: 9900, totalCommissionCents: 1980, contributionCents: 3999, s: S })
  assert.equal(d.status, 'held')
  assert.equal(d.status === 'held' && d.reason, 'below_profit_floor')
})

test('commission is held above the maximum commission percentage', () => {
  const d = decideCommissionStatus({ paidAt: new Date(), netCents: 1000, totalCommissionCents: 500, contributionCents: 9000, s: S })
  assert.equal(d.status === 'held' && d.reason, 'over_max_commission')
})

test('minimum referral age', () => {
  const paidAt = new Date('2026-10-30T00:00:00Z')
  assert.equal(referralOldEnough(null, paidAt, S), true)
  const aged = { ...S, minimum_referral_age_days: 14 }
  assert.equal(referralOldEnough(new Date('2026-10-20T00:00:00Z'), paidAt, aged), false)
  assert.equal(referralOldEnough(new Date('2026-10-01T00:00:00Z'), paidAt, aged), true)
  assert.equal(referralOldEnough(null, paidAt, aged), false)
})

test('reversals are proportional and idempotent', () => {
  // Full refund of a $99 payment reverses the full $19.80
  assert.equal(reversalDeltaCents({ entryAmountCents: 1980, paymentAmountCents: 9900, totalReversedOnPaymentCents: 9900, alreadyReversedOnEntryCents: 0 }), 1980)
  // Half refund, then the rest
  assert.equal(reversalDeltaCents({ entryAmountCents: 1980, paymentAmountCents: 9900, totalReversedOnPaymentCents: 4950, alreadyReversedOnEntryCents: 0 }), 990)
  assert.equal(reversalDeltaCents({ entryAmountCents: 1980, paymentAmountCents: 9900, totalReversedOnPaymentCents: 9900, alreadyReversedOnEntryCents: 990 }), 990)
  // Replaying the same webhook reverses nothing more
  assert.equal(reversalDeltaCents({ entryAmountCents: 1980, paymentAmountCents: 9900, totalReversedOnPaymentCents: 9900, alreadyReversedOnEntryCents: 1980 }), 0)
  // Over-refund is capped at the payment
  assert.equal(reversalDeltaCents({ entryAmountCents: 1980, paymentAmountCents: 9900, totalReversedOnPaymentCents: 20000, alreadyReversedOnEntryCents: 0 }), 1980)
})

test('shared cost divides across paying members', () => {
  assert.equal(sharedCostPerMemberCents(10000, 4), 2500)
  assert.equal(sharedCostPerMemberCents(10000, 0), 10000)
  assert.equal(sharedCostPerMemberCents(0, 4), 0)
})
