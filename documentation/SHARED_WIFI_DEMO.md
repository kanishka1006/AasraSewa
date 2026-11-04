# Shared Wi‑Fi demo (second laptop)

This is how a teammate runs the **same AI Day demo** on their laptop on **your hotspot** (e.g. Summar).

## What is safe to share in Git

Committed code starts a **local** stack on each laptop. Each person runs `npm run setup` which creates **their own** ignored `.env` files (JWT, MQTT device password, etc.).

**Do not commit** real Wi‑Fi passwords, Atlas passwords, Gemini keys, or `config.h` / `.env.esp32`.

## Software demo (any laptop — recommended for teammates)

Works even without the physical User box:

```sh
git clone https://github.com/kanishka1006/AasraSewa.git
cd AasraSewa
npm run setup
npm start
```

Second terminal:

```sh
npm run doctor
npm run demo
```

Login: `+919999999999` / `password123`  
IoT Monitor: http://localhost:3002/admin/iot  
Rescue Ops → Stampede → http://localhost:3003

Optional Gemini: put `GEMINI_API_KEY` in **their** `backend/.env` (never commit it).

## Physical User band on *your* Summar hotspot

The band firmware contains:

- Wi‑Fi SSID/password (Summar)
- **One** gateway host = the laptop LAN IP that runs `npm run gateway`

So only **one control-room laptop** should own the band at a time.

### Owner laptop (band gateway)

1. Join Summar.
2. Note LAN IP (`ipconfig` / `ip addr`), e.g. `10.32.16.39`.
3. `npm start` then `npm run gateway` (or `./start-demo.sh`).
4. Ensure `iot/user-band/config.h` and `.env.esp32` use that same IP (from `npm run setup` / manual copy of `config.example.h`).
5. Flash `iot/user-band` once with that `config.h`.

### Teammate laptop on the same Summar

They can still run the **full software UI demo** (`npm start` + `npm run demo` + Stampede).

They **cannot** both receive the same ESP with different IPs unless you:

- reflash the ESP with **their** LAN IP, and  
- stop the owner’s gateway,

or they only watch the owner’s screen for hardware.

## Atlas MongoDB (optional shared cloud DB)

If you want every laptop to share the **same** seeded users in Atlas:

1. Each person sets the same `MONGODB_URI` in **local** `backend/.env` and `iot/.env` (gitignored).
2. Run seed once: `node dist/database/scripts/run-seed.js` from `backend/` after build.
3. Allow each laptop IP in Atlas Network Access (or temporarily `0.0.0.0/0` for the event day only).

Default `npm start` still works with **local** Mongo without Atlas.

## Quick rule

| Goal | What teammates do |
| --- | --- |
| Login + IoT SOS + Stampede portal | Clone → setup → start → demo |
| See **your** physical band | Look at **your** IoT Monitor (or reflash band to their IP) |
| Shared cloud users | Same Atlas URI in private `.env` + Network Access |
