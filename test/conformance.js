// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

'use strict';

// Dynamic conformance harness. Walks gateways/<vendor>/<model>/ at load and
// emits a describe() per profile, so adding a folder is automatically tested
// with no registration file. See lorawan-gateway-catalog-plan.md, the
// "Conformance test suite" section, for the per-profile and suite-level rules.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const gc = require('../dist/index.js');

const _ajv = require('ajv/dist/2020');
const Ajv2020 = _ajv.default || _ajv;
const _af = require('ajv-formats');
const addFormats = _af.default || _af;

const GATEWAYS_DIR = path.join(__dirname, '..', 'gateways');
const DEFINITIONS_DIR = path.join(__dirname, '..', 'definitions');

const gatewaySchema = JSON.parse(
  fs.readFileSync(path.join(DEFINITIONS_DIR, 'gateway.schema.json'), 'utf8'),
);
const configMethodsDoc = JSON.parse(
  fs.readFileSync(path.join(DEFINITIONS_DIR, 'config-methods.json'), 'utf8'),
);
const KNOWN_CONFIG_METHODS = new Set(Object.keys(configMethodsDoc.configMethods));
const KNOWN_FORWARDERS = new Set(Object.keys(configMethodsDoc.packetForwarders));
const KNOWN_REGIONS = new Set(gc.regions().map((r) => r.id));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateGateway = ajv.compile(gatewaySchema);

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/** Enumerate every gateways/<vendor>/<model>/ folder containing gateway.json. */
function listGateways() {
  const out = [];
  if (!isDir(GATEWAYS_DIR)) return out;
  for (const vendor of fs.readdirSync(GATEWAYS_DIR).sort()) {
    const vdir = path.join(GATEWAYS_DIR, vendor);
    if (!isDir(vdir)) continue;
    for (const model of fs.readdirSync(vdir).sort()) {
      const dir = path.join(vdir, model);
      if (isDir(dir) && fs.existsSync(path.join(dir, 'gateway.json'))) {
        out.push({ vendor, model, dir });
      }
    }
  }
  return out;
}

/** Register a test skipped (not failed) for draft profiles. */
function itUnlessDraft(name, isDraft, fn) {
  if (isDraft) it(name, { skip: 'draft — profile not yet authored' }, fn);
  else it(name, fn);
}

const PROFILES = listGateways();

