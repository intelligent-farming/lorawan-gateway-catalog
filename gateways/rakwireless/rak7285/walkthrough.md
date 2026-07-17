# Connect the RAK7285 WisGate Edge Ultra to ChirpStack

The **RAK7285 WisGate Edge Ultra** (SX1303) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **http://192.168.230.1** (AP-mode Wi-Fi SSID `RAK7285_XXXX`).
- Log in with the per-device credentials from the label / vendor documentation.
- **Change the default credentials now.** WisGateOS 2: log in as user `root` and set a new password on first boot — there is no factory default password. The AP-mode SSID also appears as RAK7285C_XXXX on the LTE (C) variant.

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above. Most gateway web UIs are a form — type the values in; there is no JSON to paste.

**Web UI (form):**

1. Open **LoRa Network → Network Settings (Work Mode: Packet Forwarder)**.
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

> WisGateOS 2 (OpenWrt) web UI; the SX1303 is full-duplex. RAK7285 and RAK7285C (C = LTE Cat-4) share this config skeleton.

---
_Catalog profile: `rakwireless/rak7285`._
