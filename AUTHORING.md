# Authoring a gateway profile

This is the contract for adding a model under `gateways/<vendor>/<model>/`. It is
written for both human contributors and AI coding agents. Read it fully before
authoring. The conformance suite (`test/conformance.js`) enforces most of this
mechanically — `npm test` is the gate.

## What you are building

A **standalone gateway profile**: everything an operator needs to connect one
physical gateway model to ChirpStack. The single highest-value artifact is the
**config template** that `configScript(...)` renders into paste-ready
packet-forwarder config text with the ChirpStack connection details already
filled in. This is the gateway analog of the codec repo's `codecScript`.

Config templates are **original works**. They are authored from the vendor's
published documentation (which describes the box's admin UI, config-file paths,
and the standard Semtech UDP / Basics Station formats — all factual). A vendor
config dump kept under `reference/` is consulted only to understand the format;
**never** vendor a copyrighted config file wholesale as our template.

## Folder layout

```
gateways/<vendor>/<model>/
├── gateway.json                 # metadata: admin facts, regions, forwarders, provenance (ships)
├── config/
│   ├── semtech-udp.tmpl.json    # authored global_conf template w/ {{TOKENS}} (ships)
│   └── basics-station.tmpl.conf # authored station.conf template (ships, when supported)
├── walkthrough.md               # per-vendor guided UI steps (ships)
├── render.json                  # render fixtures: sample params -> exact expected output (ships)
└── reference/                   # vendor doc snapshot(s) — NOT shipped in the npm tarball
    └── vendor-doc.html
```

Scaffold a new folder with:

```
npm run scaffold -- <vendor> <model> <region[,region]> [--forwarder semtech-udp,basics-station] [--from-url <doc-url>]
```

The scaffold marks the profile `draft: true`, writes stub templates (unfilled
`{{PLACEHOLDER}}` tokens), seeds `render.json` with sample connection params but
**no** expected output, and — with `--from-url` — snapshots the vendor doc page
into `reference/` and records its sha256 in `provenance`.

## `gateway.json` field reference

| Field | Notes |
|---|---|
| `vendor` / `model` | Lowercase slugs; **must equal** the folder names. |
| `name` | Human product name (e.g. `RAK7268 WisGate Edge Lite 2`). |
| `regions` | Region ids you author for; each must exist in `definitions/regions/`. **EU868 + US915 at minimum.** |
| `chipset` | Concentrator chipset (SX1302, SX1301, …). Informational. |
| `oui` | IEEE OUI prefix(es) (6/7/9 hex) registered to the maker; used by detection. Verify against the scanned label / IEEE registry. |
| `admin.defaultUrl` | Default admin URL or IP out of the box. |
| `admin.apModeSsid` | AP-mode SSID pattern when the box hosts a setup Wi-Fi. |
| `admin.defaultCredentials` | Documented defaults, or `null`. **Never a security guarantee.** If `null`, set `credentialsNote`. |
| `configMethods` | How the operator applies the config: `web-ui`, `forwarder-file`, `ssh-cli`. |
| `packetForwarders` | `semtech-udp` and/or `basics-station`. Each must have a template in `config`. |
| `config.<forwarder>.template` | Path to the authored template. `.forwarderFilePath` = on-box path. |
| `config.<method>.path` | Menu path for the `web-ui` method. |
| `variantOf` | `"<vendor>/<model>"` of the base variant when this is a board/firmware revision with a different config skeleton, else `null`. |
| `provenance` | `source` (`vendor-docs` best), optional `url`, `sha256` of the `reference/` snapshot, and `referencedAt` date. |
| `draft` | `true` while unauthored — hidden from `gateways()`, `configScript` throws, render/fixture checks skipped. Ship none. |

## Config templates + tokens

