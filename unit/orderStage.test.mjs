// Component/unit — PH-CMP-001: orderStage status map (pure module in the product repo).
// Runs with Node's built-in test runner (node --test) importing the real module directly,
// so no Vitest/RTL install and no mutation of the product repo. Point MAIN_REPO at the checkout.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MAIN_REPO = process.env.MAIN_REPO || path.resolve('Swasthx_HIP_Frontend');
const mod = await import(pathToFileURL(path.join(MAIN_REPO, 'src/pages/Pharmacy/components/Queue/orderStage.js')).href);
const { STAGE, STAGE_META, deriveStage, isPaid, isInboxStage, isFulfilmentStage } = mod;

test('deriveStage: terminal/fulfilment statuses win over payment + hold', () => {
  assert.equal(deriveStage({ status: 'CANCELLED' }), STAGE.CANCELLED);
  assert.equal(deriveStage({ status: 'UNCOLLECTED' }), STAGE.UNCOLLECTED);
  assert.equal(deriveStage({ status: 'DELIVERED' }), STAGE.DELIVERED);
  assert.equal(deriveStage({ status: 'READY' }), STAGE.READY);
  assert.equal(deriveStage({ status: 'PREPARING' }), STAGE.IN_PROGRESS);
  // fulfilment status beats onHold + unpaid
  assert.equal(deriveStage({ status: 'READY', onHold: true, paymentStatus: 'PENDING' }), STAGE.READY);
});

test('deriveStage: inbox orders route hold → payment', () => {
  assert.equal(deriveStage({ status: 'PENDING', onHold: true }), STAGE.HOLD);
  assert.equal(deriveStage({ status: 'CONFIRMED', paymentStatus: 'PAID' }), STAGE.PAYMENT_CONFIRMED);
  assert.equal(deriveStage({ status: 'CONFIRMED', paymentStatus: 'OVERRIDDEN' }), STAGE.PAYMENT_CONFIRMED);
  assert.equal(deriveStage({ status: 'PENDING', paymentStatus: 'PENDING' }), STAGE.PAYMENT_PENDING);
});

test('deriveStage: unknown / missing status falls back to a payment inbox stage (safe default)', () => {
  assert.equal(deriveStage({ status: 'WAT', paymentStatus: 'PAID' }), STAGE.PAYMENT_CONFIRMED);
  assert.equal(deriveStage({}), STAGE.PAYMENT_PENDING);
  assert.equal(deriveStage(undefined), STAGE.PAYMENT_PENDING);
});

test('isPaid: PAID or OVERRIDDEN only', () => {
  assert.equal(isPaid({ paymentStatus: 'PAID' }), true);
  assert.equal(isPaid({ paymentStatus: 'OVERRIDDEN' }), true);
  assert.equal(isPaid({ paymentStatus: 'PENDING' }), false);
  assert.equal(isPaid({ paymentStatus: 'REFUNDED' }), false);
  assert.equal(isPaid(undefined), false);
});

test('STAGE_META: every stage has a label + tone, and labels match the queue tabs', () => {
  for (const s of Object.values(STAGE)) {
    assert.ok(STAGE_META[s], `missing STAGE_META for ${s}`);
    assert.ok(STAGE_META[s].label && STAGE_META[s].tone, `incomplete meta for ${s}`);
  }
  assert.equal(STAGE_META[STAGE.PAYMENT_CONFIRMED].label, 'Payment Confirmed');
  assert.equal(STAGE_META[STAGE.DELIVERED].label, 'Order Delivered');
});

test('inbox vs fulfilment partition is total and disjoint', () => {
  for (const s of Object.values(STAGE)) {
    assert.equal(isInboxStage(s), !isFulfilmentStage(s), `partition broken for ${s}`);
  }
  assert.equal(isInboxStage(STAGE.PAYMENT_PENDING), true);
  assert.equal(isInboxStage(STAGE.DELIVERED), false);
});
