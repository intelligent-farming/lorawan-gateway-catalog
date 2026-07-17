// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Intelligent Farming Foundation

/**
 * Shared types for gateway profiles, region channel plans, and the public API.
 *
 * @packageDocumentation
 */

/** A packet-forwarder id (config format). */
export type PacketForwarder = 'semtech-udp' | 'basics-station';

/** A config-method id (how a config is applied to a box). */
export type ConfigMethod = 'web-ui' | 'forwarder-file' | 'ssh-cli';

/** Factory-default admin credentials, or `null` when the box has no default. */
export interface DefaultCredentials {
  username: string;
  password: string;
}

/** Admin facts needed to reach the box out of the box. */
export interface AdminInfo {
  /** Default admin URL or IP. */
  defaultUrl: string;
  /** Wi-Fi AP-mode SSID pattern when the box hosts a setup access point. */
  apModeSsid?: string;
  /**
   * Documented factory-default credentials, or `null`. NEVER a security
   * guarantee — firmware-dependent; the walkthrough must tell the operator to
   * change them.
   */
  defaultCredentials: DefaultCredentials | null;
  /** Firmware/first-login caveat. Required when {@link defaultCredentials} is null. */
  credentialsNote?: string;
}

/** Per-forwarder / per-config-method entry in `gateway.json` `config`. */
export interface ConfigEntry {
  /** Template path (relative to the model folder) for a packet forwarder. */
  template?: string;
  /** On-box path the rendered config is written to (forwarder-file method). */
  forwarderFilePath?: string;
  /** Menu path in the web UI (web-ui method). */
  path?: string;
}

/** Provenance of a profile's admin facts / template. */
export interface Provenance {
  /** Rank, best first: `vendor-docs` > `vendor-config` > `captured` > `synthetic`. */
  source: 'vendor-docs' | 'vendor-config' | 'captured' | 'synthetic';
  /** URL the reference/ snapshot was captured from. */
  url?: string;
  /** sha256 of the captured reference/ documentation snapshot. */
  sha256: string;
  /** ISO date (YYYY-MM-DD) the documentation was captured. */
  referencedAt: string;
}

/** Public description of one gateway model, from its `gateway.json`. */
export interface GatewayInfo {
  vendor: string;
  model: string;
  name: string;
  /** Region ids this model is authored for; each exists in definitions/regions/. */
  regions: string[];
  /** Concentrator chipset (e.g. SX1302). */
  chipset: string;
  /** IEEE OUI prefix(es) registered to the maker (6/7/9 hex chars). */
  oui: string[];
  admin: AdminInfo;
  configMethods: ConfigMethod[];
  packetForwarders: PacketForwarder[];
  config: Record<string, ConfigEntry>;
  /** `<vendor>/<model>` of the base variant, or null. */
  variantOf: string | null;
  provenance: Provenance;
  /**
   * True for a scaffolded-but-not-yet-authored profile. Drafts are hidden from
   * {@link gateways} by default, {@link configScript} throws for them, and the
   * conformance suite skips their render/fixture checks.
   */
  draft?: boolean;
}

/** One 125 kHz multi-SF channel: which radio it sits on and its IF offset (Hz). */
export interface ChannelSpec {
  radio: number;
  if: number;
}

/** The LoRa-standard (high-bandwidth) or FSK channel. */
export interface WideChannelSpec {
  radio: number;
  if: number;
  bandwidth: number;
  /** SF for the LoRa-std channel. */
  spreadFactor?: number;
  /** Bitrate for the FSK channel. */
  datarate?: number;
}

/** RX2 downlink window parameters. */
export interface Rx2Spec {
  freq: number;
  dr: number;
}

/** The vendor- and chipset-independent channel plan for a region. */
export interface ChannelPlan {
  radios: { freq: number }[];
  multiSF: ChannelSpec[];
  loraStd: WideChannelSpec | null;
  fsk: WideChannelSpec | null;
  rx2: Rx2Spec;
}

/** Public description of a region, from `definitions/regions/<id>.json`. */
export interface RegionInfo {
  id: string;
  name: string;
  description: string;
  /** LoRaWAN band id (e.g. `US915`). */
  band: string;
  /** Sub-band the plan uses (US915/AU915), else null. */
  defaultSubBand: number | null;
  channelPlan: ChannelPlan;
  notes?: string;
}

/** ChirpStack connection details supplied by the caller of {@link configScript}. */
export interface ConnectionParams {
  /** Hostname/IP of the ChirpStack Gateway Bridge (Semtech UDP). */
  serverAddress?: string;
  /** Uplink UDP port (default 1700). */
  serverPortUp?: number;
  /** Downlink UDP port (default 1700). */
  serverPortDown?: number;
  /** 16-hex Gateway EUI. */
  gatewayEui?: string;
  /** Basics Station LNS URI (wss://host:3001). Derived from serverAddress if omitted. */
  tcUri?: string;
  /** Basics Station CA trust PEM path/name on the gateway. */
  trustCert?: string;
  /** Optional Basics Station CUPS URI. */
  cupsUri?: string;
  /** Optional Basics Station auth token. */
  tcKey?: string;
}

/** Options for {@link configScript}. */
export interface ConfigScriptOptions {
  forwarder: PacketForwarder;
  region: string;
  connection: ConnectionParams;
}

/** A flat `{{TOKEN}}` → value map consumed by {@link renderConfig}. */
export type RenderParams = Record<string, string | number>;

/** A single config-validation failure (from {@link validateConfig}). */
export interface ConfigIssue {
  /** Short machine rule id. */
  rule: string;
  /** Human-readable explanation. */
  message: string;
}

/** Result of {@link validateConfig} / {@link lintConfig}. */
export interface ConfigCheckResult {
  valid: boolean;
  issues: ConfigIssue[];
}

/** Result of {@link detectGateway} / {@link gatewaysForOui}. */
export interface DetectionResult {
  /** The matched OUI assignment (6/7/9 hex), or null if unresolved. */
  oui: string | null;
  /** Resolved vendor slug (a catalog vendor), or null. */
  vendor: string | null;
  /** Registered IEEE organization name, when available. */
  ouiName?: string;
  /** This vendor's authored models for the operator to disambiguate. */
  candidates: { vendor: string; model: string; name: string }[];
}