Rendering is **pure string interpolation** (`renderConfig`) — no execution, no
`fs`. Use only the `{{TOKEN}}` set declared in
`definitions/config-methods.json`; an unknown or unfilled token is a hard
failure (the analog of the codec lint's banned syntax).

**Semtech UDP** (`config/semtech-udp.tmpl.json`, ships as a `global_conf.json`):

| Token | Source | Notes |
|---|---|---|
| `{{SERVER_ADDRESS}}` | connection | ChirpStack **Gateway Bridge** host. |
| `{{SERVER_PORT_UP}}` / `{{SERVER_PORT_DOWN}}` | connection | Default `1700`. |
| `{{GATEWAY_EUI}}` | connection | 16-hex `gateway_ID`. |
| `{{RADIO_0_FREQ}}` / `{{RADIO_1_FREQ}}` | region | Radio center frequencies (Hz). |
| `{{RADIO_BLOCK}}` | region | The `chan_multiSF_0..7` / `chan_Lora_std` / `chan_FSK` definitions, serialized by `renderRadioBlock` from the region channel plan. |

Put `{{RADIO_BLOCK}}` on its own line inside `SX130x_conf` (or `SX1301_conf`),
immediately after the `radio_1` block's closing `},`. The block carries no
trailing comma on its last line, and `SX130x_conf` closes on the next line.
Keep the top-level radio-block key and radio `type` matching the chipset
(`SX130x_conf` + `SX1250` for SX1302/1303; `SX1301_conf` + `SX1257` for
SX1301/1308). Target the Gateway Bridge **UDP backend on :1700** — say so in a
template comment and the walkthrough.

**Basics Station** (`config/basics-station.tmpl.conf`, a `station.conf`):

| Token | Source | Notes |
|---|---|---|
| `{{TC_URI}}` | connection | `wss://<host>:3001` (Gateway Bridge Basics Station backend). |
| `{{TRUST_CERT}}` | connection | CA trust PEM name on the gateway (`tc.trust`). |
| `{{GATEWAY_EUI}}` | connection | 16-hex `routerid`. |
| `{{RADIO_0_FREQ}}` / `{{RADIO_1_FREQ}}` / `{{RADIO_BLOCK}}` | region | As above. |
| `{{CUPS_URI}}` / `{{TC_KEY}}` | connection | Optional. |

`.conf` files allow `//` comments — use a leading comment block to document the
`tc.uri` / `tc.trust` / `tc.key` files the operator creates, then the JSON body.

## Region channel plan rules

Region manifests (`definitions/regions/<id>.json`) hold the **vendor- and
chipset-independent** channel plan: radio center frequencies, the eight 125 kHz
channel IF offsets, the LoRa-std and FSK channels, and RX2. The template holds
the **chipset skeleton**; the renderer merges the region channel plan into it.
`variantOf` handles board revisions with a different skeleton.

If a model's radio block cannot be expressed as `region channel plan + chipset
skeleton` (e.g. an unusual concentrator layout), **flag it** rather than forcing
it — do not distort the region data to fit one model.

## Verify against the vendor documentation

Cross-check **every** admin fact against the vendor's own documentation, not a
forum post or a stale wiki. Never trust a vendor's own example config blindly —
author the template and confirm each value:

- The admin URL / AP-mode SSID and the default credentials (and whether the
  firmware forces a change on first login).
- The on-box config-file path for the forwarder-file method.
- The web-UI menu path for the web-ui method.
- The chipset and the OUI prefix (from the label / IEEE registry).
- That Semtech UDP targets the Gateway Bridge UDP backend and Basics Station
  targets the Basics Station backend — **the most common silent failure is
  pointing at the wrong service or the wrong region/sub-band.**

## Provenance capture

Capture a snapshot of the exact documentation page you authored from into
`reference/` (excluded from the npm tarball, attributed in NOTICE), and record
its sha256 + date in `provenance`. The conformance suite requires a `reference/`
file whose sha256 equals `provenance.sha256`. `npm run scaffold -- … --from-url
<url>` does this for you.

## Writing a good walkthrough

Short, imperative, screenshot-referenced steps a farm manager can follow. One
walkthrough per supported config method. Always include the step to **change the
default credentials**, and name the ChirpStack service the forwarder must point
at (Gateway Bridge UDP :1700 for Semtech UDP; Basics Station backend for Basics
Station). Name the model somewhere in the file (the suite checks this).

## Render fixtures (`render.json`)

```json
{
  "fixtures": [
    { "forwarder": "semtech-udp", "region": "US915",
      "connection": { "serverAddress": "chirpstack.example.com", "gatewayEui": "AC1F09FFFE0000FF" },
      "expected": "<exact rendered output>" }
  ]
}
```

- Provide a fixture for **every** declared `(forwarder × region)` pair — the
  suite asserts the exact rendered output and full coverage.
- Do **not** hand-write `expected` — author the template, then run
  `npm run build && npm run validate` to fill every `expected` from the current
  template. `npm run validate:check` (CI) fails if any is stale, so template
  drift is always caught.

## Checklist

1. `npm run scaffold -- <vendor> <model> <regions> [--forwarder …] --from-url <doc-url>`.
2. Author `config/*.tmpl.*` from the vendor docs (tokens + region radio block).
3. Fill `gateway.json`: admin facts, `oui`, `chipset`, `regions`,
   `packetForwarders`, `config` paths, `variantOf`, `provenance`. Set
   `draft: false` once authored.
4. Write `walkthrough.md` (one section per config method; change-credentials
   step; correct ChirpStack target).
5. `npm run build && npm run validate` to fill `render.json` `expected`.
6. `npm test` until green. The suite tests your folder automatically — there is
   no registration file.
