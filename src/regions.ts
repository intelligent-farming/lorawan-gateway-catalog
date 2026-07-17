// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Region channel-plan manifests.
 *
 * Each `definitions/regions/<id>.json` holds the canonical, vendor- and
 * chipset-independent LoRaWAN channel plan for one region (band, sub-band,
 * uplink channel layout, RX2). A gateway template references a region by id; the
 * renderer merges the region's channel plan into the model's chipset skeleton
 * (see {@link renderRadioBlock} in `config.ts`).
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RegionInfo } from './types';

/** Directory holding the region manifests. */
export const REGIONS_DIR = path.join(__dirname, '..', 'definitions', 'regions');

let manifestCache: Map<string, RegionInfo> | null = null;

/** Load and cache all region manifests, keyed by id. */
function manifests(): Map<string, RegionInfo> {
  if (!manifestCache) {
    const map = new Map<string, RegionInfo>();
    const files = fs
      .readdirSync(REGIONS_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort();
    for (const f of files) {
      const raw = JSON.parse(
        fs.readFileSync(path.join(REGIONS_DIR, f), 'utf8'),
      ) as RegionInfo;
      const expectedId = f.replace(/\.json$/, '');
      if (raw.id !== expectedId) {
        throw new Error(
          `region manifest ${f} has id "${raw.id}" (expected "${expectedId}")`,
        );
      }
      map.set(raw.id, raw);
    }
    manifestCache = map;
  }
  return manifestCache;
}

/**
 * List every region, sorted by id.
 *
 * @example
 * regions().map((r) => r.id); // ['AS923', 'AU915', 'EU868', 'IN865', 'US915']
 */
export function regions(): RegionInfo[] {
  return [...manifests().values()];
}

/** Look up one region by id, throwing if it does not exist. */
export function region(id: string): RegionInfo {
  const found = manifests().get(id);
  if (!found) {
    const known = [...manifests().keys()].join(', ');
    throw new Error(`unknown region "${id}" (known: ${known})`);
  }
  return found;
}

/** True when a region id exists. */
export function hasRegion(id: string): boolean {
  return manifests().has(id);
}

/**
 * Reset the cached manifests. Test-only.
 *
 * @internal
 */
export function _resetCaches(): void {
  manifestCache = null;
}
