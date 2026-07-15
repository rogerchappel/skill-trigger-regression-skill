# Tuning Notes

The scorer is intentionally simple:

- Positive prompt words matching activation phrases increase the score.
- Words from "do not use" style sections act as vetoes.
- Two or more net matches count as a trigger.

When a fixture fails, prefer improving the skill's activation wording or adding clearer anti-example sections before changing the scorer.