for (const { vendor, model, dir } of PROFILES) {
  describe(`${vendor}/${model}`, () => {
    let meta = null;
    let metaError = null;
    try {
      meta = JSON.parse(fs.readFileSync(path.join(dir, 'gateway.json'), 'utf8'));
    } catch (e) {
      metaError = e;
    }
    const isDraft = !!(meta && meta.draft);

    // 1. gateway.json parses, validates against schema, matches folder names.
    it('gateway.json parses, validates, and matches the folder', () => {
      assert.equal(metaError, null, `gateway.json did not parse: ${metaError}`);
      const ok = validateGateway(meta);
      assert.ok(ok, `schema errors: ${JSON.stringify(validateGateway.errors)}`);
      assert.equal(meta.vendor, vendor, 'gateway.json vendor must match folder');
      assert.equal(meta.model, model, 'gateway.json model must match folder');
    });

    // 2. Every declared region exists.
    it('declares only known regions', () => {
      assert.ok(meta, 'gateway.json required');
      for (const r of meta.regions) {
        assert.ok(KNOWN_REGIONS.has(r), `declared region "${r}" does not exist`);
      }
    });

    // 3. Config methods / forwarders known; each forwarder has a template file.
    it('config methods and packet-forwarder templates are consistent', () => {
      assert.ok(meta, 'gateway.json required');
      for (const cm of meta.configMethods) {
        assert.ok(KNOWN_CONFIG_METHODS.has(cm), `unknown config method "${cm}"`);
      }
      for (const pf of meta.packetForwarders) {
        assert.ok(KNOWN_FORWARDERS.has(pf), `unknown packet forwarder "${pf}"`);
        const entry = meta.config && meta.config[pf];
        assert.ok(entry && entry.template, `config.${pf}.template missing`);
        const tmplPath = path.join(dir, entry.template);
        assert.ok(fs.existsSync(tmplPath), `template file missing: ${entry.template}`);
      }
    });

    // 3b. Templates are token-clean against the declared forwarder token set.
    itUnlessDraft('templates use only legal tokens', isDraft, () => {
      for (const pf of meta.packetForwarders) {
        const text = gc.templateText(vendor, model, pf);
        const lint = gc.lintConfig(text, { forwarder: pf });
        assert.deepEqual(
          lint.issues.filter((i) => i.rule === 'unknown-token' || i.rule === 'malformed-token'),
          [],
          `${pf} template token issues: ${JSON.stringify(lint.issues)}`,
        );
      }
    });

    // 4. Each template renders cleanly for each declared region.
    itUnlessDraft('renders cleanly for each declared region × forwarder', isDraft, () => {
      for (const pf of meta.packetForwarders) {
        for (const rId of meta.regions) {
          const connection = {
            serverAddress: 'chirpstack.example.com',
            gatewayEui: 'AC1F09FFFE0000FF',
          };
          const out = gc.configScript(vendor, model, { forwarder: pf, region: rId, connection });
          assert.ok(!/\{\{[^}]*\}\}/.test(out), `${pf}/${rId}: leftover token`);
          const vr = gc.validateConfig(out, { forwarder: pf });
          assert.ok(vr.valid, `${pf}/${rId}: validateConfig failed: ${JSON.stringify(vr.issues)}`);
        }
      }
    });

    // 5. render.json fixtures: exact output + coverage of every declared pair.
    itUnlessDraft('render.json fixtures match exactly and cover every pair', isDraft, () => {
      const fixturesPath = path.join(dir, 'render.json');
      assert.ok(fs.existsSync(fixturesPath), 'render.json is required for an authored profile');
      const doc = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
      const fixtures = doc.fixtures || [];
      assert.ok(fixtures.length > 0, 'render.json must have >=1 fixture');

      const covered = new Set();
      for (const fx of fixtures) {
        assert.ok(meta.packetForwarders.includes(fx.forwarder), `fixture forwarder "${fx.forwarder}" not declared`);
        assert.ok(meta.regions.includes(fx.region), `fixture region "${fx.region}" not declared`);
        assert.equal(typeof fx.expected, 'string', 'fixture.expected must be a string');
        assert.ok(fx.expected.length > 0, 'fixture.expected must be non-empty (run `npm run validate`)');
        const out = gc.configScript(vendor, model, {
          forwarder: fx.forwarder,
          region: fx.region,
          connection: fx.connection,
        });
        assert.equal(out, fx.expected, `fixture ${fx.forwarder}/${fx.region} drifted (run \`npm run validate\`)`);
        covered.add(`${fx.forwarder}/${fx.region}`);
      }
      for (const pf of meta.packetForwarders) {
        for (const rId of meta.regions) {
          assert.ok(covered.has(`${pf}/${rId}`), `no render.json fixture for ${pf}/${rId}`);
        }
      }
    });

    // 6. Admin facts, credentials, and provenance + reference snapshot.
    it('admin facts, credentials, and provenance are complete', () => {
      assert.ok(meta, 'gateway.json required');
      const url = meta.admin.defaultUrl;
      const looksLikeUrlOrIp =
        /^https?:\/\//.test(url) || /^\d{1,3}(\.\d{1,3}){3}$/.test(url) || /^[a-z]/.test(url);
      assert.ok(looksLikeUrlOrIp, `admin.defaultUrl "${url}" is not a URL or IP`);

      if (meta.admin.defaultCredentials === null) {
        assert.ok(meta.admin.credentialsNote, 'null credentials require a credentialsNote');
      } else {
        assert.ok(meta.admin.defaultCredentials.username !== undefined, 'credentials need a username');
        assert.ok(meta.admin.defaultCredentials.password !== undefined, 'credentials need a password');
      }

      assert.match(meta.provenance.sha256, /^[0-9a-f]{64}$/, 'provenance.sha256 must be a sha256');
      assert.match(meta.provenance.referencedAt, /^\d{4}-\d{2}-\d{2}$/, 'provenance.referencedAt must be a date');

      // A reference/ snapshot must exist whose sha256 equals provenance.sha256.
      const refDir = path.join(dir, 'reference');
      assert.ok(isDir(refDir), 'reference/ snapshot directory is required');
      const shas = fs
        .readdirSync(refDir)
        .filter((n) => fs.statSync(path.join(refDir, n)).isFile())
        .map((n) => sha256(fs.readFileSync(path.join(refDir, n))));
      assert.ok(
        shas.includes(meta.provenance.sha256),
        `no reference/ file matches provenance.sha256 (${meta.provenance.sha256}); found ${JSON.stringify(shas)}`,
      );
    });

    // 7. Walkthrough present, non-empty, names the model.
    it('walkthrough.md is present, non-empty, and names the model', () => {
      const wt = path.join(dir, 'walkthrough.md');
      assert.ok(fs.existsSync(wt), 'walkthrough.md is required');
      const text = fs.readFileSync(wt, 'utf8');
      assert.ok(text.trim().length > 0, 'walkthrough.md must be non-empty');
      assert.ok(new RegExp(model, 'i').test(text), 'walkthrough.md must name the model');
    });

    // 8. Draft handling.
    it('draft handling holds', () => {
      assert.ok(meta, 'gateway.json required');
      if (isDraft) {
        assert.ok(
          !gc.gateways().some((g) => g.vendor === vendor && g.model === model),
          'draft must be hidden from gateways()',
        );
        assert.throws(
          () =>
            gc.configScript(vendor, model, {
              forwarder: meta.packetForwarders[0],
              region: meta.regions[0],
              connection: { serverAddress: 'x', gatewayEui: 'AC1F09FFFE0000FF' },
            }),
          /draft/,
        );
      } else {
        assert.ok(
          gc.gateways().some((g) => g.vendor === vendor && g.model === model),
          'authored profile must appear in gateways()',
        );
      }
    });
  });
}

