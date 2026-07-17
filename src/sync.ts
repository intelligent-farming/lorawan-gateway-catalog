// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Optional, Node-only vendor-documentation drift checks (the gateway analog of
 * the codec repo's `sync.ts`). Self-contained — uses `node:https`/`node:crypto`,
 * no peer dependency.
 *
 * - {@link checkReferenceSnapshots} — offline: confirm each profile's
 *   `reference/` snapshot exists and its sha256 matches the stored
 *   `provenance.sha256`. Run in CI (no network).
 * - {@link findDocDrift} — online: re-fetch each profile's `provenance.url` and
 *   report whether the live page's sha256 still matches what was authored from.
 *
 * @packageDocumentation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import * as https from 'node:https';
import { gateways } from './registry';
import { GATEWAYS_DIR } from './registry';

/** A reference-snapshot integrity result (offline). */
export interface SnapshotCheck {
  vendor: string;
  model: string;
  /** sha256 recorded in gateway.json provenance. */
  storedSha256: string;
  /** sha256 of the reference/ snapshot on disk, or null if none present. */
  snapshotSha256: string | null;
  /** True when a snapshot exists and matches the stored sha256. */
  ok: boolean;
}

/** A live-doc drift result (online). */
export interface DocDrift {
  vendor: string;
  model: string;
  url: string | null;
  storedSha256: string;
  /** sha256 of the freshly-fetched page, or null if it could not be fetched. */
  currentSha256: string | null;
  /** True when the live page differs from what the profile was authored from. */
  changed: boolean;
}

function sha256(buf: Buffer | string): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Offline: for every authored profile, confirm a `reference/` snapshot exists
 * whose sha256 matches the stored `provenance.sha256`. Drafts are skipped.
 */
export function checkReferenceSnapshots(): SnapshotCheck[] {
  const out: SnapshotCheck[] = [];
  for (const g of gateways({ includeDrafts: false })) {
    const dir = path.join(GATEWAYS_DIR, g.vendor, g.model);
    const want = g.provenance.sha256;
    const refDir = path.join(dir, 'reference');
    let snapshotSha256: string | null = null;
    let ok = false;
    if (fs.existsSync(refDir)) {
      for (const name of fs.readdirSync(refDir).sort()) {
        const p = path.join(refDir, name);
        if (!fs.statSync(p).isFile()) continue;
        const h = sha256(fs.readFileSync(p));
        if (snapshotSha256 === null) snapshotSha256 = h;
        if (h === want) {
          snapshotSha256 = h;
          ok = true;
          break;
        }
      }
    }
    out.push({ vendor: g.vendor, model: g.model, storedSha256: want, snapshotSha256, ok });
  }
  return out;
}

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchBuffer(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`${url} -> HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * Online: re-fetch each authored profile's `provenance.url` and report whether
 * the live page's sha256 still matches the stored `provenance.sha256`. Note that
 * documentation pages change wording often, so `changed: true` is a prompt to
 * re-review, not necessarily a fault.
 */
export async function findDocDrift(): Promise<DocDrift[]> {
  const out: DocDrift[] = [];
  for (const g of gateways({ includeDrafts: false })) {
    const url = g.provenance.url ?? null;
    let currentSha256: string | null = null;
    if (url) {
      try {
        currentSha256 = sha256(await fetchBuffer(url));
      } catch {
        currentSha256 = null;
      }
    }
    out.push({
      vendor: g.vendor,
      model: g.model,
      url,
      storedSha256: g.provenance.sha256,
      currentSha256,
      changed: currentSha256 !== g.provenance.sha256,
    });
  }
  return out;
}
