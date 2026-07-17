// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Gateway detection from a scanned Gateway EUI.
 *
 * Two layers, mirroring `@intelligent-farming/oui-registry`'s pure/Node split:
 *
 * - {@link gatewaysForOui} — matches an OUI prefix (or a full EUI) against the
 *   catalog profiles' declared `oui` arrays. Does **not** pull the ~1.8 MB IEEE
 *   registry; a browser caller resolves the OUI itself (reusing Leftenant's
 *   `ouiRegistry`) and passes it here.
 * - {@link detectGateway} — Node convenience. Resolves the vendor from the EUI
 *   via `oui-registry`'s longest-prefix `lookup`, and returns the catalog's
 *   candidate models for the operator (or the scanned label's model string) to
 *   disambiguate.
 *
 * OUI resolves the **vendor**; the **model** is narrowed by the scanned
 * label/QR model string, not by the EUI (detection via OUI is vendor-level).
 *
 * @packageDocumentation
 */

import { detectVendor } from '@intelligent-farming/oui-registry';
import { gateways } from './registry';
import type { DetectionResult, GatewayInfo } from './types';

/** Strip separators and uppercase a hex string. */
function normHex(s: string): string {
  return s.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
}

/**
 * Candidate models whose declared OUI prefix-matches `hex` (an OUI prefix or a
 * full EUI). Match is symmetric on prefix: a 6-hex OUI matches any EUI that
 * starts with it, and a full EUI matches any profile OUI that is its prefix.
 */
function matchProfiles(hex: string, includeDrafts: boolean): GatewayInfo[] {
  const h = normHex(hex);
  if (!h) return [];
  return gateways({ includeDrafts }).filter((g) =>
    g.oui.some((o) => {
      const oo = normHex(o);
      return h.startsWith(oo) || oo.startsWith(h);
    }),
  );
}

/** The OUI prefix from a profile that matched `hex`, or null. */
function matchedPrefix(hex: string, g: GatewayInfo): string | null {
  const h = normHex(hex);
  for (const o of g.oui) {
    const oo = normHex(o);
    if (h.startsWith(oo) || oo.startsWith(h)) return oo;
  }
  return null;
}

/**
 * Pure layer: match a resolved OUI prefix (or full EUI) against catalog
 * profiles. The browser path calls this after resolving the OUI with its own
 * copy of the IEEE registry.
 *
 * @param oui - An OUI prefix (6/7/9 hex) or a full 16-hex EUI.
 */
export function gatewaysForOui(
  oui: string,
  opts?: { includeDrafts?: boolean },
): DetectionResult {
  const includeDrafts = opts?.includeDrafts ?? false;
  const matches = matchProfiles(oui, includeDrafts);
  const vendors = new Set(matches.map((g) => g.vendor));
  const prefix = matches.length ? matchedPrefix(oui, matches[0]) : normHex(oui) || null;
  return {
    oui: prefix,
    vendor: vendors.size === 1 ? [...vendors][0] : null,
    candidates: matches.map((g) => ({ vendor: g.vendor, model: g.model, name: g.name })),
  };
}

/**
 * Node convenience: resolve a Gateway EUI to a vendor and candidate models.
 *
 * Uses `oui-registry`'s longest-prefix `detectVendor` for the registered IEEE
 * org name, and the catalog's own declared OUIs for the vendor/candidate
 * mapping. `candidates` is the resolved vendor's authored models; the operator
 * (or the scanned model string) picks the exact one.
 *
 * @param eui - 16-hex Gateway EUI, case-insensitive.
 */
export function detectGateway(
  eui: string,
  opts?: { includeDrafts?: boolean },
): DetectionResult {
  const base = gatewaysForOui(eui, opts);
  const ieee = detectVendor(normHex(eui));
  return {
    ...base,
    oui: base.oui ?? ieee?.oui ?? null,
    ouiName: ieee?.name,
  };
}