describe('suite-level', () => {
  it('gateway.schema.json compiles under ajv 2020-12', () => {
    const a = new Ajv2020({ allErrors: true, strict: false });
    addFormats(a);
    assert.doesNotThrow(() => a.compile(gatewaySchema));
  });

  it('every region referenced by a gateway exists', () => {
    for (const g of gc.gateways({ includeDrafts: true })) {
      for (const r of g.regions) {
        assert.ok(KNOWN_REGIONS.has(r), `${g.vendor}/${g.model} references unknown region ${r}`);
      }
    }
  });

  it('no case-insensitive folder collisions', () => {
    const seen = new Map();
    for (const { vendor, model } of PROFILES) {
      const k = `${vendor}/${model}`.toLowerCase();
      assert.ok(!seen.has(k), `folder collision: ${k} vs ${seen.get(k)}`);
      seen.set(k, `${vendor}/${model}`);
    }
  });

  it('OUI prefixes resolve to a single vendor each (detection is unambiguous)', (t) => {
    // Warn (do not fail) when one OUI prefix maps to models of >1 vendor.
    const byOui = new Map();
    for (const g of gc.gateways({ includeDrafts: true })) {
      for (const o of g.oui) {
        const key = o.toUpperCase();
        if (!byOui.has(key)) byOui.set(key, new Set());
        byOui.get(key).add(g.vendor);
      }
    }
    for (const [oui, vendors] of byOui) {
      if (vendors.size > 1) {
        t.diagnostic(`OUI ${oui} is claimed by multiple vendors: ${[...vendors].join(', ')}`);
      }
    }
    assert.ok(byOui.size > 0, 'at least one profile must declare an OUI');
  });

  it('at least one authored profile exists', () => {
    assert.ok(gc.gateways().length > 0, 'no authored gateway profiles found');
  });
});
