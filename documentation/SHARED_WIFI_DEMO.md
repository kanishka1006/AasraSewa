# Shared Wi‑Fi demo (teammate laptops)

Everyone joins **your Summar hotspot**, clones the repo on **their own laptop**, and runs the full stack locally. Each machine is independent — they do not open your browser URLs.

## What you share (privately, not in Git)

| Share out of band | Do **not** commit |
| --- | --- |
| Summar SSID + password | Wi‑Fi password in `config.h` |
| Optional: Atlas `MONGODB_URI` | Atlas password / Gemini key |
| Optional: Gemini key for Stampede AI | `.env`, `.env.esp32`, real `config.h` |

## Teammate steps (software demo on their laptop)

1. Join **Summar**.
2. Clone and start:

```sh
git clone https://github.com/kanishka1006/AasraSewa.git
cd AasraSewa
npm run setup
npm start
```

3. Second terminal:

```sh
npm run doctor
npm run demo
```

4. On **their** machine:

| App | URL |
| --- | --- |
| Login | http://localhost:3002 — `+919999999999` / `password123` |
| IoT Monitor | http://localhost:3002/admin/iot |
| Rescue / Stampede | http://localhost:3003 |

`npm run setup` creates **their own** ignored `.env` files (JWT, local MQTT password, etc.).

Optional Gemini: put `GEMINI_API_KEY` in **their** `backend/.env`.

## Physical User band / boxes

Firmware is locked to **Summar** + **one** MQTT host IP (the laptop that runs `npm run gateway`).

| Role | What to do |
| --- | --- |
| **Host (you)** | Summar → `npm start` → `npm run gateway` → power the band. Live SOS on your IoT Monitor. |
| **Teammates** | Software demo with `npm run demo` (simulated SOS). To own the real band: stop host gateway, put **their** Summar LAN IP in `iot/user-band/config.h`, reflash, then `npm run gateway` on their laptop. |

Only one gateway should own the band at a time.

## Optional: same Atlas users on every laptop

1. Same `MONGODB_URI` in each person’s local `backend/.env` and `iot/.env`.
2. Seed once from `backend/` after build.
3. Atlas Network Access allows their IPs (or temporary `0.0.0.0/0` for the event day).

Without Atlas, each laptop uses its own local Mongo from `npm start`.

## Quick rule

| Goal | What teammates do |
| --- | --- |
| Full UI + simulated SOS + Stampede | Join Summar → clone → setup → start → demo |
| See the **physical** band | Watch host screen, or reflash band to their IP + their gateway |
| Shared cloud users | Same Atlas URI in private `.env` |
