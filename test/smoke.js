// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const gc = require('../dist/index.js');

// --- module + regions ---

test('module loads and exposes a version', () => {
  assert.equal(typeof gc.VERSION, 'string');
  assert.match(gc.VERSION, /^\d+\.\d+\.\d+/);
});

test('regions() lists the defined channel plans', () => {
  const ids = gc.regions().map((r) => r.id);
  assert.deepEqual([...ids].sort(), ids); // already sorted
  for (const id of ['EU868', 'US915', 'AS923', 'AU915', 'IN865']) {
    assert.ok(ids.includes(id), `missing region ${id}`);
  }
  const eu = gc.region('EU868');
  assert.equal(eu.band, 'EU868');
  assert.equal(eu.channelPlan.radios.length, 2);
  assert.equal(eu.channelPlan.multiSF.length, 8);
  assert.throws(() => gc.region('NOPE'), /unknown region/);
});

// --- renderConfig / renderRadioBlock (pure) ---

const SEMTECH_TMPL = [
  '{',
  '  "SX130x_conf": {',
  '    "lorawan_public": true,',
  '    "radio_0": { "enable": true, "freq": {{RADIO_0_FREQ}} },',
  '    "radio_1": { "enable": true, "freq": {{RADIO_1_FREQ}} },',
  '{{RADIO_BLOCK}}',
  '  },',
  '  "gateway_conf": {',
  '    "gateway_ID": "{{GATEWAY_EUI}}",',
  '    "server_address": "{{SERVER_ADDRESS}}",',
  '    "serv_port_up": {{SERVER_PORT_UP}},',
  '    "serv_port_down": {{SERVER_PORT_DOWN}}',
  '  }',
  '}',
  '',
].join('\n');

test('renderConfig substitutes tokens and yields valid JSON', () => {
  const params = gc.buildRenderParams('semtech-udp', gc.region('US915'), {
    serverAddress: 'chirpstack.local',
    gatewayEui: 'ac1f09fffe001234',
  });
  const out = gc.renderConfig(SEMTECH_TMPL, params);
  const doc = JSON.parse(out);
  assert.equal(doc.gateway_conf.server_address, 'chirpstack.local');
  assert.equal(doc.gateway_conf.gateway_ID, 'AC1F09FFFE001234'); // normalized upper
  assert.equal(doc.gateway_conf.serv_port_up, 1700);
  assert.equal(doc.SX130x_conf.radio_0.freq, 904300000);
  assert.equal(Object.keys(doc.SX130x_conf).filter((k) => k.startsWith('chan_multiSF')).length, 8);
});

test('renderConfig throws on an unfilled placeholder', () => {
  assert.throws(() => gc.renderConfig('a {{MISSING}} b', {}), /unfilled placeholder/);
});

test('renderRadioBlock disables unused slots and null wide channels', () => {
  const block = gc.renderRadioBlock(gc.region('IN865'));
  // IN865 has 3 multiSF channels; slots 3..7 disabled; no loraStd/fsk.
  assert.ok(block.includes('"chan_multiSF_0": { "enable": true'));
  assert.ok(block.includes('"chan_multiSF_3": { "enable": false }'));
  assert.ok(block.includes('"chan_Lora_std": { "enable": false }'));
  assert.ok(block.includes('"chan_FSK": { "enable": false }'));
  assert.ok(!block.trimEnd().endsWith(','), 'last line must have no trailing comma');
});

// --- validate / lint ---

test('validateConfig flags a broken semtech config and passes a good one', () => {
  const good = gc.renderConfig(
    SEMTECH_TMPL,
    gc.buildRenderParams('semtech-udp', gc.region('EU868'), {
      serverAddress: 'gw.local',
      gatewayEui: 'AC1F09FFFE00ABCD',
    }),
  );
  assert.equal(gc.validateConfig(good, { forwarder: 'semtech-udp' }).valid, true);

  const bad = good.replace('"server_address": "gw.local"', '"server_address": ""');
  const r = gc.validateConfig(bad, { forwarder: 'semtech-udp' });
  assert.equal(r.valid, false);
  assert.ok(r.issues.some((i) => i.rule === 'server-address'));
});

test('validateConfig checks a basics-station tc.uri', () => {
  const ok = gc.validateConfig('routerid ... tc.uri = wss://gw.local:3001', {
    forwarder: 'basics-station',
  });
  assert.equal(ok.valid, true);
  const missing = gc.validateConfig('no uri here', { forwarder: 'basics-station' });
  assert.ok(missing.issues.some((i) => i.rule === 'tc-uri'));
});

