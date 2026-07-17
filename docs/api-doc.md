# @intelligent-farming/lorawan-gateway-catalog

`@intelligent-farming/lorawan-gateway-catalog`

Curated, standalone LoRaWAN gateway profiles: per-model admin facts, authored
render-ready packet-forwarder config templates, and guided walkthroughs, so an
operator can connect a physical gateway to ChirpStack. The gateway analog of
`@intelligent-farming/lorawan-codec-normalization`.

The single highest-value export is [configScript](#configscript) — the exact
packet-forwarder config text to paste into the gateway, with the ChirpStack
connection details filled in.

## Interfaces

### AdminInfo

Admin facts needed to reach the box out of the box.

#### Properties

##### apModeSsid?

> `optional` **apModeSsid?**: `string`

Wi-Fi AP-mode SSID pattern when the box hosts a setup access point.

##### credentialsNote?

> `optional` **credentialsNote?**: `string`

Firmware/first-login caveat. Required when [defaultCredentials](#defaultcredentials) is null.

##### defaultCredentials

> **defaultCredentials**: [`DefaultCredentials`](#defaultcredentials-1) \| `null`

Documented factory-default credentials, or `null`. NEVER a security
guarantee — firmware-dependent; the walkthrough must tell the operator to
change them.

##### defaultUrl

> **defaultUrl**: `string`

Default admin URL or IP.

***

### ChannelPlan

The vendor- and chipset-independent channel plan for a region.

#### Properties

##### fsk

> **fsk**: [`WideChannelSpec`](#widechannelspec) \| `null`

##### loraStd

> **loraStd**: [`WideChannelSpec`](#widechannelspec) \| `null`

##### multiSF

> **multiSF**: [`ChannelSpec`](#channelspec)[]

##### radios

> **radios**: `object`[]

###### freq

> **freq**: `number`

##### rx2

> **rx2**: [`Rx2Spec`](#rx2spec)

***

### ChannelSpec

One 125 kHz multi-SF channel: which radio it sits on and its IF offset (Hz).

#### Properties

##### if

> **if**: `number`

##### radio

> **radio**: `number`

***

### ConfigCheckResult

Result of [validateConfig](#validateconfig) / [lintConfig](#lintconfig).

#### Properties

##### issues

> **issues**: [`ConfigIssue`](#configissue)[]

##### valid

> **valid**: `boolean`

***

### ConfigEntry

Per-forwarder / per-config-method entry in `gateway.json` `config`.

#### Properties

##### forwarderFilePath?

> `optional` **forwarderFilePath?**: `string`

On-box path the rendered config is written to (forwarder-file method).

##### path?

> `optional` **path?**: `string`

Menu path in the web UI (web-ui method).

##### template?

> `optional` **template?**: `string`

Template path (relative to the model folder) for a packet forwarder.

***

### ConfigIssue

A single config-validation failure (from [validateConfig](#validateconfig)).

#### Properties

##### message

> **message**: `string`

Human-readable explanation.

##### rule

> **rule**: `string`

Short machine rule id.

***

### ConfigScriptOptions

Options for [configScript](#configscript).

#### Properties

##### connection

> **connection**: [`ConnectionParams`](#connectionparams)

##### forwarder

> **forwarder**: [`PacketForwarder`](#packetforwarder)

##### region

> **region**: `string`

***

### ConnectionParams

ChirpStack connection details supplied by the caller of [configScript](#configscript).

#### Properties

##### cupsUri?

> `optional` **cupsUri?**: `string`

Optional Basics Station CUPS URI.

##### gatewayEui?

> `optional` **gatewayEui?**: `string`

16-hex Gateway EUI.

##### serverAddress?

> `optional` **serverAddress?**: `string`

Hostname/IP of the ChirpStack Gateway Bridge (Semtech UDP).

##### serverPortDown?

> `optional` **serverPortDown?**: `number`

Downlink UDP port (default 1700).

##### serverPortUp?

> `optional` **serverPortUp?**: `number`

Uplink UDP port (default 1700).

##### tcKey?

> `optional` **tcKey?**: `string`

Optional Basics Station auth token.

##### tcUri?

> `optional` **tcUri?**: `string`

Basics Station LNS URI (wss://host:3001). Derived from serverAddress if omitted.

##### trustCert?

> `optional` **trustCert?**: `string`

Basics Station CA trust PEM path/name on the gateway.

***

### DefaultCredentials

Factory-default admin credentials, or `null` when the box has no default.

#### Properties

##### password

> **password**: `string`

##### username

> **username**: `string`

***

### DetectionResult

Result of [detectGateway](#detectgateway) / [gatewaysForOui](#gatewaysforoui).

#### Properties

##### candidates

> **candidates**: `object`[]

This vendor's authored models for the operator to disambiguate.

###### model

> **model**: `string`

###### name

> **name**: `string`

###### vendor

> **vendor**: `string`

##### oui

> **oui**: `string` \| `null`

The matched OUI assignment (6/7/9 hex), or null if unresolved.

##### ouiName?

> `optional` **ouiName?**: `string`

Registered IEEE organization name, when available.

##### vendor

> **vendor**: `string` \| `null`

Resolved vendor slug (a catalog vendor), or null.

***

### DocDrift

A live-doc drift result (online).

#### Properties

##### changed

> **changed**: `boolean`

True when the live page differs from what the profile was authored from.

##### currentSha256

> **currentSha256**: `string` \| `null`

sha256 of the freshly-fetched page, or null if it could not be fetched.

##### model

> **model**: `string`

##### storedSha256

> **storedSha256**: `string`

##### url

> **url**: `string` \| `null`

##### vendor

> **vendor**: `string`

***

### GatewayInfo

Public description of one gateway model, from its `gateway.json`.

#### Properties

##### admin

> **admin**: [`AdminInfo`](#admininfo)

##### chipset

> **chipset**: `string`

Concentrator chipset (e.g. SX1302).

##### config

> **config**: `Record`\<`string`, [`ConfigEntry`](#configentry)\>

##### configMethods

> **configMethods**: [`ConfigMethod`](#configmethod)[]

##### draft?

> `optional` **draft?**: `boolean`

True for a scaffolded-but-not-yet-authored profile. Drafts are hidden from
[gateways](#gateways) by default, [configScript](#configscript) throws for them, and the
conformance suite skips their render/fixture checks.

##### model

> **model**: `string`

##### name

> **name**: `string`

##### oui

> **oui**: `string`[]

IEEE OUI prefix(es) registered to the maker (6/7/9 hex chars).

##### packetForwarders

> **packetForwarders**: [`PacketForwarder`](#packetforwarder)[]

##### provenance

> **provenance**: [`Provenance`](#provenance-1)

##### regions

> **regions**: `string`[]

Region ids this model is authored for; each exists in definitions/regions/.

##### variantOf

> **variantOf**: `string` \| `null`

`<vendor>/<model>` of the base variant, or null.

##### vendor

> **vendor**: `string`

***

### Provenance

Provenance of a profile's admin facts / template.

#### Properties

##### referencedAt

> **referencedAt**: `string`

ISO date (YYYY-MM-DD) the documentation was captured.

##### sha256

> **sha256**: `string`

sha256 of the captured reference/ documentation snapshot.

##### source

> **source**: `"vendor-docs"` \| `"vendor-config"` \| `"captured"` \| `"synthetic"`

Rank, best first: `vendor-docs` > `vendor-config` > `captured` > `synthetic`.

##### url?

> `optional` **url?**: `string`

URL the reference/ snapshot was captured from.

***

### RegionInfo

Public description of a region, from `definitions/regions/<id>.json`.

#### Properties

##### band

> **band**: `string`

LoRaWAN band id (e.g. `US915`).

##### channelPlan

> **channelPlan**: [`ChannelPlan`](#channelplan)

##### defaultSubBand

> **defaultSubBand**: `number` \| `null`

Sub-band the plan uses (US915/AU915), else null.

##### description

> **description**: `string`

##### id

> **id**: `string`

##### name

> **name**: `string`

##### notes?

> `optional` **notes?**: `string`

***

### Rx2Spec

RX2 downlink window parameters.

#### Properties

##### dr

> **dr**: `number`

##### freq

> **freq**: `number`

***

### SnapshotCheck

A reference-snapshot integrity result (offline).

#### Properties

##### model

> **model**: `string`

##### ok

> **ok**: `boolean`

True when a snapshot exists and matches the stored sha256.

##### snapshotSha256

> **snapshotSha256**: `string` \| `null`

sha256 of the reference/ snapshot on disk, or null if none present.

##### storedSha256

> **storedSha256**: `string`

sha256 recorded in gateway.json provenance.

##### vendor

> **vendor**: `string`

***

### WideChannelSpec

The LoRa-standard (high-bandwidth) or FSK channel.

#### Properties

##### bandwidth

> **bandwidth**: `number`

##### datarate?

> `optional` **datarate?**: `number`

Bitrate for the FSK channel.

##### if

> **if**: `number`

##### radio

> **radio**: `number`

##### spreadFactor?

> `optional` **spreadFactor?**: `number`

SF for the LoRa-std channel.

## Type Aliases

### ConfigMethod

> **ConfigMethod** = `"web-ui"` \| `"forwarder-file"` \| `"ssh-cli"`

A config-method id (how a config is applied to a box).

***

### PacketForwarder

> **PacketForwarder** = `"semtech-udp"` \| `"basics-station"`

A packet-forwarder id (config format).

***

### RenderParams

> **RenderParams** = `Record`\<`string`, `string` \| `number`\>

A flat `{{TOKEN}}` → value map consumed by [renderConfig](#renderconfig).

## Variables

### VERSION

> `const` **VERSION**: `"0.1.0"` = `'0.1.0'`

Package version, kept in sync with package.json.

## Functions

### buildRenderParams()

> **buildRenderParams**(`forwarder`, `region`, `connection`): [`RenderParams`](#renderparams)

Build the `{{TOKEN}}` → value map for a forwarder, merging the region channel
plan with the caller's connection params. Pure — a browser caller that already
has a `RegionInfo` in hand can build params without `configScript`.

#### Parameters

##### forwarder

[`PacketForwarder`](#packetforwarder)

##### region

[`RegionInfo`](#regioninfo)

##### connection

[`ConnectionParams`](#connectionparams)

#### Returns

[`RenderParams`](#renderparams)

#### Throws

if a required connection field for the forwarder is missing.

***

### checkReferenceSnapshots()

> **checkReferenceSnapshots**(): [`SnapshotCheck`](#snapshotcheck)[]

Offline: for every authored profile, confirm a `reference/` snapshot exists
whose sha256 matches the stored `provenance.sha256`. Drafts are skipped.

#### Returns

[`SnapshotCheck`](#snapshotcheck)[]

***

### configScript()

> **configScript**(`vendor`, `model`, `opts`): `string`

Node convenience: read a model's authored template off disk, merge the
region channel plan, and render it to paste-ready config text. The gateway
analog of the codec repo's `codecScript`.

#### Parameters

##### vendor

`string`

##### model

`string`

##### opts

[`ConfigScriptOptions`](#configscriptoptions)

#### Returns

`string`

#### Throws

if the model is unknown, is a draft, does not support the forwarder,
  is not authored for the region, or a required connection field is missing.

***

### detectGateway()

> **detectGateway**(`eui`, `opts?`): [`DetectionResult`](#detectionresult)

Node convenience: resolve a Gateway EUI to a vendor and candidate models.

Uses `oui-registry`'s longest-prefix `detectVendor` for the registered IEEE
org name, and the catalog's own declared OUIs for the vendor/candidate
mapping. `candidates` is the resolved vendor's authored models; the operator
(or the scanned model string) picks the exact one.

#### Parameters

##### eui

`string`

16-hex Gateway EUI, case-insensitive.

##### opts?

###### includeDrafts?

`boolean`

#### Returns

[`DetectionResult`](#detectionresult)

***

### findDocDrift()

> **findDocDrift**(): `Promise`\<[`DocDrift`](#docdrift)[]\>

Online: re-fetch each authored profile's `provenance.url` and report whether
the live page's sha256 still matches the stored `provenance.sha256`. Note that
documentation pages change wording often, so `changed: true` is a prompt to
re-review, not necessarily a fault.

#### Returns

`Promise`\<[`DocDrift`](#docdrift)[]\>

***

### gateway()

> **gateway**(`vendor`, `model`): [`GatewayInfo`](#gatewayinfo)

Parsed `gateway.json` for one model. Throws if unknown.

#### Parameters

##### vendor

`string`

##### model

`string`

#### Returns

[`GatewayInfo`](#gatewayinfo)

***

### gateways()

> **gateways**(`opts?`): [`GatewayInfo`](#gatewayinfo)[]

List registry gateways. Authored profiles only by default; pass
`includeDrafts: true` to also include scaffolded-but-unauthored drafts.

#### Parameters

##### opts?

###### forwarder?

[`PacketForwarder`](#packetforwarder)

Restrict to models supporting this packet forwarder.

###### includeDrafts?

`boolean`

Include `draft: true` profiles (default false).

###### region?

`string`

Restrict to models declaring this region.

###### vendor?

`string`

Restrict to one vendor slug (case-insensitive).

#### Returns

[`GatewayInfo`](#gatewayinfo)[]

***

### gatewaysForOui()

> **gatewaysForOui**(`oui`, `opts?`): [`DetectionResult`](#detectionresult)

Pure layer: match a resolved OUI prefix (or full EUI) against catalog
profiles. The browser path calls this after resolving the OUI with its own
copy of the IEEE registry.

#### Parameters

##### oui

`string`

An OUI prefix (6/7/9 hex) or a full 16-hex EUI.

##### opts?

###### includeDrafts?

`boolean`

#### Returns

[`DetectionResult`](#detectionresult)

***

### gatewaysForVendor()

> **gatewaysForVendor**(`vendor`, `opts?`): [`GatewayInfo`](#gatewayinfo)[]

List gateways for one vendor slug (case-insensitive).

#### Parameters

##### vendor

`string`

##### opts?

###### includeDrafts?

`boolean`

###### region?

`string`

#### Returns

[`GatewayInfo`](#gatewayinfo)[]

***

### gatewaysSupporting()

> **gatewaysSupporting**(`forwarder`, `opts?`): [`GatewayInfo`](#gatewayinfo)[]

List gateways supporting a given packet forwarder. The capability analog of
the codec repo's `devicesProviding()`.

#### Parameters

##### forwarder

[`PacketForwarder`](#packetforwarder)

`'semtech-udp'` or `'basics-station'`.

##### opts?

###### includeDrafts?

`boolean`

###### region?

`string`

###### vendor?

`string`

#### Returns

[`GatewayInfo`](#gatewayinfo)[]

***

### hasRegion()

> **hasRegion**(`id`): `boolean`

True when a region id exists.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### legalTokens()

> **legalTokens**(`forwarder`): `Set`\<`string`\> \| `null`

The declared legal token set for a forwarder, or null if unknown/unavailable.

#### Parameters

##### forwarder

[`PacketForwarder`](#packetforwarder)

#### Returns

`Set`\<`string`\> \| `null`

***

### lintConfig()

> **lintConfig**(`text`, `opts?`): [`ConfigCheckResult`](#configcheckresult)

Statically lint a config template or rendered text. Returns
`{ valid, issues }`; an empty issue list means it passes.

#### Parameters

##### text

`string`

Template or rendered config text.

##### opts?

###### forwarder?

[`PacketForwarder`](#packetforwarder)

When given, unknown tokens (not in the forwarder's
  declared set) are flagged and, for `semtech-udp`, a token-free input is
  parsed as JSON.

#### Returns

[`ConfigCheckResult`](#configcheckresult)

***

### lintTemplateFile()

> **lintTemplateFile**(`fileName`, `text`): [`ConfigCheckResult`](#configcheckresult)

Infer the forwarder from a template file name and lint it.

#### Parameters

##### fileName

`string`

##### text

`string`

#### Returns

[`ConfigCheckResult`](#configcheckresult)

***

### region()

> **region**(`id`): [`RegionInfo`](#regioninfo)

Look up one region by id, throwing if it does not exist.

#### Parameters

##### id

`string`

#### Returns

[`RegionInfo`](#regioninfo)

***

### regions()

> **regions**(): [`RegionInfo`](#regioninfo)[]

List every region, sorted by id.

#### Returns

[`RegionInfo`](#regioninfo)[]

#### Example

```ts
regions().map((r) => r.id); // ['AS923', 'AU915', 'EU868', 'IN865', 'US915']
```

***

### renderConfig()

> **renderConfig**(`template`, `params`): `string`

Substitute every `{{TOKEN}}` in `template` with `params[TOKEN]` and return the
rendered config. Pure and isomorphic.

Throws if any placeholder is left unfilled: a `{{TOKEN}}` with no matching key
in `params` (an unknown or missing token). Extra keys in `params` that the
template does not reference are ignored.

#### Parameters

##### template

`string`

Raw template text.

##### params

[`RenderParams`](#renderparams)

Flat `{{TOKEN}}` → value map. Numbers are stringified verbatim
  (so `1700` renders as the bare JSON number `1700`).

#### Returns

`string`

***

### renderFixtures()

> **renderFixtures**(`vendor`, `model`): `object`

Parsed `render.json` fixtures for a model (or `{ fixtures: [] }`).

#### Parameters

##### vendor

`string`

##### model

`string`

#### Returns

`object`

##### fixtures

> **fixtures**: `unknown`[]

***

### renderRadioBlock()

> **renderRadioBlock**(`region`, `indent?`): `string`

Serialize a region's channel plan into the packet-forwarder channel
definitions (`chan_multiSF_0..7`, `chan_Lora_std`, `chan_FSK`) that the
`{{RADIO_BLOCK}}` token expands to. Pure.

Always emits eight `chan_multiSF` slots (slots beyond the region's channel
count are `{ "enable": false }`), so the block shape is identical across
regions and chipsets. The last line carries no trailing comma, so it drops
cleanly into a template's SX130x_conf body.

#### Parameters

##### region

[`RegionInfo`](#regioninfo)

The region manifest.

##### indent?

`number` = `4`

Leading spaces per line (default 4, matching a 2-space-indent
  JSON template's SX130x_conf children).

#### Returns

`string`

***

### templateText()

> **templateText**(`vendor`, `model`, `forwarder`): `string`

Read the raw template text for a model's packet forwarder. Throws if absent.

#### Parameters

##### vendor

`string`

##### model

`string`

##### forwarder

[`PacketForwarder`](#packetforwarder)

#### Returns

`string`

***

### validateConfig()

> **validateConfig**(`rendered`, `opts`): [`ConfigCheckResult`](#configcheckresult)

Validate a rendered config for a forwarder. Returns `{ valid, issues }`.

#### Parameters

##### rendered

`string`

The rendered config text (post-[renderConfig](#renderconfig)).

##### opts

###### forwarder

[`PacketForwarder`](#packetforwarder)

Which forwarder produced it.

#### Returns

[`ConfigCheckResult`](#configcheckresult)

***

### walkthrough()

> **walkthrough**(`vendor`, `model`): `string`

Raw `walkthrough.md` text for a model. Throws if the model is unknown.

#### Parameters

##### vendor

`string`

##### model

`string`

#### Returns

`string`
