// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Lazy enumeration of the gateway registry under `gateways/<vendor>/<model>/`.
 *
 * A model folder is "real" when it contains a `gateway.json`. Folder names must
 * match the `vendor`/`model` fields inside that file (enforced by the
 * conformance suite). Adding a folder registers a profile — there is no central
 * manifest.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GatewayInfo, PacketForwarder } from './types';

/** Root of the gateway registry. */
export const GATEWAYS_DIR = path.join(__dirname, '..', 'gateways');

interface GatewayLocation {
  vendor: string;
  model: string;
  dir: string;
}

let locationCache: GatewayLocation[] | null = null;
const infoCache = new Map<string, GatewayInfo>();

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** Enumerate every `<vendor>/<model>/` folder that has a `gateway.json`. */
function locations(): GatewayLocation[] {
  if (locationCache) return locationCache;
  const out: GatewayLocation[] = [];
  if (isDir(GATEWAYS_DIR)) {
    for (const vendor of fs.readdirSync(GATEWAYS_DIR).sort()) {
      const vendorDir = path.join(GATEWAYS_DIR, vendor);
      if (!isDir(vendorDir)) continue;
      for (const model of fs.readdirSync(vendorDir).sort()) {
        const dir = path.join(vendorDir, model);
        if (isDir(dir) && fs.existsSync(path.join(dir, 'gateway.json'))) {
          out.push({ vendor, model, dir });
        }
      }
    }
  }
  locationCache = out;
  return out;
}

/** Case-insensitive cache key. */
function key(vendor: string, model: string): string {
  return `${vendor}/${model}`.toLowerCase();
}

/** Locate a model folder case-insensitively. */
function locate(vendor: string, model: string): GatewayLocation | undefined {
  const v = vendor.toLowerCase();
  const m = model.toLowerCase();
  return locations().find(
    (l) => l.vendor.toLowerCase() === v && l.model.toLowerCase() === m,
  );
}

/** Absolute path to a model folder. Throws if the model is unknown. */
export function gatewayDir(vendor: string, model: string): string {
  const loc = locate(vendor, model);
  if (!loc) throw new Error(`unknown gateway ${key(vendor, model)}`);
  return loc.dir;
}

/** Parsed `gateway.json` for one model. Throws if unknown. */
export function gateway(vendor: string, model: string): GatewayInfo {
  const k = key(vendor, model);
  const cached = infoCache.get(k);
  if (cached) return cached;
  const loc = locate(vendor, model);
  if (!loc) throw new Error(`unknown gateway ${k}`);
  const info = JSON.parse(
    fs.readFileSync(path.join(loc.dir, 'gateway.json'), 'utf8'),
  ) as GatewayInfo;
  infoCache.set(k, info);
  return info;
}

/**
 * List registry gateways. Authored profiles only by default; pass
 * `includeDrafts: true` to also include scaffolded-but-unauthored drafts.
 *
 * @param opts.vendor - Restrict to one vendor slug (case-insensitive).
 * @param opts.region - Restrict to models declaring this region.
 * @param opts.forwarder - Restrict to models supporting this packet forwarder.
 * @param opts.includeDrafts - Include `draft: true` profiles (default false).
 */
export function gateways(opts?: {
  vendor?: string;
  region?: string;
  forwarder?: PacketForwarder;
  includeDrafts?: boolean;
}): GatewayInfo[] {
  let all = locations().map((l) => gateway(l.vendor, l.model));
  if (!opts?.includeDrafts) all = all.filter((g) => !g.draft);
  if (opts?.vendor) {
    const v = opts.vendor.toLowerCase();
    all = all.filter((g) => g.vendor.toLowerCase() === v);
  }
  if (opts?.region) {
    all = all.filter((g) => g.regions.includes(opts.region as string));
  }
  if (opts?.forwarder) {
    all = all.filter((g) =>
      g.packetForwarders.includes(opts.forwarder as PacketForwarder),
    );
  }
  return all;
}

/**
 * List gateways supporting a given packet forwarder. The capability analog of
 * the codec repo's `devicesProviding()`.
 *
 * @param forwarder - `'semtech-udp'` or `'basics-station'`.
 */
export function gatewaysSupporting(
  forwarder: PacketForwarder,
  opts?: { vendor?: string; region?: string; includeDrafts?: boolean },
): GatewayInfo[] {
  return gateways({ ...opts, forwarder });
}

/** List gateways for one vendor slug (case-insensitive). */
export function gatewaysForVendor(
  vendor: string,
  opts?: { region?: string; includeDrafts?: boolean },
): GatewayInfo[] {
  return gateways({ ...opts, vendor });
}

/** Read the raw template text for a model's packet forwarder. Throws if absent. */
export function templateText(
  vendor: string,
  model: string,
  forwarder: PacketForwarder,
): string {
  const info = gateway(vendor, model);
  const entry = info.config[forwarder];
  if (!entry || !entry.template) {
    throw new Error(
      `${info.vendor}/${info.model} declares no template for ${forwarder}`,
    );
  }
  return fs.readFileSync(path.join(gatewayDir(vendor, model), entry.template), 'utf8');
}

/** Parsed `render.json` fixtures for a model (or `{ fixtures: [] }`). */
export function renderFixtures(
  vendor: string,
  model: string,
): { fixtures: unknown[] } {
  const file = path.join(gatewayDir(vendor, model), 'render.json');
  if (!fs.existsSync(file)) return { fixtures: [] };
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    fixtures?: unknown[];
  };
  return { fixtures: parsed.fixtures ?? [] };
}

/** Raw `walkthrough.md` text for a model. Throws if the model is unknown. */
export function walkthrough(vendor: string, model: string): string {
  const file = path.join(gatewayDir(vendor, model), 'walkthrough.md');
  if (!fs.existsSync(file)) {
    throw new Error(`${key(vendor, model)} has no walkthrough.md`);
  }
  return fs.readFileSync(file, 'utf8');
}

/**
 * Reset the registry caches. Test-only.
 *
 * @internal
 */
export function _resetCaches(): void {
  locationCache = null;
  infoCache.clear();
}
