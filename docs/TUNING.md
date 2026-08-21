# Tuning Notes

The scorer is intentionally simple:

- Positive prompt words matching activation phrases increase the score.
- Words in negative sections (such as `Limitations` or `Do Not Use`) and the
  remainder of inline "should not", "do not use", or "not for" directives act
  as vetoes. Descendant subsections remain negative; a heading at the same or
  a higher level ends the section, so later sibling examples do not become
  vetoes.
- Section extraction recognizes ATX headings at levels 1–6 and Setext headings
  underlined with `=` or `-`, including headings indented by up to three spaces.
  Optional ATX closing `#` sequences require separating whitespace; an attached
  `#` remains part of the heading title.
  Heading-like text and inline directives inside fenced code blocks are ignored.
  Both backtick and tilde fences are supported; a closing fence must use the
  opening marker and be at least as long.
- Two or more net matches count as a trigger.

Reports list matched activation phrases and matched vetoes separately. Use
those fields to explain the score before changing wording or the scorer.

The section-boundary example is executable:

```bash
node dist/cli.js run fixtures/sectioned-skill \
  --fixtures fixtures/sectioned-triggers.json --format markdown
```
