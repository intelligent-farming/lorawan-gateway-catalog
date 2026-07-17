// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Static lint for a config template or rendered config text.
 *
 * Performs **no execution**. Two jobs:
 *  1. Token hygiene — every `{{TOKEN}}` uses the legal `[A-Z0-9_]` syntax, and
 *     (when a forwarder is given) is in that forwarder's declared token set from
 *     `definitions/config-methods.json`. An unknown token is the analog of the
 *     codec lint's banned-syntax check.
 *  2. Structural sanity of a token-free (rendered) config — a JSON forwarder's
 *     output must parse as JSON.
 *
 * Useful both for the conformance suite and for vetting a manually-entered
 * config before it is written to a gateway.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ConfigCheckResult, ConfigIssue, PacketForwarder } from './types';

const TOKEN_RE = /\{\{([^}]*)\}\}/g;
const LEGAL_TOKEN = /^[A-Z0-9_]+$/;

let methodsCache: Record<string, unknown> | null = null;

/** Load config-methods.json (Node). Returns null if unavailable (e.g. browser). */
function configMethods(): Record<string, unknown> | null {
  if (methodsCache) return methodsCache;
  try {
    const file = path.join(__dirname, '..', 'definitions', 'config-methods.json');
    methodsCache = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
    return methodsCache;
  } catch {
    return null;
  }
}

/** The declared legal token set for a forwarder, or null if unknown/unavailable. */
export function legalTokens(forwarder: PacketForwarder): Set<string> | null {
  const doc = configMethods();
  if (!doc) return null;
  const pf = (doc.packetForwarders as Record<string, { tokens?: Record<string, unknown> }>)?.[
    forwarder
  ];
  if (!pf || !pf.tokens) return null;
  return new Set(Object.keys(pf.tokens));
}

/** Which forwarder a template belongs to, by extension. */
function forwarderFromExtension(nameOrText: string): PacketForwarder | null {
  if (nameOrText.endsWith('.tmpl.json')) return 'semtech-udp';
  if (nameOrText.endsWith('.tmpl.conf')) return 'basics-station';
  return null;
}

/**
 * Statically lint a config template or rendered text. Returns
 * `{ valid, issues }`; an empty issue list means it passes.
 *
 * @param text - Template or rendered config text.
 * @param opts.forwarder - When given, unknown tokens (not in the forwarder's
 *   declared set) are flagged and, for `semtech-udp`, a token-free input is
 *   parsed as JSON.
 */
export function lintConfig(
  text: string,
  opts?: { forwarder?: PacketForwarder },
): ConfigCheckResult {
  const issues: ConfigIssue[] = [];
  const forwarder = opts?.forwarder ?? null;

  // 1. Token hygiene.
  const legal = forwarder ? legalTokens(forwarder) : null;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text)) !== null) {
    const raw = m[1].trim();
    if (seen.has(raw)) continue;
    seen.add(raw);
    if (!LEGAL_TOKEN.test(raw)) {
      issues.push({
        rule: 'malformed-token',
        message: `token "{{${m[1]}}}" is not a legal [A-Z0-9_] placeholder`,
      });
      continue;
    }
    if (legal && !legal.has(raw)) {
      issues.push({
        rule: 'unknown-token',
        message: `token "{{${raw}}}" is not in the ${forwarder} token set`,
      });
    }
  }

  // 2. Structural sanity of a token-free (rendered) JSON config.
  const stillTokenised = /\{\{[^}]*\}\}/.test(text);
  if (!stillTokenised && forwarder === 'semtech-udp') {
    try {
      JSON.parse(text);
    } catch (e) {
      issues.push({ rule: 'json', message: `rendered config is not valid JSON: ${(e as Error).message}` });
    }
  }

  return { valid: issues.length === 0, issues };
}

/** Infer the forwarder from a template file name and lint it. */
export function lintTemplateFile(fileName: string, text: string): ConfigCheckResult {
  const forwarder = forwarderFromExtension(fileName);
  return lintConfig(text, forwarder ? { forwarder } : undefined);
}
