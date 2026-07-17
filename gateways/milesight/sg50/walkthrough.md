# Connect the Milesight SG50 Solar LoRaWAN Gateway to ChirpStack

The **Milesight SG50 Solar LoRaWAN Gateway** (SX1302) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **http://192.168.23.1** (AP-mode Wi-Fi SSID `Gateway_******`).
- Log in with default credentials **admin / password**.
- **Change the default credentials now.** Milesight default; you are advised to change it on first login. The SG50 has no wired Ethernet — 192.168.23.1 is its Wi-Fi AP address (SSID Gateway_******); setup is over Wi-Fi or cellular.

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above. Most gateway web UIs are a form — type the values in; there is no JSON to paste.

**Web UI (form):**

1. Open **Packet Forward → General**.
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

> Solar-powered with LTE Cat 1 backhaul and integrated GPS; the same Milesight GUI family as the UG65/UG67 (the Packet Forwarder Type selector offers Semtech / ChirpStack / Basics Station). SKU variants include SG50-L04EU-868M (EU868) and SG50-L08GL-915M (global 915).

---
_Catalog profile: `milesight/sg50`._
