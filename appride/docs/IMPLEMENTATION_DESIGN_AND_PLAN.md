# UltraGo — Implementation Design & Plan

Student MVP for learning ride-hailing with **React Native (Expo)**, **TypeScript**, and **Firebase only** as backend.

---

## 1. Goals & constraints

| Goal | How we satisfy it |
|------|-------------------|
| No custom server | Firebase Auth, Firestore, Storage (optional), FCM via Expo Notifications |
| Beginner-friendly | Small modules, comments in code, one navigation model |
| Uber-like UX | Primary `#FBC02D`, secondary `#F5F5F5`, tabs + map-first rider screen |
| Real-time rides | Firestore documents + `onSnapshot` listeners |

**Non-goals for MVP:** payments, driver verification, surge pricing, production security rules without review.

---

## 2. Architecture (high level)

```
┌─────────────────────────────────────────────────────────┐
│                    Expo app (TypeScript)                   │
│  Screens → Context (Auth) / Zustand (ride UI) → Services │
└───────────────────────────┬─────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   Firebase Auth    Firestore       Maps / Location
   (email/password)  (rides, users)  (Google + expo-location)
```

- **Auth:** `AuthContext` hydrates user + `users/{uid}` profile; persistent session via AsyncStorage + Firebase `initializeAuth`.
- **Data:** All ride/driver/user state in Firestore; clients read/write directly (MVP rules — tighten before production).
- **Maps:** `react-native-maps` + current GPS; keys from `EXPO_PUBLIC_*` via `app.config.ts`.
- **Push:** `expo-notifications` bootstrap; full FCM wiring in a later phase.

---

## 3. Tech stack (strict)

| Layer | Choice |
|-------|--------|
| App shell | Expo SDK 54, React 19, React Native 0.81 |
| Language | TypeScript |
| Navigation | React Navigation (native stack + bottom tabs) |
| Global state | Context (auth) + Zustand (active ride slice) |
| Backend | Firebase JS SDK: Auth, Firestore; Storage optional |
| Maps | Google Maps (`react-native-maps`, `PROVIDER_GOOGLE`) |
| Location | `expo-location` |
| Notifications | `expo-notifications` (Android FCM path with EAS when you add credentials) |

---

## 4. Repository layout

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Providers, notification init |
| `src/context/AuthContext.tsx` | Session, profile, Firebase configured flag |
| `src/navigation/*` | Root, auth stack, main tabs |
| `src/screens/*` | Auth, rider, driver, account, trip history, setup |
| `src/components/ui/*` | Reusable buttons, inputs, screen shell |
| `src/components/maps/*` | Map wrapper |
| `src/services/firebase/*` | App init, auth persistence, Firestore helper |
| `src/services/auth/*` | Email auth; phone scaffold (`phoneAuth.ts`) |
| `src/services/users/*` | Firestore user profile |
| `src/services/rides/*` | Create ride, subscribe, history, driver actions, earnings |
| `src/services/drivers/*` | Online/offline presence |
| `src/services/matching/*` | Simulated nearby drivers (class demos) |
| `src/services/notifications/*` | Push handler stub |
| `src/theme/*`, `src/types/*`, `src/utils/*` | Design tokens, TS types, fare helpers |
| `app.config.ts` | Env → `extra`, Maps keys, Expo plugins |
| `.env` / `.env.example` | Public Expo env vars (`EXPO_PUBLIC_*`) |
| `firebase/firestore.rules` | Starter rules (dev-only posture) |

Parent folder `uber appride-website` has a **root `package.json`** that proxies `npm run install:app` and `npm start` into `./appride`.

---

## 5. Firestore data model (MVP)

### Collections

| Collection | Document ID | Main fields |
|------------|---------------|--------------|
| `users` | `uid` | `email`, `displayName`, `role`, `driverModeEnabled`, optional `pushToken` |
| `drivers` | `uid` | `isOnline`, `location` (GeoPoint), `updatedAt` |
| `rides` | auto-id | `userId`, `driverId?`, `pickupLocation`, `destination`, `status`, `fare`, `timestamp` |

### Ride `status` values (string)

`requested` → `searching` → `driver_accepted` → `driver_arriving` → `in_progress` → `completed` (or `cancelled`).

**Current code:** creates rides in `searching`; driver advances status through `driver_accepted` → `driver_arriving` → `in_progress` → `completed`. Rider listens in real time and receives local notifications on key transitions.

---

## 5b. Current milestone (what is implemented now)

