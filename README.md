# @intelligent-farming/lorawan-gateway-catalog

Curated, standalone **LoRaWAN gateway profiles** for connecting a physical
gateway to ChirpStack. One folder per gateway model, each carrying the vendor
admin facts needed to reach the box, authored render-ready packet-forwarder
config templates, and a guided walkthrough. The gateway analog of
[`@intelligent-farming/lorawan-codec-normalization`][codec].

Leftenant already makes *device* onboarding easy (scan a label → resolve a
normalized codec → create the device in ChirpStack). The remaining hard step is
connecting the **physical gateway**: every vendor has a different admin UI,
default IP, credentials, and packet-forwarder mechanism. This module fills that
gap. The single highest-value export is `configScript(...)` — the exact
packet-forwarder config text to paste into the gateway, with the ChirpStack
connection details already filled in.

[codec]: https://github.com/intelligent-farming/lorawan-codec-normalization

## Install

```sh
npm install @intelligent-farming/lorawan-gateway-catalog
```

Requires Node.js >= 18. Runtime dependencies: `@intelligent-farming/oui-registry`
(gateway vendor identification), `ajv`, and `ajv-formats`.

## API reference

The sections below cover the common entry points. The complete, generated API
reference (every export, with full type signatures) lives in
[docs/api-doc.md](docs/api-doc.md); regenerate it with `npm run docs`.

## Get a config for a gateway

`configScript` returns the exact packet-forwarder config text to install on the
gateway, with the ChirpStack connection details rendered in:

```js
const { configScript } = require('@intelligent-farming/lorawan-gateway-catalog');

const globalConf = configScript('rakwireless', 'rak7268', {
  forwarder: 'semtech-udp',
  region: 'US915',
  connection: { serverAddress: 'chirpstack.local', gatewayEui: 'AC1F09FFFE001234' },
});
// -> a complete global_conf.json string, radio block filled from the US915
//    channel plan, server_address/gateway_ID/ports filled from `connection`.
```

Rendering is **pure string interpolation** of a small, documented `{{TOKEN}}`
set (see `definitions/config-methods.json`) plus the region channel plan merged
from `definitions/regions/`. There is no execution, so it runs unchanged in Node
and in the browser. An unknown or unfilled `{{...}}` in the output is a hard
error.

### ChirpStack topology (read this)

- **Semtech UDP** targets the ChirpStack **Gateway Bridge UDP backend** (default
  port **1700**).
- **Basics Station** targets the Gateway Bridge **Basics Station backend**
  (WebSocket, commonly `wss://<host>:3001`).

Pointing at the wrong service — or configuring the wrong region/sub-band — is the
most common silent join failure. Every template comment and walkthrough says
which target to use.

### Intended consumption pattern

A provisioner (e.g. Leftenant) resolves a gateway's config in priority order:

1. **This module** — `configScript(vendor, model, …)` for a curated, authored
   config.
2. **Manual entry** — a user-supplied config; `lintConfig` / `validateConfig`
   vet it before it is written to the gateway.

The registry supports a `draft` flag for scaffolded-but-unauthored profiles, but
the published package ships **only authored profiles** — every one is verified by
its conformance render fixtures. If a draft is present, `gateways()` hides it by
default (`gateways({ includeDrafts: true })` lists them), `configScript`
**throws** for it (so callers fall back to a manual flow), and
`gateway(v, m).draft` detects it.

## Browser (pure) vs Node (convenience)

Mirroring `@intelligent-farming/oui-registry`, the rendering API is split so the
browser path pulls no `fs`:

- **Browser** — bundle `gateways/**` templates (webpack `require.context`, as
  Leftenant already does for codecs), then call the pure
  `renderConfig(templateText, params)` / `renderRadioBlock(region)` /
  `buildRenderParams(forwarder, region, connection)`.
- **Node** — `configScript(vendor, model, opts)` reads the template off disk and
  renders it for you.

```js
const { renderConfig, buildRenderParams, region } = require('@intelligent-farming/lorawan-gateway-catalog');
const params = buildRenderParams('semtech-udp', region('EU868'), {
  serverAddress: 'gw.example.com', gatewayEui: 'AC1F09FFFE00ABCD',
});
const out = renderConfig(myBundledTemplateText, params); // pure, browser-safe
```

## Detect a gateway from a scanned EUI

```js
const { detectGateway, gatewaysForOui } = require('@intelligent-farming/lorawan-gateway-catalog');

detectGateway('AC1F09FFFE001234');
// -> { oui: 'AC1F09', vendor: 'rakwireless', ouiName: 'shenzhen RAKwireless…',
//      candidates: [{ vendor: 'rakwireless', model: 'rak7268', name: '…' }, …] }

gatewaysForOui('AC1F09'); // pure layer — browser passes a resolved oui/vendor
```

