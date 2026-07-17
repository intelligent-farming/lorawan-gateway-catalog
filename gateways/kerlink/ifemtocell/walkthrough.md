# Connect the Kerlink Wirnet iFemtoCell to ChirpStack

The **Kerlink Wirnet iFemtoCell** (SX1301) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **https://192.168.120.1** (AP-mode Wi-Fi SSID `klk-wifc-XXXXXX`).
- Log in with default credentials **admin / admin**.
- **Change the default credentials now.** KerOS web admin default is admin/admin (newer firmware: admin/pwd4admin) — change it. The SSH root password is per-device: pdmk-XXXXXX (last 6 chars of the Board ID on the label). 192.168.120.1 is the local USB/Wi-Fi-AP management address; the Ethernet port is a DHCP client, so use its assigned IP on the LAN.

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above. Most gateway web UIs are a form — type the values in; there is no JSON to paste.

**File / SSH:**

1. Write the **full config file above** to `/user/spf/etc/global_conf.json` and restart the packet forwarder. (Skip this if you used the web UI form — the firmware manages that file.)

Confirm the **region and sub-band match your ChirpStack region exactly** — the most common silent join failure.

## 3. Verify

- In ChirpStack, add the gateway with this EUI and watch it report stats.
- If it does not appear: re-check the server address/port, the Gateway EUI, and
  that the gateway's region/sub-band matches the ChirpStack region.

> KerOS default is the Common Packet Forwarder (lorafwd, TOML at /etc/lorafwd/lorafwd.toml) feeding the ChirpStack Gateway Bridge. This JSON global_conf applies only if you run the Semtech UDP packet forwarder (SPF) instead — its config lives at /user/spf/etc/global_conf.json. Do not confuse with the newer iFemtoCell-evolution (SX1308-class), a different product.

---
_Catalog profile: `kerlink/ifemtocell`._
