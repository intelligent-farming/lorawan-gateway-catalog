# CLAUDE.md — lorawan-gateway-catalog

Guidance for AI coding agents (Claude Code, Copilot, etc.) and human contributors. Read this before generating or committing code. Standard across all Intelligent Farming Foundation repositories, with repo-specific notes at the end.

## Project & licensing (non-negotiable)
- This project is licensed GNU AGPL-3.0-or-later. The full text is in LICENSE at the repo root — never modify, move, or remove it.
- Copyright holder is Intelligent Farming Foundation.
- Outbound = inbound: all contributions are made under AGPL-3.0-or-later. Do not relicense, dual-license, or add a different license. Commercial/dual licensing is handled only by counsel (see below).

## Every source file: add this header (adjust comment syntax to the language)
```
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation
```
- Do not paste the full license into source files — the header points to LICENSE.
- Keep the copyright line as "Intelligent Farming Foundation" (not an individual).

## Every commit: sign off (DCO)
- Sign off every commit with: `git commit -s`
- CI rejects commits without the Signed-off-by line. Agents creating commits must include it.

## Dependencies (license compatibility)
- OK to include: MIT, BSD-2/3-Clause, Apache-2.0, ISC, MPL-2.0, GPL-3.0, LGPL-3.0, AGPL-3.0.
- Do NOT add: GPL-2.0-only, proprietary/closed, or non-commercial/source-available licenses (BSL, SSPL, Commons Clause, Elastic License).
- Vendored code keeps its license/attribution, recorded in NOTICE. If unsure, stop and flag it.

## AGPL section 13 (network/SaaS)
- If this software runs as a network service, users interacting over the network must be offered its complete source. Build in a way to get the source (e.g., a "Source" link to this repo).

## Commercial use / relicensing (route to counsel — do not act)
- Any commercial license, dual-licensing, CLA, or relicensing is handled only by the Foundation's IP counsel. Do not add commercial terms, exceptions, or additional permissions.

## Per-PR checklist
- New files have the SPDX + copyright header
- Commits signed off (`git commit -s`)
- No incompatible-licensed dependencies added
- Third-party code keeps its license/attribution (recorded in NOTICE)
- Network-facing changes preserve the section 13 "offer source" path
- No commercial/relicensing terms added (counsel's job)

---

## Repo-specific guidance

This repo ships **standalone LoRaWAN gateway profiles**: one folder per gateway
model, each carrying the admin facts needed to reach the box, authored
render-ready packet-forwarder config templates, and a guided walkthrough. The
single highest-value export is `configScript(...)` — the exact packet-forwarder
config text to paste into the gateway with the ChirpStack connection details
filled in. The contract for authoring a profile lives in **AUTHORING.md** — read
it before adding or editing any gateway.

- **Config templates are original works.** They are authored from the vendor's
  published documentation (which describes the box's admin UI, config-file
  paths, and the Semtech UDP / Basics Station formats — all factual). Vendor
  config dumps kept under `reference/` are consulted only to understand the
  format; never vendor a copyrighted config file wholesale as our template.
- **Rendering is pure string interpolation.** `renderConfig(templateText,
  params)` substitutes a small, fixed `{{TOKEN}}` set (declared in
  `definitions/config-methods.json`) and merges the region channel plan. No
  execution, no `fs` — it runs unchanged in Node and in the browser. An unknown
  or unfilled `{{...}}` in the rendered output is a hard failure.
- **Detection uses `@intelligent-farming/oui-registry`** (a hard dependency).
  OUI resolves the vendor from a scanned Gateway EUI; the model is narrowed by
  the scanned label/QR model string. Reuse its `lookup()` / `detectVendor()`;
  do not re-implement OUI matching. Keep the pure (browser) layer taking the
  vendor/oui explicitly so Leftenant reuses its existing `ouiRegistry` copy.
- **Default credentials are documented defaults, not a security guarantee.**
  Store them with a firmware caveat and provenance; the walkthrough must tell the
  operator to change them. Keep vendor doc snapshots under `reference/` (excluded
  from the npm tarball, attributed in NOTICE).
- **Every profile ships render fixtures** (`render.json`): sample params → the
  exact expected output, asserted byte-for-byte so template drift is caught.
  Adding a folder under `gateways/<vendor>/<model>/` is automatically tested —
  no registration file. Run `npm test` before committing.
- **ChirpStack topology:** Semtech UDP targets the Gateway Bridge UDP backend
  (:1700); Basics Station targets its Basics Station backend (ws/wss, commonly
  :3001). Make the target explicit in template comments and walkthroughs.
