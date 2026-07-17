# Connect the DLOS8 Outdoor LoRaWAN Gateway to ChirpStack

The **DLOS8 Outdoor LoRaWAN Gateway** (SX1301) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **http://10.130.1.1** (AP-mode Wi-Fi SSID `dragino-XXXXXX`).
- Log in with default credentials **root / dragino**.
- **Change the default credentials now.** LuCI (OpenWrt) default; change it on first login. Same firmware family as the LPS8. 10.130.1.1 is the Wi-Fi AP-mode IP (SSID dragino-xxxxxx, Wi-Fi password dragino+dragino); over Ethernet, browse to the DHCP-assigned IP on port 8000.

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above. Most gateway web UIs are a form — type the values in; there is no JSON to paste.

**Web UI (form):**

1. Open **LoRaWAN → LoRaWAN Semtech UDP**.
2. Set **Server Address** to your ChirpStack **Gateway Bridge** host, and **Server Port Up** / **Server Port Down** to **1700**.
3. Set the gateway's region/sub-band to match ChirpStack, then save.

**File / SSH (advanced):**

1. Write the **full config file above** to `/etc/lora/global_conf.json` and restart the packet forwarder. (Skip this if you used the web UI form — the firmware manages that file.)

Confirm the **region and sub-band match your ChirpStack region exactly** — the most common silent join failure.

## 3. Verify

- In ChirpStack, add the gateway with this EUI and watch it report stats.
- If it does not appear: re-check the server address/port, the Gateway EUI, and
  that the gateway's region/sub-band matches the ChirpStack region.

---
_Catalog profile: `dragino/dlos8`._
