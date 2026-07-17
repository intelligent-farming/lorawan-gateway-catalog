# Connect the MikroTik wAP LR8 kit to ChirpStack

The **MikroTik wAP LR8 kit** (SX1301) runs **RouterOS**. There are two ways to point
its LoRa concentrator at a ChirpStack Gateway Bridge.

## 1. Reach the gateway

- Open **http://192.168.88.1** (WebFig/WinBox), or SSH in (Wi-Fi SSID `MikroTik-XXXXXX`).
- Log in as `admin` with no password, and **set a password now.**

## 2a. RouterOS native (recommended)

RouterOS forwards uplinks over the Semtech UDP protocol. Add a server (protocol
UDP is the default; up/down ports default to 1700) and enable LoRa. In the IoT
package (RouterOS v7.11+):

```
/iot lora servers add name=chirpstack address=<gateway-bridge-host> up-port=1700 down-port=1700
/iot lora enable [find]
```

(On the legacy standalone LoRa package the menu is `/lora servers add ...`.) Set
the region to match your ChirpStack region/sub-band. Servers live in the
`servers` sub-menu — they are not properties on the LoRa interface, and there is
no fixed `lora1` interface name; use `[find]`.

## 2b. Semtech UDP global_conf (advanced / Semtech packet forwarder)

The wAP LR8 kit carries a standard SX1301 concentrator (R11e-LR8). If you run the
Semtech UDP packet forwarder directly on the device (container/custom build)
instead of RouterOS's native forwarder, use the **full `global_conf.json` above**
(radio block from the region channel plan, server address and EUI already filled
in) and point it at the Gateway Bridge **UDP backend on :1700**.

> The wAP LR8 kit (RBwAPR-2nD&R11e-LR8, SX1301) is superseded by the wAP LR8G kit
> (updated 868 MHz module). The wAP LR9 kit is the 902-928 MHz sibling, not a
> successor.

## 3. Verify

- Add the gateway in ChirpStack with this EUI and watch it report stats.
- If it does not appear: re-check the server address/port, the Gateway EUI, and
  that the region/sub-band matches the ChirpStack region.

---
_Catalog profile: `mikrotik/wap-lr8-kit`._