OUI resolves the **vendor** (via `oui-registry`'s longest-prefix `lookup`); the
**model** is narrowed by the scanned label/QR model string, since detection via
OUI is vendor-level, not model-level. Keep the pure layer taking the vendor/OUI
explicitly so a browser reuses its existing OUI registry rather than pulling a
second ~1.8 MB copy.

## Lint / validate a config

```js
const { lintConfig, validateConfig } = require('@intelligent-farming/lorawan-gateway-catalog');

lintConfig(templateOrText, { forwarder: 'semtech-udp' }); // unknown/malformed tokens, JSON sanity
validateConfig(renderedText, { forwarder: 'semtech-udp' }); // server_address set, EUI valid, radio block present
```

## Regions

`regions()` lists the channel plans; `region(id)` returns one. Each manifest
holds the canonical, vendor- and chipset-independent LoRaWAN channel plan (radio
frequencies, the 125 kHz channel layout, LoRa-std / FSK channels, RX2). Shipped
at 0.1.0: **EU868, US915, AS923, AU915, IN865**. A gateway's declared `regions`
must all exist here (conformance-enforced).

## Seed gateways (0.1.0)

| Vendor | Model | Chipset | Forwarders | Regions |
|---|---|---|---|---|
| rakwireless | rak7268 | SX1302 | semtech-udp, basics-station | EU868, US915, AS923, AU915 |
| rakwireless | rak7268v2 | SX1302 | semtech-udp, basics-station | EU868, US915, AS923, AU915 |
| rakwireless | rak7289 | SX1303 | semtech-udp, basics-station | EU868, US915, AU915 |
| rakwireless | rak7289v2 | SX1303 | semtech-udp, basics-station | EU868, US915, AU915 |
| rakwireless | rak7285 | SX1303 | semtech-udp, basics-station | EU868, US915 |
| rakwireless | rak7240 | SX1301 | semtech-udp, basics-station | EU868, US915 |
| rakwireless | rak7240v2 | SX1303 | semtech-udp, basics-station | EU868, US915 |
| rakwireless | rak7267 | SX1303 | semtech-udp, basics-station | EU868, US915 |
| rakwireless | rak7266 | SX1302 | semtech-udp, basics-station | EU868, US915 |

RAKwireless originals (rak7268, rak7289, rak7240) run **WisGateOS 1** (`root`/`root`, menu *LoRa
Network → Network Settings*) and are EOL; the **`…v2`** profiles are the current SKUs on
**WisGateOS 2** (no factory password — set `root`'s on first boot — menu *LoRa → LoRa
Configuration*). RAK7285/7267/7266 already ship WisGateOS 2.
| dragino | lps8 | SX1308 | semtech-udp | EU868, US915 |
| dragino | dlos8 | SX1301 | semtech-udp | EU868, US915, AS923 |
| dragino | lps8n | SX1302 | semtech-udp, basics-station | EU868, US915 |
| dragino | dlos8n | SX1302 | semtech-udp, basics-station | EU868, US915, AS923 |
| dragino | lg308n | SX1302 | semtech-udp | EU868, US915 |
| dragino | lig16 | SX1302 | semtech-udp, basics-station | EU868, US915 |
| dragino | lps8v2 | SX1302 | semtech-udp, basics-station | EU868, US915 |
| milesight | ug65 | SX1302 | semtech-udp, basics-station | EU868, US915 |
| milesight | ug67 | SX1302 | semtech-udp, basics-station | EU868, US915, AS923 |
| milesight | sg50 | SX1302 | semtech-udp, basics-station | EU868, US915 |
| milesight | ug63 | SX1302 | semtech-udp, basics-station | EU868, US915 |
| milesight | ug56 | SX1302 | semtech-udp, basics-station | EU868, US915 |
| kerlink | ifemtocell | SX1301 | semtech-udp | EU868, US915, IN865 |
| mikrotik | wap-lr8-kit | SX1301 | semtech-udp | EU868, US915 |

The **mikrotik/wap-lr8-kit** runs RouterOS, whose recommended path is the native
`/lora set … network-server=…` CLI (it forwards over Semtech UDP). Its
`configScript` renders the equivalent low-level `global_conf.json` for the SX1301
concentrator, for operators running the Semtech UDP packet forwarder directly;
the walkthrough documents both paths.

`gateways()` lists authored profiles; `gateways({ vendor })`,
`gateways({ region })`, and `gatewaysSupporting(forwarder)` filter them.

## Security note — default credentials

The `admin.defaultCredentials` in a profile are **documented factory defaults**,
not a security guarantee. They are firmware-dependent, some boxes force a change
on first login, and some vendors (e.g. Kerlink) ship a per-device password rather
than a shared default (recorded as `null` with a note). **Every walkthrough tells
the operator to change the credentials.** Vendor documentation snapshots under
`gateways/**/reference/` are kept for provenance/drift only and are excluded from
the npm tarball (attributed in NOTICE).

## Authoring

Adding a gateway is one folder under `gateways/<vendor>/<model>/`, tested
automatically with no registration file. See [AUTHORING.md](AUTHORING.md) for the
full contract and `npm run scaffold` to start one. Run `npm test` before
committing; `npm run validate:check` (CI) fails on template/fixture drift.

## License

AGPL-3.0-or-later. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
