// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Node convenience for config rendering.
 *
 * {@link configScript} reads a model's authored template off disk, merges the
 * region channel plan, and renders paste-ready packet-forwarder config text —
 * the gateway analog of the codec repo's `codecScript`. The pure rendering
 * primitives it builds on ({@link renderConfig}, {@link renderRadioBlock},
 * {@link buildRenderParams}) live in `render.ts` and are browser-safe.
 *
 * @packageDocumentation
 */

import type { ConfigScriptOptions } from './types';
import { gateway, templateText } from './registry';
import { region as regionInfo } from './regions';
import { buildRenderParams, renderConfig } from './render';

/**
 * Node convenience: read a model's authored template off disk, merge the
 * region channel plan, and render it to paste-ready config text. The gateway
 * analog of the codec repo's `codecScript`.
 *
 * @throws if the model is unknown, is a draft, does not support the forwarder,
 *   is not authored for the region, or a required connection field is missing.
 */
export function configScript(
  vendor: string,
  model: string,
  opts: ConfigScriptOptions,
): string {
  const info = gateway(vendor, model);
  if (info.draft) {
    throw new Error(
      `${info.vendor}/${info.model} is a draft (config not yet authored); fall back to a manual flow`,
    );
  }
  if (!info.packetForwarders.includes(opts.forwarder)) {
    throw new Error(
      `${info.vendor}/${info.model} does not support ${opts.forwarder} (supports: ${info.packetForwarders.join(', ')})`,
    );
  }
  if (!info.regions.includes(opts.region)) {
    throw new Error(
      `${info.vendor}/${info.model} is not authored for region ${opts.region} (authored: ${info.regions.join(', ')})`,
    );
  }
  const reg = regionInfo(opts.region);
  const template = templateText(vendor, model, opts.forwarder);
  const params = buildRenderParams(opts.forwarder, reg, opts.connection);
  return renderConfig(template, params);
}