- **App icon:** `assets/uberlogo.png` used for Expo icon, splash, adaptive foreground, favicon, and in-app auth branding (UltraGo).
- **Phase 9:** `subscribeToRide` normalizes Firestore data; rider tracks `riderTrackedRideId` in Zustand; driver tracks `driverActiveRideId` and advances the ride lifecycle via `rideLifecycle.ts`.
- **Phase 10:** Expo push token saved to `users` (`merge`); local notifications on rider status changes (`useLocalRideStatusNotifications`). Server-driven FCM is still optional homework.
- **Phase 11:** Trip list uses normalized rides; earnings refresh when a trip is completed from the driver UI.
- **Phase 12:** `RideLiveBanner` pulse while `searching`; refined cards and shadows on rider/driver/history screens.

---

## 6. Feature plan vs implementation status

Use this as a checklist for coursework demos.

| Phase | Topic | Status | Notes |
|-------|--------|--------|--------|
| 1 | Folder structure, deps, theme | Done | See `src/` tree |
| 2 | Firebase config, Auth, Firestore helpers | Done | `.env` + `app.config.ts` |
| 3 | Auth screens (email), profile on signup | Done | `UltraGoAuthScreen` (login + signup, premium UI) |
| 4 | Navigation | Done | Auth stack + main tabs |
| 5 | Reusable UI | Done | `AppButton`, `AppTextField`, `Screen`, `LoadingOverlay` |
| 6 | Map + GPS | Done | `RiderHomeScreen`, `RideMapView` (pickup→destination **Polyline** preview + live ride path) |
| 7 | Ride request + fare estimate | Done | `RideRequestPanel`, haversine MVP fare |
| 8 | Driver mode, online, accept | Done | Account toggle, `DriverHomeScreen` |
| 9 | Real-time listeners | Done | Rider + driver `subscribeToRide`; Zustand `riderTrackedRideId` / `driverActiveRideId` |
| 10 | FCM / push on status changes | Partial (MVP) | Local notifications + Expo token on `users`; Cloud Function FCM optional |
| 11 | Trip history + earnings | Done (MVP) | Activity tab + driver earnings refresh on complete |
| 12 | Animations + polish | Partial | Searching pulse, card polish; more motion optional |

### Near-term implementation backlog (suggested order)

1. ~~**Route polyline**~~ — **Done (MVP):** straight `Polyline` + destination marker in `RideMapView` from demo pickup/destination or live `Ride` doc. Optional later: Google Directions for road-snapped routes.
2. **Server push (FCM)** — Cloud Function on `rides/{id}` writes → FCM; or Expo Push API from a minimal trusted backend (still optional for class).
3. **Firestore security rules** — Replace permissive template with `request.auth.uid`-scoped rules.
4. **Phone auth** — Choose strategy (Expo dev client + native Firebase vs email-only course policy).
5. **Places autocomplete** — Pickup/destination search instead of demo offset coordinates.

---

## 7. Configuration checklist (before each demo)

- [ ] Copy `appride/.env.example` → `appride/.env` and fill Firebase + Maps keys.
- [ ] Firebase Console: Email/Password enabled; Firestore created; rules published.
- [ ] Google Cloud: Maps SDK for Android + iOS enabled for your key.
- [ ] Run from **`appride`** or use root `npm run install:app` then `npm start`.
- [ ] Same Wi‑Fi as phone, or use Expo **tunnel** if LAN fails.
- [ ] Expo Go updated to support **SDK 54**.

If Firebase env is missing, the app shows **Configure Firebase first** instead of crashing.

---

## 8. Testing scenarios (acceptance-style)

1. **Cold start:** Open app → see login or setup screen (never blank crash).
2. **Sign up / sign out / sign in** → profile row exists in `users`.
3. **Rider:** Ride tab → location → request ride → document in `rides` with `searching`.
4. **Driver:** Account → driver mode ON → Drive tab → online → see open ride → Accept → rider sees status update if listener active.
5. **Activity:** Past rides listed for current `userId`.
6. **Earnings:** Completed rides with `driverId` + `completed` increment driver view (when you add completion step).

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Windows `node_modules` / tar errors | Close processes, delete `node_modules`, reinstall; antivirus exclusion |
| Expo Go “Something went wrong” | Fix `.env`; read Metro red screen; use setup screen + logs |
| Maps blank | Valid `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` + billing |
| Firestore permission denied | Rules + user must be signed in |

---

## 10. References (official)

- [Expo](https://docs.expo.dev/)
- [Firebase Auth (Web)](https://firebase.google.com/docs/auth/web/start)
- [Firestore](https://firebase.google.com/docs/firestore)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps)

---

*Last aligned with the UltraGo codebase in `appride/`. Update this doc when you add phases or change collections.*
