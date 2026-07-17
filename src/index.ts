// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * `@intelligent-farming/lorawan-gateway-catalog`
 *
 * Curated, standalone LoRaWAN gateway profiles: per-model admin facts, authored
 * render-ready packet-forwarder config templates, and guided walkthroughs, so an
 * operator can connect a physical gateway to ChirpStack. The gateway analog of
 * `@intelligent-farming/lorawan-codec-normalization`.
 *
 * The single highest-value export is {@link configScript} — the exact
 * packet-forwarder config text to paste into the gateway, with the ChirpStack
 * connection details filled in.
 *
 * @packageDocumentation
 */

/** Package version, kept in sync with package.json. */
export const VERSION = '0.1.0';

export { regions, region, hasRegion } from './regions';
export {
  gateways,
  gateway,
  gatewaysSupporting,
  gatewaysForVendor,
  templateText,
  renderFixtures,
  walkthrough,
} from './registry';
export { renderConfig, renderRadioBlock, buildRenderParams } from './render';
export { configScript } from './config';
export { detectGateway, gatewaysForOui } from './detect';
export { validateConfig } from './validate';
export { lintConfig, lintTemplateFile, legalTokens } from './lint';
export { checkReferenceSnapshots, findDocDrift } from './sync';

export type {
  PacketForwarder,
  ConfigMethod,
  DefaultCredentials,
  AdminInfo,
  ConfigEntry,
  Provenance,
  GatewayInfo,
  ChannelSpec,
  WideChannelSpec,
  Rx2Spec,
  ChannelPlan,
  RegionInfo,
  ConnectionParams,
  ConfigScriptOptions,
  RenderParams,
  ConfigIssue,
  ConfigCheckResult,
  DetectionResult,
} from './types';
export type { SnapshotCheck, DocDrift } from './sync';
