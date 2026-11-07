# ByteFall code review for Claude

Reviewed source: EmptyFishTank-JB/ByteFall at commit fba704ac24e4023d74b69aa34edd9b121bf76d32.
Review date: October 29, 2026.
Method: static inspection only. These are code-supported failure scenarios, not runtime reproductions. Revalidate against current main before implementing. This was a targeted review, not an exhaustive audit.

Scope inspected: billing.js, unlocks.js, store.js, saver.js, player.js, extsource.js, Android MainActivity billing paths, and package.json. No implementation changes were made.

## 1. High: pending microphone request survives cancellation

Location: js/extsource.js — startMic(), start(), stop(); js/player.js — useSource(), playerSource.rest(), close().

Evidence:
- startMic() awaits getUserMedia(), then unconditionally creates an AudioContext and assigns the resulting stream to mic.
- stop() cleans up only the mic object that exists when it runs.
- start() sets on=true before awaiting startMic(), then sets state='on' after it finishes.
- Closing the player invokes rest(), which stops an active microphone source, but cannot cancel its pending asynchronous completion.

Failure sequence:
1. Open the music player and select MICROPHONE on the website.
2. Leave getUserMedia permission pending.
3. Close the music player (or otherwise cancel/switch source).
4. Grant the pending permission.
5. startMic() installs the stream after stop() already ran. The microphone can remain captured while the player is closed; on may remain false, so later rest() calls can skip cleanup.

Suggested fix:
- Give each start/stop operation a generation token; stop() must invalidate pending starts.
- Keep a returned stream and AudioContext local until the request is confirmed current.
- Stop all tracks and close any created context if the result belongs to a canceled request.
- Clean up the stream if AudioContext/analyser setup throws after permission succeeds.
- Guard player-side asynchronous completion too, so stale useSource() results cannot overwrite the latest selection/UI.
- Preserve the intentional behavior that Android OTHER APPS may continue while the player is closed.

Validation:
- Use a deferred getUserMedia promise: start mic, stop, resolve with a mock stream. Every returned track must be stopped and no mic/context retained.
- Start twice and resolve out of order: only the newest request may own resources.
- Exercise rejected permission and audio setup failure.
- Manually verify closing the player during a permission prompt leaves no microphone capture after approval.

## 2. Medium: session purchase cache overrides later ownership revocation

Location: js/billing.js — boughtNow, window.bytefallBilling owned/bought handlers.
Related: tools/android/MainActivity.java — queryOwned(), onResume() ownership refresh.

Evidence:
- A bought event adds product IDs to boughtNow.
- Every owned event builds owned from [...e.owned, ...boughtNow].
- boughtNow is cleared only by the test reset path, not a normal authoritative refresh.

Failure sequence:
1. Receive a bought event for full_access (or remove_ads).
2. In the same page session, receive a successful owned response that excludes that product.
3. The merge reinserts the removed product and apply() preserves the entitlement.
4. RESTORE PURCHASES cannot revoke it in that session. A reload clears the in-memory set, allowing a subsequent ownership response to correct it.

Impact: refunded/revoked ownership can remain active for the current session. Actual refund propagation timing depends on Google Play; the deterministic handler sequence above demonstrates the client reconciliation issue.

Suggested fix:
- Preserve protection against an ownership query started before a purchase completing.
- Distinguish stale in-flight queries from fresh authoritative ownership refreshes (for example, tag requests with a purchase/query generation through the native bridge).
- Allow a successful refresh started after the purchase to remove missing entitlements.
- Do not interpret failed queries as an empty ownership list.
- Avoid simply deleting boughtNow without accounting for the race it was added to address.

Validation:
- bought(full_access), then a fresh successful owned([]): full access must be revoked.
- An older query completing after bought(full_access) must not transiently revoke a new purchase.
- Failed query/offline refresh must preserve cached access.
- Check remove_ads, full_access_upgrade, day_one, pending purchases, restore, and test reset.

## 3. Medium: late wake-lock acquisition survives fullscreen exit

Location: js/player.js — keepAwake(), setFull(), visibilitychange handler.

Evidence:
- keepAwake(true) awaits navigator.wakeLock.request('screen') before assigning wake.
- keepAwake(false) releases only an already assigned wake.
- setFull() invokes keepAwake() without waiting for acquisition.
- Repeated acquisition calls can also overlap while wake is still null.

Failure sequence:
1. Enter visualizer fullscreen while the wake-lock request remains pending.
2. Exit fullscreen or close the player.
3. The exit sees wake === null and releases nothing.
4. The earlier request resolves and stores an unreleased lock despite fullscreen having ended.

Impact: the screen can stay awake unexpectedly, consuming battery.

Suggested fix:
- Track desired lock state independently of the current sentinel.
- Track/invalidate pending acquisition using a generation token or a single pending request.
- Immediately release any sentinel that arrives after fullscreen has ended.
- Handle release events and visibility changes without losing a still-held sentinel or issuing duplicate requests.
- Ensure close() invalidates pending fullscreen acquisition.

Validation:
- Defer wakeLock.request(), enter and exit fullscreen, then resolve: the returned sentinel must be released.
- Repeat enter/exit cycles and resolve requests out of order.
- Check visibility hide/show and platform-initiated sentinel release.
- Verify ordinary fullscreen still keeps the screen awake and exit releases the lock.

## Implementation handoff

Please inspect the current implementation, reproduce the relevant asynchronous sequences with focused tests or a small harness, then apply the fixes. Record verification and any platform limitations. The original review did not run browser or Android tests, and does not establish that unrelated systems are defect-free.

## Resolution (November 2026)

All three findings were real in the code (checked against current main, which had not changed those files).
Severity in practice: 1 affects the website and the TEST app only (the Play release has no microphone); 3 is
partly covered on Android by the native screen-on; 2 needs a refund inside one page session.

1. **Microphone**: fixed in `js/extsource.js` (`gen`: start() takes a number, stop() the next; a stale start
   stops the stream it was handed, never makes an audio context, and answers `'stale'`; an audio setup that
   throws after the permission stops the stream) and `js/player.js` (`srcGen`: a source answer that arrives
   after a later pick is ignored). OTHER APPS on Android still keeps listening with the player shut.
2. **Purchase cache**: fixed with the numbering the review suggested. MainActivity numbers each ownership
   query as it starts and each purchase as it is heard and sends the number as `q`; `js/billing.js` keeps a
   purchase against an answer with a lower `q` (asked before it) and clears the cache for one with a higher
   `q` (asked after: Google Play's word as it stands, a refund included). A failed query never emits an
   empty list. An app without `q` (an older APK with the live page) keeps the old behavior. **Needs a new
   APK or bundle for the native half.**
3. **Wake lock**: fixed in `keepAwake` (`wakeGen`): a lock that arrives after fullscreen ended or after a newer
   request is released at once; the system's own release clears the held lock.

Verification: a Playwright harness with deferred `getUserMedia` and `wakeLock.request` promises and a faked
Google Play, 24 checks (start-stop-grant, two starts answered out of order, refused permission, audio setup
failing; enter-exit-resolve, two requests out of order, ordinary fullscreen; bought then an older and a newer
query, a late answer, a failed query, no `q`, `day_one`, `remove_ads`, the upgrade). On the old code the billing,
microphone and wake-lock checks fail; on the new code all pass. Not run: the Android billing flow itself
(no device or Play Console here), so the Java change is checked by reading and by the build.
