# Connect the Kerlink Wirnet iStation to ChirpStack

The **Kerlink Wirnet iStation** (SX1301) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **https://<gateway-ip>** (AP-mode Wi-Fi SSID `klk-wiis-XXXXXX`).
- Log in with default credentials **admin / pwd4admin**.
- **Change the default credentials now.** KerOS web admin: admin/pwd4admin (older firmware admin/admin; KerOS 6.4+ uses a unique per-device factory password). SSH root password is per-device: pdmk-XXXXXX (last 6 of the Board ID). The Ethernet port is a DHCP client — reach the box at its assigned IP (Wi-Fi-AP SSID klk-wiis-XXXXXX).

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above — use whichever your gateway's UI expects.

**File / SSH:**

1. Write the **full config file above** to `/user/spf/etc/global_conf.json` and restart the packet forwarder.

Confirm the **region and sub-band match your ChirpStack region exactly** — the most common silent join failure.

### LoRa Basics Station

Select **Basics Station** as the forwarder above to see the **LNS URI** in the connection settings.

**File-based (advanced):** create `tc.uri` (the LNS URI) and `tc.trust` (your LNS CA PEM) on the gateway and install the **`station.conf` above**.

Point it at the ChirpStack Gateway Bridge **Basics Station backend** (not the UDP backend).

## 3. Verify

- In ChirpStack, add the gateway with this EUI and watch it report stats.
- If it does not appear: re-check the server address/port, the Gateway EUI, and
  that the gateway's region/sub-band matches the ChirpStack region.

> Outdoor (IP67), KerOS — same platform as the Wirnet iFemtoCell. Classic iStation is SX1301; the iStation M2 is SX1302 (+SX1250) — use the SX1302 radio block for an M2. KerOS default forwarder is the Common Packet Forwarder (lorafwd, TOML at /etc/lorafwd/lorafwd.toml); this JSON global_conf applies to the Semtech UDP packet forwarder (SPF) at /user/spf/etc/global_conf.json.

---
_Catalog profile: `kerlink/istation`._
