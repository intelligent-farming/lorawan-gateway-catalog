// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

'use strict';

// Recompute the `expected` output of every render.json fixture from the current
// template + region channel plan, and write it back (default), or verify it is
// up to date and exit non-zero on drift (`--check`). The config analog of the
// codec repo's compute-provides.js. Suitable for CI as `npm run validate:check`.
//
// Usage:
//   node scripts/validate-fixtures.js           # rewrite render.json expected
//   node scripts/validate-fixtures.js --check    # fail if any expected is stale

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const GATEWAYS_DIR = path.join(REPO_ROOT, 'gateways');

// Require the built library. `npm run validate` implies a build has run.
let gc;
try {
  gc = require(path.join(REPO_ROOT, 'dist', 'index.js'));
} catch (e) {
  console.error('validate-fixtures: dist/ not built — run `npm run build` first.');
  process.exit(1);
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listProfiles() {
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

function main() {
  const check = process.argv.includes('--check');
  const profiles = listProfiles();
  let drift = 0;
  let written = 0;
  let fixtures = 0;

  for (const { vendor, model, dir } of profiles) {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'gateway.json'), 'utf8'));
    if (meta.draft) continue;
    const fxPath = path.join(dir, 'render.json');
    if (!fs.existsSync(fxPath)) {
      console.error(`validate-fixtures: ${vendor}/${model} has no render.json`);
      drift += 1;
      continue;
    }
    const doc = JSON.parse(fs.readFileSync(fxPath, 'utf8'));
    let changed = false;
    for (const fx of doc.fixtures || []) {
      fixtures += 1;
      const out = gc.configScript(vendor, model, {
        forwarder: fx.forwarder,
        region: fx.region,
        connection: fx.connection,
      });
      if (fx.expected !== out) {
        if (check) {
          console.error(`DRIFT ${vendor}/${model} ${fx.forwarder}/${fx.region}`);
          drift += 1;
        } else {
          fx.expected = out;
          changed = true;
        }
      }
    }
    if (changed) {
      fs.writeFileSync(fxPath, `${JSON.stringify(doc, null, 2)}\n`);
      written += 1;
    }
  }

  if (check) {
    if (drift > 0) {
      console.error(`validate-fixtures: ${drift} stale/missing fixture(s). Run \`npm run validate\`.`);
      process.exit(1);
    }
    console.log(`validate-fixtures: ${fixtures} fixture(s) across ${profiles.length} profile(s) are current.`);
  } else {
    console.log(`validate-fixtures: recomputed ${fixtures} fixture(s); updated ${written} render.json file(s).`);
  }
}

main();
