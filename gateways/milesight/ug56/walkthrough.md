# Connect the Milesight UG56 Industrial LoRaWAN Gateway to ChirpStack

The **Milesight UG56 Industrial LoRaWAN Gateway** (SX1302) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **http://192.168.1.1** (AP-mode Wi-Fi SSID `Gateway_******`).
- Log in with default credentials **admin / password**.
- **Change the default credentials now.** Milesight default; a password change is forced on first login (5 wrong attempts = 10-min lockout). Reach it via the Wi-Fi AP (SSID Gateway_******, default Wi-Fi password iotpassword) at 192.168.1.1; the wired Ethernet (WAN, PoE PD) port is DHCP by default (legacy firmware used 192.168.23.150).

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above. Most gateway web UIs are a form — type the values in; there is no JSON to paste.

**Web UI (form):**

1. Open **Packet Forwarder → General → Multi-Destination**.
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

> Industrial indoor gateway (rugged metal enclosure), SX1302. Optional 4G LTE; native PoE PD 802.3af; Wi-Fi AP/client. Supports multiple simultaneous packet-forwarder destinations (Multi-Destination). Model string e.g. UG56-L04EU-868M.

---
_Catalog profile: `milesight/ug56`._
