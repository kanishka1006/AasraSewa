# Sealed USB GPS demo (Windows)

The connected device on COM4 was identified as USB VID 1546 / PID 01A6
(u-blox 6 GPS receiver). Its USB port exposes GPS NMEA output. It does not
establish access to the User unit's controller, button, vitals or the other boxes.
No enclosure needs opening and no firmware is uploaded for this test.

## Run

1. Start the local services using the [local run guide](../LOCAL-RUN.md).
2. Close Arduino Serial Monitor or any other program holding the GPS COM port.
3. Connect the GPS USB port with a data cable. Confirm the port in Device Manager.
4. Place the GPS face up with a clear view of the sky and wait for a valid fix.
5. From the repository root, run:

   ```powershell
   npm run gps -- --port COM4 --verify
   ```

The command uses Windows PowerShell's serial reader and the existing Node MQTT
dependency; no additional packages are required. It opens the port read-only in
the application sense: it sends no serial commands and leaves DTR/RTS disabled.
The default baud setting is 9600. Override with `--baud` if needed.
The bridge publishes at most once every five seconds, only on a newly received,
checksum-valid GGA/RMC position with an accepted fix status. It does not publish
invalid/estimated positions, invent coordinates, or replay the last known fix.
The packet timestamp is the laptop's receive time; the GPS UTC/date fields are
retained separately in the raw payload. Keep the laptop clock correct.

The default topic is `bands/00:1B:44:11:3A:B7/telemetry`, using the seeded active
wearer Rohan Gupta. Source is **usb-gps**, with no heart rate, oxygen, temperature,
battery or SOS button measurement supplied. The normal payload has `sos: false`;
it does not resolve an existing alert. Use Ctrl+C to release the COM port.

`--verify` logs in and checks that the first actual GPS packet reached the
authenticated location API. For a bounded test that exits after verification:

```powershell
npm run gps -- --port COM4 --once --timeout 60
```

Exit code 0 means the real GPS packet reached the API, 2 means no verified
position arrived before the deadline, and 1 means an operational failure.
A no-fix timeout does not mean USB is broken. The program reports satellites
in view and used while waiting. No fabricated packet is sent to make it pass.

Open http://localhost:3002/admin/iot after signing in with the seeded administrator
`+919999999999` / `password123`. Confirm the **usb-gps** publisher, advancing
timestamps and real position. Optional vitals must show **Not reported**.
Disconnecting the unit stops updates; the row becomes stale after 15 seconds.

## Software SOS check

Separately, with the GPS bridge stopped, `npm run demo` exercises synthetic
telemetry, SOS creation, repeat handling and resolution. It uses the same band
and overwrites the latest location with labelled **simulator** data. Restart
the GPS bridge afterwards to restore a real reading once a fix is available.
This does not verify the physical green button, radio links, Receiver display,
Control Room display, rescue dispatch or sensor measurements.

Reference: [u-blox receiver protocol](https://content.u-blox.com/sites/default/files/products/documents/u-blox6-GPS-GLONASS-QZSS-V14_ReceiverDescrProtSpec_%28GPS.G6-SW-12013%29_Public.pdf).
