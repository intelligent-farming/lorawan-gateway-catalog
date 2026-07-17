// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Sanity validation of a **rendered** packet-forwarder config — the checks that
 * catch a config that would silently fail to connect. Complements
 * {@link lintConfig} (static/token hygiene) with content checks:
 *
 * - No `{{...}}` token left unfilled.
 * - Semtech UDP: parses as JSON; `gateway_conf.server_address` is set;
 *   `gateway_conf.gateway_ID` is a 16-hex EUI; a radio block is present.
 * - Basics Station: carries a valid `tc.uri` (ws/wss).
 *
 * @packageDocumentation
 */

import type { ConfigCheckResult, ConfigIssue, PacketForwarder } from './types';

const TOKEN_RE = /\{\{[^}]*\}\}/;
const EUI16_RE = /^[0-9A-Fa-f]{16}$/;
const WS_URI_RE = /\bwss?:\/\/[^\s"']+/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validate a rendered config for a forwarder. Returns `{ valid, issues }`.
 *
 * @param rendered - The rendered config text (post-{@link renderConfig}).
 * @param opts.forwarder - Which forwarder produced it.
 */
export function validateConfig(
  rendered: string,
  opts: { forwarder: PacketForwarder },
): ConfigCheckResult {
  const issues: ConfigIssue[] = [];

  if (TOKEN_RE.test(rendered)) {
    issues.push({ rule: 'unfilled-token', message: 'config still contains an unfilled {{TOKEN}}' });
  }

  if (opts.forwarder === 'semtech-udp') {
    let doc: unknown = null;
    try {
      doc = JSON.parse(rendered);
    } catch (e) {
      issues.push({ rule: 'json', message: `not valid JSON: ${(e as Error).message}` });
      return { valid: issues.length === 0, issues };
    }
    const gw = isPlainObject(doc) ? doc.gateway_conf : undefined;
    if (!isPlainObject(gw)) {
      issues.push({ rule: 'gateway-conf', message: 'missing gateway_conf block' });
    } else {
      const addr = gw.server_address;
      if (typeof addr !== 'string' || addr.trim() === '') {
        issues.push({ rule: 'server-address', message: 'gateway_conf.server_address is empty' });
      }
      const eui = gw.gateway_ID;
      if (typeof eui !== 'string' || !EUI16_RE.test(eui)) {
        issues.push({
          rule: 'gateway-eui',
          message: 'gateway_conf.gateway_ID is not a 16-hex Gateway EUI',
        });
      }
    }
    const hasRadio =
      isPlainObject(doc) &&
      (isPlainObject(doc.SX130x_conf) || isPlainObject(doc.SX1301_conf) || isPlainObject(doc.SX1302_conf));
    if (!hasRadio) {
      issues.push({ rule: 'radio-conf', message: 'missing SX130x_conf / SX1301_conf radio block' });
    }
    return { valid: issues.length === 0, issues };
  }

  // basics-station
  const uriMatch = rendered.match(WS_URI_RE);
  if (!uriMatch) {
    issues.push({ rule: 'tc-uri', message: 'no ws/wss tc.uri found in the config' });
  } else {
    try {
      const u = new URL(uriMatch[0]);
      if (u.protocol !== 'ws:' && u.protocol !== 'wss:') {
        issues.push({ rule: 'tc-uri', message: `tc.uri protocol must be ws/wss (got ${u.protocol})` });
      }
    } catch {
      issues.push({ rule: 'tc-uri', message: `tc.uri is not a valid URI: ${uriMatch[0]}` });
    }
  }
  return { valid: issues.length === 0, issues };
}

/** Re-export for symmetry with the codec repo's validate module surface. */
export type { ConfigCheckResult, ConfigIssue };
