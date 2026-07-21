# Connect the Makerfabs SX1302 LoRaWAN Gateway (SenseCAP M2) to ChirpStack

The **Makerfabs SX1302 LoRaWAN Gateway (SenseCAP M2)** (SX1302) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **http://192.168.168.1** (AP-mode Wi-Fi SSID `SenseCAP_XXXXXX`).
- Log in with the per-device credentials from the label / vendor documentation.
- **Change the default credentials now.** This is Seeed SenseCAP M2 hardware (MediaTek MT7628 / OpenWrt "SenseCAP Local Console") resold by Makerfabs. Web login is per-unit — the username/password are printed on the device label. Reach it at http://192.168.168.1 over Ethernet (DHCP) or the Wi-Fi AP SenseCAP_XXXXXX (default Wi-Fi password 12345678).

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above — use whichever your gateway's UI expects.

**Web UI (form):**

1. Open **LoRa → LoRa Network (Work Mode: Packet Forwarder)**.
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

> Semtech SX1302, indoor. Sold by Makerfabs; hardware is the Seeed SenseCAP M2. Use Packet Forwarder mode pointed at your ChirpStack Gateway Bridge (UDP :1700). For Basics Station, set the LNS URI to your Gateway Bridge (wss://<host>:3001) — not the SenseCAP cloud default (:8887). The Gateway EUI is Seeed-assigned and printed on the label (OUI 2CF7F1; verify the exact prefix on your unit).

---
_Catalog profile: `makerfabs/sx1302`._
