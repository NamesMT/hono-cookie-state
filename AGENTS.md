# AGENTS.md

`hono-cookie-state` is a publishable ESM-only TypeScript library: a [Hono](https://hono.dev) middleware
that persists a typed state object in a signed, encrypted cookie (inlined `iron-webcrypto`).
Node >= 22.14.0, [tsdown](https://github.com/rolldown/tsdown) build, Vitest.

## Docs

Where knowledge lives, and when to reach for each:

| tier | what it holds | when you use it |
| --- | --- | --- |
| `AGENTS.md` — this file | orientation and the rules that prevent defects | read every session; write when a rule is learned the hard way |
| `.agentDocs/` | depth: module rationale, traps with their causes, compatibility | read on demand, before touching that area; write when a rule needs its reasoning kept |
| `docs/` | how-to and reference for a person using this package | read when the task is user-facing; write in the same commit as the change |
| `README.md` | the first read, for a person | write alongside `docs/` |

- **One home per fact.** State the rule here, keep the reasoning in `.agentDocs/` and link it — never both.
- **A dead pointer is a bug.** If the target is gone, delete the pointer rather than leave it.
- Move depth behind a pointer once a section outgrows a screen or two; keep the rule inline.

## Commands

```sh
pnpm run lint             # eslint (@antfu/eslint-config) — it also owns formatting
pnpm run test:types       # tsc --noEmit
pnpm run quickcheck       # lint + test:types — no tests run
pnpm exec vitest run      # run the tests once (`pnpm test` is watch mode)
pnpm run check            # lint + test:types + vitest run --coverage — the gate to run before pushing; `prerelease`
pnpm run build            # tsdown -> dist/index.mjs + dist/index.d.mts
pnpm run release:check    # validate a version against package.json: `pnpm run release:check 0.2.0`
pnpm run release:preview  # print the changelog the next release would get
pnpm run prerelease       # alias of `pnpm run check`
```

## Structure

- `src/index.ts` — the package entry: the `CookieState` class and the `createCookieState`
  middleware factory. `source` points here; `exports` / `main` / `types` point at `dist/`.
- `src/internal/` — inlined from h3: `iron-crypto.ts` (`seal` / `unseal` / `defaults`) and
  `encoding.ts` (base64url helpers).
- `test/index.test.ts` — three tests (round trip, custom `cookieKey`, default cookie name), importing through the `#src/index.js` alias.
- `scripts/` — `check-release-version.mjs` and `release-notes.mjs`, used only by `release`.
- `.github/workflows/` — `quickcheck` (lint + types) and `test-and-codecov` (coverage) are
  `workflow_dispatch`-only; `typedoc` publishes Pages docs on push to `main`; `release` is manual.

## Conventions

- Conventional commits drive the changelog: existing entries are `## v<version>` sections.
- ESLint (`@antfu/eslint-config`) owns lint and formatting; `lint-staged` runs `eslint --fix` on commit.
- ESM only: `"type": "module"` with an import-only `exports` map; do not add a CJS build.
- `#src/*` is a native import-map alias for `./src/*`; test imports keep the `.js` suffix.

## How to work here

- **Check the callers before you change anything.** Grep who uses it and which tests name it. If the
  impact is unclear, say so — do not guess.
- **Never overwrite or delete a large section you have not understood.** Read it, or say what you could
  not determine and ask.
- **Do not invent requirements.** Build what was asked; surface what else you notice and let it be
  decided.
- **Fix the class, not the instance.** A copied helper, a rule stated twice, a guard bypassed by a
  second path is one problem: one implementation, one guard. That is the work, not a follow-up to ask
  for. Stay inside the task rather than refactoring the world.
- **Verify before claiming, and say what you checked.** A passing test is not evidence it pins
  anything — **break the thing it guards and watch it fail.** If it still passes, either the test is
  decoration or a different guard is running; find out which. Where a stub cannot answer the question,
  drive the real thing.
- **Never write an identifier from memory.** A commit hash, path, line number or version must be quoted
  from the source; a plausible-looking invented one is worse than none.
- **A stated blocker is a hypothesis, not a fact.** Re-test "cannot install X" / "tool unavailable"
  before inheriting it, and never report a failure your own flag forced.
- **Report the risk with the change** — correctness, security, operational and integration; plus what
  you could not verify and every assumption you made. An unverified claim marked as such beats a
  confident one that is wrong.
- **Missing recall of this repo?** Read this file, `.agentDocs/` and `git log` before acting, then ask
  1–3 focused questions rather than guessing at intent.

## Conciseness

**Prune verbose, keep correctness** — code, comments, docs alike.

- Code: a comment only for non-obvious *intent*, never to restate the line, and never long. A block
  arguing for its own change is a commit message.
- Docs: one idea per sentence. Cut anything that would not change what a reader does.
- Delete history `git log` already holds — keep the *rule* that came out of it, not the story.
- **Never drop a caveat to save a line.** Concise means no filler, not fewer facts.

## User-facing docs

`README.md` is the only hand-written doc — `docs/` is generated TypeDoc, never edited. Keep it a **concise first read**; put
depth in `<details>` spoilers and add visuals where they help. Docs ship in the same commit as the change.

## Releasing

Manual and version-first: dispatch **Actions → Release → Run workflow** with the version; only that
dispatch publishes (a pushed tag does not). `dry-run` still creates the commit and tag locally and
stops before push, GitHub release and npm publish. The gate is `pnpm run check`; the workflow runs
Node 24 where CI runs 22. One-time trusted-publisher setup is in the README.

## Gotchas

- `quickcheck` passes without running any test — use `pnpm run check` before pushing.
- `dist/` is gitignored, never committed, but a stale copy exists locally; `prepublishOnly`
  (`pnpm run build`) means `npm publish` builds again.
- changelogen's `--clean` fails when `git status --porcelain` is non-empty; ignored files such as
  `dist/` do not count.
- `@namesmt/utils` is a devDependency but tsdown bundles its helpers into `dist/index.mjs`, so the
  published package has no runtime dependency on it — check the bundle before changing that.
- `autoRefreshSession` refreshes when the seal is within 16 minutes of `metadata.exp` (`unix() + 960`), and the cookie is only re-set when `refreshSession` is set or `data` deep-differs from its snapshot.
- Without an explicit `secret`, `env.COOKIE_STATE_SECRET` is used and falls back to a public constant, which only warns — always pass a real secret.
- `repository.url` must keep the canonical `NamesMT` casing — with `--provenance`, npm fails the publish when the URL owner does not match the GitHub owner.
