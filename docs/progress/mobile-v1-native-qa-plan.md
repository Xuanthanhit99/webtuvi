# Mobile V1 — Native QA execution plan

Prepared 2026-10-15 (Asia/Bangkok) for PR #45.
**Preparation only. Android/iOS execution on the audited source HEAD has not occurred.**
See mobile-v1-parity-matrix.md for source gaps, API contracts and existing CI evidence.

## Preconditions and evidence record

- Finish the missing Mobile integration and local automated checks first.
- Record commit SHA, app/build ID, API origin, platform, OS, device/simulator model, locale, timezone and test start/end times.
- Use an isolated local/non-production API, database and genuine QA account. Never use a fabricated auth fixture or mocked calculation/interpretation as proof of this gate.
- Confirm DB/Redis and API readiness and HTTP access from the device; liveness alone is insufficient.
- Existing Android QA at d4cbb1c hit Expo Go ANR and unavailable API. Recheck current state; do not treat historical diagnosis as current reproduction.
- On Android emulator, the host API normally uses 10.0.2.2; verify the actual route/origin. Do not hard-code a production-origin change.
- For iOS, prepare a supported macOS/Xcode simulator or signed physical-device build and matching API reachability.
- Obtain the locked Web visual baseline and provenance. Do not manufacture a replacement baseline from current screenshots.
- Record each case as PASS, FAIL, BLOCKED or NOT TESTED with evidence. A screenshot of Home does not prove a complete tool flow.
- Redact credentials, tokens, email links and private content from logs/screenshots.

## Required cases

| ID | Flow | Required evidence / expected outcome |
|---|---|---|
| AUTH-01 | Register with terms; invalid fields; duplicate email response | Actual API response and native validation/error handling; no fabricated success |
| AUTH-02 | Email verification, resend, expired/invalid link; return to app | Profile refresh reflects server state; link handling and return destination recorded |
| AUTH-03 | Login, app relaunch, expired access token, rotated/revoked refresh token | Genuine stored-session restore/refresh; revoked credentials become guest; no token disclosure |
| AUTH-04 | Network loss, refresh 429/5xx, logout and account switch | Transient errors preserve credentials; logout clears protected cached data; second user cannot view first user's history |
| AUTH-05 | Forgot/reset password and applicable session management | Actual email/token flow, password change and server session behavior |
| ONB-01 | Message, consent accepted/declined, discovery accepted/skipped, completion/skip | Server-persisted onboarding state; relaunch/resume and correct protected navigation |
| TV-01 | Valid/invalid birth inputs; calculate and reopen | Returned chart ID/input/version; persistence after relaunch |
| TV-02 | Overview, all 12 palaces, stars/transformations and interpretation | Native content matches server chart; null interpretation has honest state and retry |
| TV-03 | Đại Vận/Tiểu Hạn navigation and missing legacy-cycle data | Values match server DTO; no invented child/legacy cycles or client recalculation |
| TV-04 | Paginated history/detail/archive/delete/restore | List/detail state agrees with backend after mutation, reload and relaunch |
| NAT-01 | Explicit birthplace search, select token, known/unknown birth time | Real geocoding result/token; unknown time omitted; server expiry/validation handled |
| NAT-02 | Chart, placements, aspects, houses and interpretation | Server housesAvailable/null angles respected; no invented houses; structured interpretation displayed |
| NAT-03 | History/reopen/archive/delete/restore/interpret retry | Genuine persisted chart IDs and lifecycle evidence |
| NUM-01 | Vietnamese/diacritic name, invalid name/date, calculate | Original and normalized names shown; backend owns validation/calculation |
| NUM-02 | Six core values, master numbers, breakdowns, meanings and personal-year metadata | All six returned types visible with correct values and meaning lookup |
| NUM-03 | History/reopen/archive/delete/restore/interpret retry | Backend persistence and filtered list consistency after relaunch |
| TAR-01 | Shuffle/select/reveal one and three cards; reversed card display | Server identities/orientation; proper order, both faces and individual interpretation |
| TAR-02 | Expired/reused token, daily limit, offline before/after draw | Genuine backend rejection; no automatic ambiguous-draw retry or local fabricated cards |
| TAR-03 | Active/archived/deleted filters, detail, history, archive/delete/restore | Persisted state across reload/relaunch; confirmation cancel has no mutation |
| TAR-04 | Reduced Motion before/during/after reveal; unmount and navigation | No delayed replay, stuck cards or animation after unmount |
| HOME-01 | Guest/authenticated/loading/error/empty Home, retry | Real dashboard response and honest error/empty states; no fixture proof |
| HOME-02 | All tool cards/Discover, direct route, login return | Each destination operates; no ComingSoon or dead action; fixed suggestions do not masquerade as live data |
| UX-01 | Small screen, keyboard, safe areas, scroll, portrait/landscape supported behavior | Inputs/actions reachable, no clipping/blocked history |
| A11Y-01 | Android TalkBack / iOS VoiceOver, labels, focus, touch targets | Execute separately on each platform; dump labels alone is insufficient |
| RES-01 | Background/foreground, interrupted request, repeated rapid actions | No duplicate draw/mutation, stale-account data or stuck loading; capture crash/ANR evidence if present |
| WEB-01 | Existing locked Web regression checks | No golden updates without authorization; final Web checks and source diff recorded |

## Per-platform result template

| Field | Android | iOS |
|---|---|---|
| Source SHA / build | NOT TESTED | NOT TESTED |
| Device and OS | NOT TESTED | NOT TESTED |
| API readiness and real account | NOT TESTED | NOT TESTED |
| AUTH / ONB | NOT TESTED | NOT TESTED |
| TV / NAT / NUM | NOT TESTED | NOT TESTED |
| TAR / HOME | NOT TESTED | NOT TESTED |
| UX / A11Y / RES | NOT TESTED | NOT TESTED |
| Evidence directory / manifest | None collected in this session | None collected in this session |
| Overall acceptance | NOT TESTED; historical Android QA blocked | NOT TESTED |

Keep screenshots, sanitized requests/responses, relevant logs and a file-hash manifest associated with the tested SHA.
A partial Android result cannot be promoted to iOS PASS. A mocked suite cannot be promoted to real-backend/native PASS.
