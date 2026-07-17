// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Pure, isomorphic config rendering — no `fs`, no execution, no Node built-ins.
 *
 * This module is the browser-safe half of the rendering API: a webpack/browser
 * bundle imports {@link renderConfig}, {@link renderRadioBlock}, and
 * {@link buildRenderParams} from here (or from the package root, which re-exports
 * them) without pulling in the Node registry. The Node convenience
 * {@link configScript} lives in `config.ts` and builds on these.
 *
 * @packageDocumentation
 */

import type {
  ConnectionParams,
  PacketForwarder,
  RegionInfo,
  RenderParams,
} from './types';

const TOKEN_RE = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

/**
 * Substitute every `{{TOKEN}}` in `template` with `params[TOKEN]` and return the
 * rendered config. Pure and isomorphic.
 *
 * Throws if any placeholder is left unfilled: a `{{TOKEN}}` with no matching key
 * in `params` (an unknown or missing token). Extra keys in `params` that the
 * template does not reference are ignored.
 *
 * @param template - Raw template text.
 * @param params - Flat `{{TOKEN}}` → value map. Numbers are stringified verbatim
 *   (so `1700` renders as the bare JSON number `1700`).
 */
export function renderConfig(template: string, params: RenderParams): string {
  const missing = new Set<string>();
  const out = template.replace(TOKEN_RE, (_m, token: string) => {
    if (Object.prototype.hasOwnProperty.call(params, token)) {
      return String(params[token]);
    }
    missing.add(token);
    return `{{${token}}}`;
  });
  if (missing.size > 0) {
    throw new Error(
      `renderConfig: unfilled placeholder(s): ${[...missing].sort().join(', ')}`,
    );
  }
  // A value could itself carry a token (e.g. a mis-built RADIO_BLOCK). Guard.
  const leftover = out.match(TOKEN_RE);
  if (leftover) {
    throw new Error(
      `renderConfig: rendered output still contains token(s): ${[
        ...new Set(leftover),
      ].join(', ')}`,
    );
  }
  return out;
}

/**
 * Serialize a region's channel plan into the packet-forwarder channel
 * definitions (`chan_multiSF_0..7`, `chan_Lora_std`, `chan_FSK`) that the
 * `{{RADIO_BLOCK}}` token expands to. Pure.
 *
 * Always emits eight `chan_multiSF` slots (slots beyond the region's channel
 * count are `{ "enable": false }`), so the block shape is identical across
 * regions and chipsets. The last line carries no trailing comma, so it drops
 * cleanly into a template's SX130x_conf body.
 *
 * @param region - The region manifest.
 * @param indent - Leading spaces per line (default 4, matching a 2-space-indent
 *   JSON template's SX130x_conf children).
 */
export function renderRadioBlock(region: RegionInfo, indent = 4): string {
  const pad = ' '.repeat(indent);
  const plan = region.channelPlan;
  const lines: string[] = [];
  for (let i = 0; i < 8; i++) {
    const ch = plan.multiSF[i];
    if (ch) {
      lines.push(
        `${pad}"chan_multiSF_${i}": { "enable": true, "radio": ${ch.radio}, "if": ${ch.if} },`,
      );
    } else {
      lines.push(`${pad}"chan_multiSF_${i}": { "enable": false },`);
    }
  }
  if (plan.loraStd) {
    const s = plan.loraStd;
    lines.push(
      `${pad}"chan_Lora_std": { "enable": true, "radio": ${s.radio}, "if": ${s.if}, "bandwidth": ${s.bandwidth}, "spread_factor": ${s.spreadFactor ?? 7} },`,
    );
  } else {
    lines.push(`${pad}"chan_Lora_std": { "enable": false },`);
  }
  if (plan.fsk) {
    const f = plan.fsk;
    lines.push(
      `${pad}"chan_FSK": { "enable": true, "radio": ${f.radio}, "if": ${f.if}, "bandwidth": ${f.bandwidth}, "datarate": ${f.datarate ?? 50000} }`,
    );
  } else {
    lines.push(`${pad}"chan_FSK": { "enable": false }`);
  }
  return lines.join('\n');
}

/** Normalize a Gateway EUI to uppercase hex (no separators). */
export function normalizeEui(eui: string): string {
  return eui.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
}

/**
 * Build the `{{TOKEN}}` → value map for a forwarder, merging the region channel
 * plan with the caller's connection params. Pure — a browser caller that already
 * has a `RegionInfo` in hand can build params without `configScript`.
 *
 * @throws if a required connection field for the forwarder is missing.
 */
export function buildRenderParams(
  forwarder: PacketForwarder,
  region: RegionInfo,
  connection: ConnectionParams,
): RenderParams {
  const radios = region.channelPlan.radios;
  const params: RenderParams = {
    RADIO_0_FREQ: radios[0].freq,
    RADIO_1_FREQ: (radios[1] ?? radios[0]).freq,
    RADIO_BLOCK: renderRadioBlock(region),
  };

  if (forwarder === 'semtech-udp') {
    if (!connection.serverAddress) {
      throw new Error('configScript: connection.serverAddress is required for semtech-udp');
    }
    if (!connection.gatewayEui) {
      throw new Error('configScript: connection.gatewayEui is required for semtech-udp');
    }
    params.SERVER_ADDRESS = connection.serverAddress;
    params.SERVER_PORT_UP = connection.serverPortUp ?? 1700;
    params.SERVER_PORT_DOWN = connection.serverPortDown ?? 1700;
    params.GATEWAY_EUI = normalizeEui(connection.gatewayEui);
    return params;
  }

  // basics-station
  if (!connection.gatewayEui) {
    throw new Error('configScript: connection.gatewayEui is required for basics-station');
  }
  const tcUri =
    connection.tcUri ??
    (connection.serverAddress ? `wss://${connection.serverAddress}:3001` : undefined);
  if (!tcUri) {
    throw new Error(
      'configScript: connection.tcUri (or connection.serverAddress) is required for basics-station',
    );
  }
  params.TC_URI = tcUri;
  params.TRUST_CERT = connection.trustCert ?? 'server-certificate-authority.pem';
  params.GATEWAY_EUI = normalizeEui(connection.gatewayEui);
  if (connection.cupsUri !== undefined) params.CUPS_URI = connection.cupsUri;
  if (connection.tcKey !== undefined) params.TC_KEY = connection.tcKey;
  return params;
}
