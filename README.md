# Mandarin Flashcards

Vocab flashcards with a scored quiz and a leaderboard for every lesson. Plain HTML on GitHub Pages; scores live in the Supabase project `mandarin` (`cfljidsexwvhalvvlbxi`), table `scores`, schema in `supabase/schema.sql`.

Mandarin lives at `index.html` (ink and seal design), German at `german/index.html` (night scoreboard design); both share the Supabase `scores` table, German lessons prefixed `de:`. To add a lesson, add a section at the top of the `ZH` or `DE` array in both files. Design previews are in `designs/`.
