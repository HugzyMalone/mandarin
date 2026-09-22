# Learning records (v2)

Both pages load tracking.js. Mandarin asks for HUGZY or AZZA before a round; German is fixed to HUGZY; identity is fixed until leaving that round. Every quiz answer/timeout and practice Again/Got it grade is queued immediately. Incomplete tests therefore retain answered questions. Leaderboard submission remains explicit and only happens after a completed test. Historical score keys and rows are unchanged.

The existing public append-only `scores` table also stores event records. No additional backend privilege or schema migration is required. Never aggregate these rows as leaderboard scores:

- `lesson`: `ev2:<zh|de>:<q|p><z|e>:<word hash>:<answer hash>:<12-hex event ID>` (56 characters). q=quiz, p=practice; z=target language first, e=English first.
- Word hash: Learning.hash(characters + '|' + English). Answer hash uses the same word key; all zeroes denotes a quiz timeout or a practice self-grade. Decode hashes against the corresponding vocabulary and retain this repo version when analysing older vocab.
- `name`: selected player.
- `correct`: 0 or 1; practice is self-reported, not an objective test.
- `score`: elapsed seconds rounded, capped at 40,000 seconds. Practice duration includes revealing the answer; it is not pure recall latency.
- `total`: 200 is a storage-format sentinel, NOT a count of attempts. One event row = one attempt.
- `created_at`: client event time, retained through offline syncing.

Events use one localStorage item each so tabs do not overwrite a shared queue. A Web Lock serializes same-origin sync; exact event-ID lookup recovers ambiguous POST outcomes. Analytics must deduplicate by `lesson` because the existing table has no unique event constraint and older browsers may lack Web Locks. No guaranteed exactly-once server delivery is claimed. Pending events retry on a timer, reconnect, and page visibility. If storage is unavailable, the visible warning asks the player to keep the page open; only memory buffering is then possible. Clearing site data deletes pending events. Reopening either language on the same origin also flushes queued events. No service worker/background sync is installed.

Mandarin hardest-word selection combines legacy `word:v1:` attempts with deduplicated Mandarin events, treating each event as one attempt. New leaderboard saves do not also create legacy word attempts. Practice and quiz both inform the daily selection, which continues to use the previous day's cutoff. German lesson queries exclude event rows. There is no German hardest-word competition yet.

The existing database is publicly readable and insertable, as before; player choice is attribution, not authentication or anti-cheat. Do not put sensitive personal information in these records.

German personalised practice uses latest beginner-v1 lesson totals (never the incompatible old decks). When word-level evidence exists, it reviews up to ten words with errors in their last five attempts, retiring words after three consecutive correct attempts. Only Hugzy contributes. High-score keys and vocabulary are not changed.
