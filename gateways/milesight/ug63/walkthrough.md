# Connect the Milesight UG63 Mini LoRaWAN Gateway to ChirpStack

The **Milesight UG63 Mini LoRaWAN Gateway** (SX1302) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **http://192.168.1.1** (AP-mode Wi-Fi SSID `Gateway_******`).
- Log in with default credentials **admin / password**.
- **Change the default credentials now.** Milesight default; a password change is prompted on first login (firmware V2.2+). Reach it via the Wi-Fi AP (SSID Gateway_******) at 192.168.1.1; the wired Ethernet (WAN) port is DHCP by default.

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above. Most gateway web UIs are a form — type the values in; there is no JSON to paste.

**Web UI (form):**

1. Open **Packet Forward → General → Destination**.
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

> Compact "mini" indoor gateway, SX1302, 8 channels. Optional 4G LTE Cat 1 (SKUs L08GL global / L09NA North America); PoE via an 802.3af splitter; USB-C / DC power. Forwards to a single destination; the embedded network server is capped at ~20 devices.

---
_Catalog profile: `milesight/ug63`._
