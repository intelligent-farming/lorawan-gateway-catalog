# Connect the RAK7240V2 WisGate Edge Prime to ChirpStack

The **RAK7240V2 WisGate Edge Prime** (SX1303 (up to two concentrators)) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **http://192.168.230.1** (AP-mode Wi-Fi SSID `RAK7240V2_XXXX`).
- Log in with the per-device credentials from the label / vendor documentation.
- **Change the default credentials now.** WisGateOS 2: log in as user `root` and set a new password on first boot (>=12 chars incl. a number, a letter, and a special char) — there is no factory default password.

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above. Most gateway web UIs are a form — type the values in; there is no JSON to paste.

**Web UI (form):**

1. Open **LoRa → LoRa Configuration (Work Mode: Packet Forwarder)**.
2. Set **Server Address** to your ChirpStack **Gateway Bridge** host, and **Server Port Up** / **Server Port Down** to **1700**.
3. Set the gateway's region/sub-band to match ChirpStack, then save.

Confirm the **region and sub-band match your ChirpStack region exactly** — the most common silent join failure.

### LoRa Basics Station

Select **Basics Station** as the forwarder above to see the **LNS URI** in the connection settings.

**Web UI (form):** in the gateway's Basics Station / LNS settings, set the **LNS URI** (a.k.a. TC URI) to `wss://<gateway-bridge-host>:3001` and upload your LNS trust (CA) certificate.

**File-based (advanced):** create `tc.uri` (the LNS URI) and `tc.trust` (your LNS CA PEM) on the gateway and install the **`station.conf` above**.

Point it at the ChirpStack Gateway Bridge **Basics Station backend** (not the UDP backend).

## 3. Verify

- In ChirpStack, add the gateway with this EUI and watch it report stats.
- If it does not appear: re-check the server address/port, the Gateway EUI, and
  that the gateway's region/sub-band matches the ChirpStack region.

> Current SKU replacing the EOL RAK7240 (SX1301, WisGateOS 1). Outdoor (IP65), WisGateOS 2, SX1303. RAK7240V2 (no LTE) and RAK7240CV2 (LTE, AP SSID RAK7240CV2_XXXX) share this config skeleton. This profile configures a single 8-channel chain.

---
_Catalog profile: `rakwireless/rak7240v2`._