test('lintConfig flags unknown and malformed tokens', () => {
  assert.deepEqual(gc.lintConfig(SEMTECH_TMPL, { forwarder: 'semtech-udp' }).issues, []);
  const bad = gc.lintConfig('{{BOGUS_TOKEN}} {{ lower case }}', { forwarder: 'semtech-udp' });
  assert.ok(bad.issues.some((i) => i.rule === 'unknown-token'));
  assert.ok(bad.issues.some((i) => i.rule === 'malformed-token'));
});

// --- registry (the authored seed set) ---

test('gateways() enumerates the authored seed profiles (drafts hidden)', () => {
  const all = gc.gateways();
  assert.ok(all.length >= 9, `expected >= 9 authored profiles, got ${all.length}`);
  assert.ok(all.every((g) => !g.draft), 'gateways() must not return drafts');
  for (const g of all) {
    assert.equal(typeof g.name, 'string');
    assert.ok(Array.isArray(g.regions) && g.regions.length > 0);
    assert.ok(Array.isArray(g.packetForwarders) && g.packetForwarders.length > 0);
  }
});

test('gateway() looks up one profile case-insensitively', () => {
  const g = gc.gateway('RAKwireless'.toLowerCase(), 'RAK7268');
  assert.equal(g.vendor, 'rakwireless');
  assert.equal(g.model, 'rak7268');
  assert.throws(() => gc.gateway('nope', 'nope'), /unknown gateway/);
});

test('gatewaysSupporting() and filters work', () => {
  const bs = gc.gatewaysSupporting('basics-station');
  assert.ok(bs.every((g) => g.packetForwarders.includes('basics-station')));
  const us = gc.gateways({ region: 'US915' });
  assert.ok(us.every((g) => g.regions.includes('US915')));
  const rak = gc.gatewaysForVendor('rakwireless');
  assert.ok(rak.length >= 1 && rak.every((g) => g.vendor === 'rakwireless'));
});

test('configScript() returns paste-ready config text (the deliverable)', () => {
  const cfg = gc.configScript('rakwireless', 'rak7268', {
    forwarder: 'semtech-udp',
    region: 'US915',
    connection: { serverAddress: 'chirpstack.local', gatewayEui: 'AC1F09FFFE001234' },
  });
  const doc = JSON.parse(cfg);
  assert.equal(doc.gateway_conf.server_address, 'chirpstack.local');
  assert.equal(doc.gateway_conf.gateway_ID, 'AC1F09FFFE001234');
  assert.equal(gc.validateConfig(cfg, { forwarder: 'semtech-udp' }).valid, true);
});

test('configScript() rejects an unsupported forwarder/region', () => {
  assert.throws(
    () =>
      gc.configScript('rakwireless', 'rak7268', {
        forwarder: 'semtech-udp',
        region: 'ZZ999',
        connection: { serverAddress: 'x', gatewayEui: 'AC1F09FFFE001234' },
      }),
    /not authored for region/,
  );
});

test('walkthrough() returns non-empty guided steps', () => {
  const wt = gc.walkthrough('rakwireless', 'rak7268');
  assert.ok(wt.length > 0);
  assert.ok(/rak7268/i.test(wt));
});

// --- detection ---

test('detectGateway() resolves a Dragino EUI to the vendor + candidates', () => {
  const r = gc.detectGateway('A84041FFFE123456');
  assert.equal(r.vendor, 'dragino');
  assert.ok(r.candidates.length >= 1);
  assert.ok(r.candidates.every((c) => c.vendor === 'dragino'));
});

test('gatewaysForOui() is the pure layer (no EUI resolution needed)', () => {
  const r = gc.gatewaysForOui('AC1F09');
  assert.equal(r.vendor, 'rakwireless');
  assert.ok(r.candidates.some((c) => c.model === 'rak7268'));
});

test('detectGateway() returns empty candidates for an unregistered OUI', () => {
  const r = gc.detectGateway('FFFFFFFFFFFFFFFF');
  assert.deepEqual(r.candidates, []);
  assert.equal(r.vendor, null);
});

// --- provenance integrity (offline) ---

test('every authored profile has a matching reference snapshot', () => {
  const checks = gc.checkReferenceSnapshots();
  for (const c of checks) {
    assert.ok(c.ok, `${c.vendor}/${c.model}: reference snapshot sha256 mismatch (stored ${c.storedSha256}, snapshot ${c.snapshotSha256})`);
  }
});
