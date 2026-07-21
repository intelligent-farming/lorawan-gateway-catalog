# Connect the MultiTech Conduit (MTCDT) to ChirpStack

The **MultiTech Conduit (MTCDT)** (SX1301 (MTAC-LORA card)) forwards LoRaWAN uplinks to a ChirpStack
Gateway Bridge. This walkthrough gets it online using the connection settings
and config Leftenant generated above.

## 1. Reach the gateway

- Open **https://192.168.2.1**.
- Log in with the per-device credentials from the label / vendor documentation.
- **Change the default credentials now.** mPower (AEP) has no factory login — first boot runs commissioning, where you create the admin username and password. Reach the UI at https://192.168.2.1 over the Ethernet LAN port. The packet-forwarder screen is a JSON editor (Manual Configuration), so the full config above pastes in directly.

## 2. Configure the forwarder

### Semtech UDP packet forwarder

Leftenant shows the **connection settings** (the values to enter) and the **full config file** above — use whichever your gateway's UI expects.

**Web UI (paste the config):**

1. Open **LoRaWAN → Network Settings → LoRa Mode: Packet Forwarder → Manual Configuration** and choose **Manual Configuration**.
2. Paste the **full config file above** into the JSON editor — it already targets your Gateway Bridge host on port 1700 — then save and restart the forwarder.

**File / SSH (advanced):**

1. Write the **full config file above** to `/var/config/lora/global_conf.json` and restart the packet forwarder. (Skip this if you used the web UI above.)

Confirm the **region and sub-band match your ChirpStack region exactly** — the most common silent join failure.

### LoRa Basics Station

Select **Basics Station** as the forwarder above to see the **LNS URI** in the connection settings.

**File-based (advanced):** create `tc.uri` (the LNS URI) and `tc.trust` (your LNS CA PEM) on the gateway and install the **`station.conf` above**.

Point it at the ChirpStack Gateway Bridge **Basics Station backend** (not the UDP backend).

## 3. Verify

- In ChirpStack, add the gateway with this EUI and watch it report stats.
- If it does not appear: re-check the server address/port, the Gateway EUI, and
  that the gateway's region/sub-band matches the ChirpStack region.

> Indoor programmable gateway (outdoor variant = MTCDTIP2). LoRa is a swappable MTAC-LORA mCard: MTAC-LORA-915/868 and MTAC-LORA-H are SX1301; the MTAC-003 ("LoRa 3") card is SX1302 (use the SX1302 radio block instead). mPower is a JSON editor — paste the config; mLinux stores it at /var/config/lora/global_conf.json. Basics Station needs an MTAC-LORA-H card and mPower >= 5.3.

---
_Catalog profile: `multitech/mtcdt`._
