# AI DAY 2026 · Complete stall script — AasraSewa

Use this at the stall. Easy English. **Bold** lines are what you speak. Normal lines are what you click.

---

## 0) Before visitors (keep running all day)

On **your** laptop (host — owns Wi‑Fi + boxes):

1. Join **Summar** hotspot.
2. Terminal 1: `npm start` (leave open).
3. Terminal 2: `npm run gateway` (for real band).
4. Tabs logged in (`+919999999999` / `password123`):
   - **Control room / IoT:** http://localhost:3002/admin/iot  
   - **Rescue Ops:** http://localhost:3002/admin/rescue  
   - **Field portal:** http://localhost:3003  
5. Band powered on Summar. Stop `npm run demo` when showing the **real** band (same band ID).

Teammates: join Summar, clone + `npm start` + `npm run demo` for **software only**. Live boxes stay on **your** screen.

---

## 1) Official stall script (Selected Projects format)

Speak this when someone stops for ~20 seconds.

```
AI DAY 2026  ·  STALL SCRIPT

AasraSewa

20 second introduction

Hello, and welcome to AasraSewa. It is an AIoT safety platform for disasters,
crowded events and pilgrimage routes. Smart bands send live location and health
data, the control room sees SOS alerts in real time, and AI helps build a short
rescue plan for the field team.

<<Demo>>

<<Later>> The wearable watches the person. When SOS is pressed, or risk rises,
the control room sees who needs help and where they are. For crowd emergencies,
the admin creates a mission, AI turns location and weather into a tactical plan,
and the rescue portal shows that plan to responders so they can confirm
deployment and move faster. The same flow works with a software simulator for
the stall, and with real User band hardware when the band is connected.

<<Optional demo example>> At the stall we show a full loop: live or simulated
band SOS on the control-room monitor, then a stampede mission with AI briefing
on the rescue portal, and Confirm Deployment by the field team.
```

**One-line tagline (poster / judges):**  
AasraSewa — AIoT disaster and pilgrimage safety: wearable SOS → control room → AI rescue plan → field deployment.

---

## 2) First idea (problem → solution) — 45 seconds

**“In stampedes, floods, or pilgrimage crowds like Vaishno Devi, people get lost or hurt and responders waste time finding who needs help and where.”**

**“AasraSewa puts a smart band on the person. The band sends location and health. One SOS button. The control room sees the alert live. For a crowd incident, AI writes a short tactical plan, and the rescue team sees it on a field portal and confirms deployment.”**

**“So: sense → alert → AI plan → act. Hardware plus software in one loop.”**

---

## 3) Live demo — simple English + screens

Screens ready before you start:

| Tab | Screen | URL |
| --- | --- | --- |
| 1 | **IoT Monitor** (control room) | http://localhost:3002/admin/iot |
| 2 | **Rescue Ops** (admin missions) | http://localhost:3002/admin/rescue |
| 3 | **Rescue Portal** (field team) | http://localhost:3003 |

Login: `+919999999999` / `password123`

---

### DEMO A — Hardware (band → control room)

**Screen:** Tab 1 — **IoT Monitor**

1. **Hold the User band**  
   Say: **“This is the User band. It uses the same Wi‑Fi as our laptop. It sends data to our gateway.”**

2. **Show IoT Monitor on screen**  
   Say: **“This is the control room. You can see live data from the band — location and health updates.”**

3. **Point to the map on the same screen**  
   Say: **“The map shows Katra, near Vaishno Devi. That is our pilgrimage safety demo.”**

4. **Press SOS on the band**  
   Say: **“If someone is in danger, they press one SOS button. No phone app needed.”**

5. **Wait for the alert on IoT Monitor**  
   Say: **“Look — the alert is on the screen now. This is real data from the hardware, not a slide.”**

6. **Resolve the alert if you want**  
   Say: **“When help arrives, the operator can mark it resolved.”**

**If the band fails:** run `npm run demo` in another terminal.  
Say: **“This is our software simulator. Same screen, same flow — we say clearly it is simulated.”**

**Bridge to Demo B:**  
Say: **“So the band tells us who needs help and where. Next we show what the rescue team should do in a crowd emergency.”**

---

### DEMO B — Software + AI (stampede → field portal)

**Screens:** Tab 2 **Rescue Ops**, then Tab 3 **Rescue Portal**

1. **Open Rescue Ops** → click **+ New Mission** → choose **Stampede**  
   Say: **“Now a crowd emergency — like a stampede. The admin creates a new mission.”**

2. **Show the crowd map and wait for AI (up to ~25 seconds)**  
   Say: **“The map shows a busy crowd area. While we wait, AI writes a short 4-point rescue plan.”**

3. **When the plan appears, read 1 or 2 lines** → click **Dispatch Crowd Control**  
   Say: **“Here is the AI plan. We dispatch it to the field team with one click.”**

4. **Switch to Rescue Portal** (`:3003`) → open the new mission  
   Say: **“This screen is for the rescue team. They see the same mission and the same AI plan.”**

5. **Optional: Play Briefing** → click **Confirm Deployment**  
   Say: **“They can play the briefing, then confirm deployment. Detect → AI plan → field team confirms. Together with the band SOS, that is the full system.”**

---

### 90-second cut (busy queue)

| Step | Screen | Say |
| --- | --- | --- |
| Press SOS | IoT Monitor | **“Live hardware alert.”** |
| Stampede → wait AI → Dispatch | Rescue Ops | **“AI makes the plan.”** |
| Confirm Deployment | Rescue Portal | **“Field team confirms.”** |
| Close | any | **“Sense, alert, plan, act.”** |

---

## 4) Closing (say this at the end)

**“AasraSewa connects the person in danger, the control room, and the rescue team. The band gives real data. AI gives a clear plan. Thank you.”**

GitHub if asked: `https://github.com/kanishka1006/AasraSewa`

---

## 5) Short Q&A (ready answers)

| They ask | You say |
| --- | --- |
| Where is AI? | **Stampede mission → Gemini tactical plan on admin + shown on rescue portal. Also a local Python risk-score service for vitals thresholds.** |
| Does it work offline? | **Demo today is on local Wi‑Fi (Summar). Architecture aims for last-known location when network drops; live demo needs the hotspot.** |
| Real GPS? | **Band can take GPS; this stall uses a fixed Katra demo point so we don’t depend on outdoor fix.** |
| Stack? | **ESP / MQTT → NestJS + Mongo → Next.js admin + rescue portal → optional Gemini.** |
| Teammate laptop? | **They run the software demo on Summar. Live box stays on this host laptop.** |
| Security? | **Local trusted network demo. Production would need TLS, real auth, no shared demo passwords.** |

---

## 6) Stall roles (who speaks / who clicks)

| Person | Job |
| --- | --- |
| Speaker 1 | 20s intro + problem/solution + closing |
| Speaker 2 | Clicks Demo A (band + IoT Monitor) |
| Speaker 3 | Clicks Demo B (stampede + portal) |
| Host laptop owner | Keeps `npm start` + gateway alive; re-login if JWT expires (access tokens last 7 days) |

---

## 7) Do / don’t

**Do:** IoT Monitor for hardware truth · Rescue portal for AI dispatch · Say “simulator” when using `npm run demo`.

**Don’t:** Promise city-wide deploy · Claim Overview/Live Map sample stats as live · Run simulator and real band on same ID at once · Reflash band mid-crowd unless planned.
