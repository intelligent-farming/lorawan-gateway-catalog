// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

'use strict';

// Scaffold a new gateway profile under gateways/<vendor>/<model>/.
//
// Usage:
//   npm run scaffold -- <vendor> <model> <region[,region]> \
//       [--forwarder semtech-udp,basics-station] [--from-url <doc-url>] [--draft]
//
// Creates the folder with:
//   - gateway.json seeded from the args (marked draft: true)
//   - stub config/*.tmpl.* files containing only {{PLACEHOLDER}} tokens, so the
//     conformance suite stays RED until the template is authored
//   - render.json seeded with sample connection params but NO expected output
//     (the author fills expected via `npm run validate` after authoring)
//   - a walkthrough.md stub
//   - when --from-url is given: a reference/ snapshot of the vendor doc page with
//     its sha256 recorded in provenance (otherwise provenance.sha256 is left
//     blank, which fails the schema until the author captures a real snapshot).

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');

const REPO_ROOT = path.join(__dirname, '..');
const GATEWAYS_DIR = path.join(REPO_ROOT, 'gateways');
const REGIONS_DIR = path.join(REPO_ROOT, 'definitions', 'regions');
const CONFIG_METHODS = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'definitions', 'config-methods.json'), 'utf8'),
);

function fail(message) {
  console.error(`scaffold: ${message}`);
  process.exit(1);
}

function knownRegions() {
  return fs
    .readdirSync(REGIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

function parseArgs(argv) {
  const positional = [];
  const opts = { forwarders: ['semtech-udp'], fromUrl: undefined, draft: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--forwarder') opts.forwarders = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--from-url') opts.fromUrl = argv[++i];
    else if (a === '--draft') opts.draft = true;
    else if (a === '--no-draft') opts.draft = false;
    else positional.push(a);
  }
  if (positional.length < 3) {
    fail(
      'usage: scaffold-gateway.js <vendor> <model> <region[,region]> [--forwarder semtech-udp,basics-station] [--from-url <doc-url>]',
    );
  }
  return {
    vendor: positional[0].toLowerCase(),
    model: positional[1].toLowerCase(),
    regions: positional[2].split(',').map((s) => s.trim()).filter(Boolean),
    opts,
  };
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchBuffer(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`${url} -> HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

function semtechStub() {
  return `{
  "_comment": "STUB — not yet authored. Author a real global_conf.json for the SERVER_ADDRESS/GATEWAY_EUI/region radio block. See AUTHORING.md.",
  "SX130x_conf": { "_todo": "{{PLACEHOLDER}}" },
  "gateway_conf": {
    "gateway_ID": "{{GATEWAY_EUI}}",
    "server_address": "{{SERVER_ADDRESS}}",
    "serv_port_up": {{SERVER_PORT_UP}},
    "serv_port_down": {{SERVER_PORT_DOWN}}
  }
}
`;
}

function basicsStub() {
  return `// STUB — not yet authored. Author a real station.conf. See AUTHORING.md.
// tc.uri  -> {{TC_URI}}
// tc.trust -> {{TRUST_CERT}}
{
  "radio_conf": { "_todo": "{{PLACEHOLDER}}" },
  "station_conf": { "routerid": "{{GATEWAY_EUI}}" }
}
`;
}

function walkthroughStub(vendor, model) {
  return `# Connect the ${vendor} ${model} to ChirpStack

STUB — not yet authored. Replace with short, imperative, screenshot-referenced
steps a farm manager can follow. See AUTHORING.md.

1. Reach the admin UI (see gateway.json admin.defaultUrl).
2. Log in and change the default credentials.
3. Configure the packet forwarder with the rendered config from \`configScript\`.
4. Point it at the ChirpStack Gateway Bridge and confirm the gateway comes online.
`;
}

async function main() {
  const { vendor, model, regions, opts } = parseArgs(process.argv.slice(2));

  const valid = new Set(knownRegions());
  for (const r of regions) if (!valid.has(r)) fail(`unknown region "${r}" (known: ${[...valid].join(', ')})`);

  const knownForwarders = new Set(Object.keys(CONFIG_METHODS.packetForwarders));
  for (const f of opts.forwarders) if (!knownForwarders.has(f)) fail(`unknown forwarder "${f}"`);

  const targetDir = path.join(GATEWAYS_DIR, vendor, model);
  if (fs.existsSync(targetDir)) fail(`refusing to overwrite existing folder ${targetDir}`);

  // Optional documentation snapshot for provenance.
  let provenance = { source: 'vendor-docs', url: opts.fromUrl || '', sha256: '', referencedAt: today() };
  fs.mkdirSync(path.join(targetDir, 'config'), { recursive: true });
  if (opts.fromUrl) {
    fs.mkdirSync(path.join(targetDir, 'reference'), { recursive: true });
    try {
      const buf = await fetchBuffer(opts.fromUrl);
      const snapshotName = 'vendor-doc.html';
      fs.writeFileSync(path.join(targetDir, 'reference', snapshotName), buf);
      provenance.sha256 = sha256(buf);
    } catch (e) {
      console.error(`scaffold: warning — could not fetch --from-url (${e.message}); provenance.sha256 left blank.`);
    }
  }

  const config = {};
  for (const f of opts.forwarders) {
    const ext = f === 'semtech-udp' ? 'semtech-udp.tmpl.json' : 'basics-station.tmpl.conf';
    config[f] = { template: `config/${ext}` };
    if (f === 'semtech-udp') config[f].forwarderFilePath = '/etc/lora/global_conf.json';
    fs.writeFileSync(
      path.join(targetDir, 'config', ext),
      f === 'semtech-udp' ? semtechStub() : basicsStub(),
    );
  }

  const gatewayJson = {
    vendor,
    model,
    name: `${vendor} ${model}`,
    regions,
    chipset: 'TODO',
    oui: ['000000'],
    admin: {
      defaultUrl: 'http://192.168.1.1',
      defaultCredentials: null,
      credentialsNote: 'TODO — verify default credentials against the captured vendor documentation.',
    },
    configMethods: ['web-ui'],
    packetForwarders: opts.forwarders,
    config,
    variantOf: null,
    provenance,
    draft: opts.draft,
  };
  fs.writeFileSync(path.join(targetDir, 'gateway.json'), `${JSON.stringify(gatewayJson, null, 2)}\n`);

  // render.json seeded with sample connections, empty expected (author runs `npm run validate`).
  const fixtures = [];
  for (const f of opts.forwarders) {
    for (const r of regions) {
      fixtures.push({
        forwarder: f,
        region: r,
        connection: { serverAddress: 'chirpstack.example.com', gatewayEui: 'AC1F09FFFE0000FF' },
        expected: '',
      });
    }
  }
  fs.writeFileSync(path.join(targetDir, 'render.json'), `${JSON.stringify({ fixtures }, null, 2)}\n`);

  fs.writeFileSync(path.join(targetDir, 'walkthrough.md'), walkthroughStub(vendor, model));

  console.log(`scaffolded ${vendor}/${model} -> ${path.relative(REPO_ROOT, targetDir)}`);
  console.log('next: author config templates + gateway.json, capture a reference/ snapshot,');
  console.log('      run `npm run build && npm run validate`, then `npm test`.');
}

main();
