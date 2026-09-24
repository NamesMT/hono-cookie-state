# AGENTS.md

`hono-cookie-state` is a publishable ESM-only TypeScript library: a [Hono](https://hono.dev) middleware
that persists a typed state object in a signed, encrypted cookie (inlined `iron-webcrypto`).
Node >= 22.14.0, [tsdown](https://github.com/rolldown/tsdown) build, Vitest.

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
```

## Structure

- `src/index.ts` — the package entry: the `CookieState` class and the `createCookieState`
  middleware factory. `exports` / `main` / `source` point here.
- `src/internal/` — inlined from h3: `iron-crypto.ts` (`seal` / `unseal` / `defaults`) and
  `encoding.ts` (base64url helpers).
- `test/index.test.ts` — one round-trip test, importing through the `#src/index.js` alias.
- `tsdown.config.ts`, `vitest.config.ts`, `eslint.config.js` — build, test and lint config.
- `scripts/` — `check-release-version.mjs` and `release-notes.mjs`, used only by `release`.
- `.github/workflows/` — `quickcheck` (lint + types) and `test-and-codecov` (coverage) are
  `workflow_dispatch`-only; `typedoc` publishes Pages docs on push to `main`; `release` is manual.

## Conventions

- Conventional commits drive the changelog: existing entries are `## v<version>` sections.
- ESLint via `@antfu/eslint-config` owns formatting: no Prettier, single quotes, 2-space indent.
  `lint-staged` runs `eslint --fix` on every commit, so format before committing.
- ESM only: `"type": "module"` with an import-only `exports` map; do not add a CJS build.
- `#src/*` is a native import-map alias for `./src/*`; test imports keep the `.js` suffix.

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
