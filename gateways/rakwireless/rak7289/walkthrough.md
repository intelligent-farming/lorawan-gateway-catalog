# Connect the RAK7289 WisGate Edge Pro to ChirpStack

The **RAK7289 WisGate Edge Pro** (SX1303 (up to two concentrators)) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **http://192.168.230.1** (AP-mode Wi-Fi SSID `RAK7289_XXXX`).
- Log in with default credentials **root / root**.
- **Change the default credentials now.** WisGateOS 1 default; firmware-dependent — change it on first login. Never present as a security guarantee.

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

> Runs WisGateOS 1. Supports up to two SX1303 concentrators (8ch / optional 16ch); this profile configures a single 8-channel chain, sufficient to connect to ChirpStack. The original RAK7289/C is EOL — the RAK7289V2 is the current successor.

---
_Catalog profile: `rakwireless/rak7289`._
