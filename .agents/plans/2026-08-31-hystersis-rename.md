## Goal
Fully link the codebase to `Hystersis` — zero remaining `xai` crate/package/binary/binding names in user-facing and internal code — while keeping `cargo build --release`, `cargo test`, `npm install`, and Cloudflare deploy green. Request: "all code can be linked to hystersis not a single xai but all should work."

## Success Criteria
- `grep -r "xai-" crates --include="*.toml" | grep 'name = "xai'` returns 0; `grep -rn '"xai-' Cargo.toml` returns 0.
- `cargo build --release -p hystersis-pager-bin` succeeds; artifact `target/release/hystersis` (alias `hys`) runs `hystersis --version`.
- `grep -rn "xai_hystersis_\|xai-" crates --include="*.rs" | grep "use xai"` returns 0; pure `xai-*` crates renamed or explicitly retained with documented exception.
- `~/.hystersis` / `$HYSTERSIS_HOME` / `$HYSTERSIS_VERSION` remain the only home/version envs in code; `TRINETRA_*` bindings removed from `gateway-proxy/wrangler.toml` and `src/index.js`.
- `cargo test --workspace` (or `cargo test -p hystersis-pager -p hystersis-shell` quick gate) passes; `pages deploy` + `npm pack` dry-run pass.
- `README.md`, `LICENSE`, `Cargo.toml:license`, `npm-package/package.json`, `landing/public/install.sh` all agree on name/license/repo.

## Context And Current Facts
**Inventory (verified Aug 31):**
- Workspace members: 149 (`Cargo.toml:8-103`). `crates/codegen`: 52× `xai-hystersis-*` + 23× pure `xai-*` (e.g. `xai-acp-lib`, `xai-mixpanel`, `xai-ratatui-inline`) (`ls crates/codegen | sort`). `crates/common`: 10 (6 `xai-*`, 1 `xai-hystersis-compaction`).
- Binary crate: `crates/codegen/xai-hystersis-pager-bin/Cargo.toml:2 name="xai-hystersis-pager-bin"`, `[[bin]] name="xai-hystersis-pager"` produces `target/release/xai-hystersis-pager` but release artifacts and install rename to `hystersis-*` (`release.yml:14 BINARY_NAME: xai-hystersis-pager` → `cp ... xai-hystersis-pager -> hystersis-macos-arm64`, `wrangler.toml` etc.).
- Home dir correctly migrated: `xai-hystersis-home/src/lib.rs:1` `~/.hystersis` / `$HYSTERSIS_HOME` (`hystersis_home()`), `HYSTERSIS_VERSION` in `xai-hystersis-version/build.rs:2`.
- Gateway not migrated: `gateway-proxy/wrangler.toml:1 name="trinetra-ai-gateway"`, `TRINETRA_BILLING`, `TRINETRA_DB`/`trinetra-billing`, `src/index.js:317 metadata[trinetra_key]`, `580 _trinetra_*`.
- Duplicated site: `landing/` (`hystersis-ascii`, `project="code-hystersis"`) vs `my-site/` (`my-site@0.0.0`) — `release.yml:176` only deploys `landing/`.
- License split: `Cargo.toml:107 Apache-2.0` vs `README.md:10 MIT` badge.
- Authors still `xAI` in ~10 crates (`grep authors.*xAI`).
- Internal test envs `XAI_FUZZY_THREAD_EXHAUSTION_CHILD` (`xai-fuzzy-file-search/src/lib.rs:837`), `XAI_FAST_WORKTREE_SAFETY_*` — inconsistent with `HYSTERSIS_*`.

**Current behavior:** build succeeds via `cargo build --release -p xai-hystersis-pager-bin`; `npm-package/install.js:22` fallback copies `../target/debug/xai-hystersis-pager`; `landing/public/install.sh:9` fallback `cargo install --package xai-hystersis-pager-bin --bin xai-hystersis-pager` — all work but expose old names.

**Callers/tests:** hundreds of `use xai_hystersis_*` and ~60 `xai-hystersis-* = { path = ... }` in `Cargo.toml:316-368` and per-crate `Cargo.toml`. `release.yml`, `install.sh`, `npm-package/install.js`, `gateway-proxy`, `README`, `LICENSE` are the non-Rust surfaces.

## Constraints And Non-goals
- **Constraint:** 75+ crates → rename is mechanical but touches every `Cargo.lock` line; must keep `Cargo.lock` consistent (`cargo generate-lockfile` after).
- **Constraint:** D1 binding rename (`TRINETRA_DB`→`HYSTERSIS_DB`) requires wrangler + Cloudflare dashboard migration; cannot be atomic without downtime unless aliased.
- **Constraint:** Published `npm @hystersis/cli@1.0.10` already on `code.hystersis.com`; install script must handle both old and new binary names during transition.
- **Non-goal:** Changing Rust edition, MSRV, or dependency versions.
- **Non-goal:** Rewriting business logic (billing limits in `gateway-proxy/src/index.js` diff stays as-is, just rebinding names).
- **Non-goal:** Forcing `my-site/` deletion if user prefers to keep it as staging; plan offers option.

## Compilation Safety Guarantees (added per your "don't spoil" requirement)
- **No behavior change:** Rename is 100% mechanical — `s/xai_hystersis_/hystersis_/g` + `s/xai-/hystersis-/g` with token boundaries; no function bodies, no default values, no config defaults altered.
- **Baseline lock:** Before Phase 1, capture green baseline: `cargo check --workspace --all-features`, `cargo test -p hystersis-pager -p hystersis-shell --lib --no-run`, `wrangler deploy --dry-run`. Every phase must re-hit that baseline before commit — `git commit` blocked if `cargo check` fails.
- **Atomic `git mv`:** Phase 2 splits `git mv` (pure rename, no edits) from content edits so `git log --follow` and `cargo` both track renames; `cargo` resolves by `path`, so intermediate `members` + `path` are updated in same commit.
- **Dual-name shims keep old builds working:** Phase 1 keeps `[[bin]] xai-hystersis-pager` alias + Phase 3 `package = "hystersis-foo"` alias in `workspace.dependencies` so `cargo run -p xai-hystersis-pager` and `cargo install --bin xai-hystersis-pager` still compile for one minor — no downstream break.
- **Gateway zero-downtime:** Code reads `env.HYSTERSIS_DB ?? env.TRINETRA_DB` / `env.HYSTERSIS_BILLING ?? env.TRINETRA_BILLING` for one deploy cycle; old Dashboards keep working while new bindings propagate.
- **Lockfile hygiene:** After every `Cargo.toml` edit run `cargo generate-lockfile`; `Cargo.lock` is not hand-edited. CI will run `cargo metadata --format-version 1 --no-deps` as sanity check for duplicate package names.
- **No `allow(warnings)` silencing:** Do not add `#[allow(unused)]` to hide rename errors — every `use` must resolve; `cargo check` warnings remain at baseline level.

## Key Decisions
| Decision | Recommendation | Why | Alternative rejected |
|---|---|---|---|
| **1. Rename scope** | **Full rename:** `xai-hystersis-*`→`hystersis-*` and pure `xai-*`→`hystersis-*` (e.g. `xai-acp-lib`→`hystersis-acp-lib`, `xai-ratatui-inline`→`hystersis-ratatui-inline`). Keep directory and package name in sync (`crates/codegen/hystersis-*`). | User asked "not a single xai"; hybrid `xai-hystersis-` is the core complaint (`README:143` still lists it). Partial rename leaves grep debt. | Partial (only `xai-hystersis-` → `hystersis-`, keep pure `xai-*` as shared lib) — less churn but violates "not a single xai" and leaves 23 crates branded xAI. |
| **2. Binary name** | `[[bin]] name = "hystersis"` with `[[bin]] name = "hys"` alias (or `ln -sf` in install). Keep `xai-hystersis-pager` as cargo alias for one release via `[package] [[bin]]` second entry deprecated. | Users run `hystersis`/`hys` (`install.sh:30`). Cargo `default-run` must match. | Keep `xai-hystersis-pager` internally — perpetuates mismatch `README:133 target/release/xai-hystersis-pager`. |
| **3. Package vs directory rename** | Rename both: `mv crates/codegen/xai-foo crates/codegen/hystersis-foo` + `Cargo.toml name = "hystersis-foo"` | Directory named `xai-*` after package rename is confusing; `cargo` resolves by `path`, so both must move. | Rename package only, keep dir — less `git mv` but leaves `xai-` on filesystem, fails goal. |
| **4. Compat shims** | One-release shims: empty `xai-*` crates that `pub use hystersis::*` or `Cargo.toml [package] name = "xai-foo"` with `version + publish = false` re-export, or `cargo alias` + `grep` fallback in `install.sh`. | External users may `cargo install --bin xai-hystersis-pager`; break is silent. | No shim (hard cut) — simpler but breaks `install.sh:9` fallback until docs update. |
| **5. Gateway bindings** | Alias new bindings alongside old: `HYSTERSIS_BILLING`/`HYSTERSIS_DB` + keep `TRINETRA_*` as alias for one deploy, then remove. Workers can bind two names to same KV/D1 (`wrangler.toml` allows duplicate `binding` with different `id`? No — use code alias `env.HYSTERSIS_DB ?? env.TRINETRA_DB`). | Zero-downtime D1 migration; code reads `env.HYSTERSIS_DB ?? env.TRINETRA_DB` for one cycle. | Hard rename — deploy fails until dashboard bindings updated. |
| **6. License** | Align to `MIT` (README + `LICENSE` file says MIT, `hystersis.com` markets MIT; `Cargo.toml` is the outlier). Change `workspace.package.license = "MIT"` and per-crate `license`. | Fix contradiction `Cargo.toml:107` vs `README:10`. | Align to `Apache-2.0` — would require README/badge change; MIT is simpler for CLI. |
| **7. Site dedup** | Delete `my-site/` (or archive to `attic/my-site`), keep `landing/` as `code.hystersis.com`. If keep, rename `my-site/package.json:name` to `hystersis-site`. | `my-site` is `0.0.0` `private` and not deployed (`release.yml:176`). | Keep both — waste, confusion for `pages deploy`. |
| **8. Env vars** | Migrate `XAI_FUZZY_*` → `HYSTERSIS_FUZZY_*` with fallback `env::var("HYSTERSIS_*").or(env::var("XAI_*"))` for one release. | Consistency `HYSTERSIS_*` dominates (`HYSTERSIS_HOME`, `HYSTERSIS_VERSION`). | Leave as-is — violates "not a single xai" in code grep. |
| **9. Execution order** | **Phased PRs, not big-bang commit** (see Work Plan) — binary + workspace alias first, then crate renames in batches, then gateway, then docs/license. | Keeps `cargo test` green per PR, reviewable. Big-bang 75-crate rename is unreviewable and breaks bisect. | Single PR — faster but unreviewable, high rollback cost. |

## Recommended Approach
Mechanical `cargo` rename codemod, not hand-edit: script renames directories, rewrites `Cargo.toml` `name`/`path`/`workspace.dependencies`/`workspace.members`, rewrites `use xai_*` → `use hystersis_*` (with `xai_` token boundary), updates `release.yml`, `install.sh`, `npm-package/install.js`, `gateway-proxy/wrangler.toml`+`src/index.js`, `README`, `LICENSE`, `authors`. Keep `Cargo.lock` regenerated via `cargo generate-lockfile`. Provide one-release compat shims (empty re-export crates + `env` fallbacks + `install.sh` dual-path).

Tooling: `cargo rename` is not stable; use `rg --files -g 'Cargo.toml' | xargs sed` + `cargo metadata` verification; validate with `cargo check --workspace` and `cargo test --workspace --no-run`. No new dependencies.

## Work Plan
**Phase 0 — Prep (no code change)**
- 0a. Branch `chore/hystersis-rename` from `main`. Snapshot `grep -rn 'xai-' crates --include="*.toml" | wc -l` baseline.
- 0b. Add CI job `cargo check --workspace` as gate (if not already). Pin `Cargo.lock` update policy.
- Owners: repo root. Surfaces: `Cargo.toml`, `.github/workflows/release.yml`.

**Phase 1 — Binary + Alias (small, verifiable)**
- 1a. `crates/codegen/xai-hystersis-pager-bin/Cargo.toml`: `name = "hystersis-pager-bin"`, `[[bin]] name = "hystersis"` + keep `[[bin]] name = "xai-hystersis-pager" path="src/main.rs" deprecated` for one release; `default-run = "hystersis"`.
- 1b. `release.yml:14 BINARY_NAME: hystersis`, `cargo build --package hystersis-pager-bin`, keep artifact names `hystersis-*` (already). Update `landing/public/install.sh:9` fallback to `cargo install --package hystersis-pager-bin --bin hystersis` with `|| cargo install --package xai-hystersis-pager-bin --bin xai-hystersis-pager` fallback.
- 1c. `README.md:130-133` build path → `hystersis`.
- Validation: `cargo build --release -p hystersis-pager-bin && ./target/release/hystersis --version && ./target/release/xai-hystersis-pager --version` both work.
- Depends: none.

**Phase 2 — Workspace registry rename (code-wide, batched)**
- 2a. Codemod `Cargo.toml` `[workspace.dependencies]` keys `xai-*`→`hystersis-*` (+ `xai-hystersis-*`→`hystersis-*`), `members` paths `crates/codegen/xai-*`→`crates/codegen/hystersis-*`, `crates/common/xai-*`→`crates/common/hystersis-*`.
- 2b. `git mv` directories: 52 `xai-hystersis-*` + 23 pure `xai-*` in `codegen` + 10 in `common`. Keep `crates/build/xai-proto-build` → `hystersis-proto-build` last (build dep).
- 2c. Per-crate `Cargo.toml`: `name = "hystersis-*"`, `authors = ["Hystersis AI"]`, `license = "MIT"` (align), `description` keep.
- 2d. Rust imports: `s/\bxai_hystersis_/hystersis_/g; s/\bxai_/hystersis_/g` with allowlist for `HYSTERSIS_*` vs `XAI_*` env fallback. Update `use xai_hystersis_pager` in tests (`pty_e2e/common.rs:53` etc.).
- 2e. Run `cargo generate-lockfile && cargo check --workspace --all-features`.
- Batch split for review: 2a+2b (dirs), 2c (toml), 2d (rs). Each commit must `cargo check` green.
- Depends: Phase 1.

**Phase 3 — Compat shims (one release)**
- 3a. Create `crates/codegen/xai-hystersis-pager-compat` shim crates `publish = false` that `pub use hystersis_*` or simple `[package] name="xai-hystersis-foo" version="1.0.10"` with `dependencies.hystersis-foo = { path = "../hystersis-foo" }` re-export. Or lighter: keep old `Cargo.toml` entries as alias `xai-hystersis-foo = { package = "hystersis-foo", path = "..." }` in `workspace.dependencies` (Cargo supports `package` rename).
- 3b. Env fallback: `env::var("HYSTERSIS_FUZZY_...").or(env::var("XAI_FUZZY_..."))` in `xai-fuzzy-file-search`, `xai-fast-worktree`.
- Depends: Phase 2.

**Phase 4 — Gateway rebrand (deploy-safe)**
- 4a. `gateway-proxy/wrangler.toml`: add `[[kv_namespaces]] binding="HYSTERSIS_BILLING"` + `[[d1_databases]] binding="HYSTERSIS_DB"` alongside old; `name = "hystersis-gateway"`.
- 4b. `gateway-proxy/src/index.js`: `const db = env.HYSTERSIS_DB ?? env.TRINETRA_DB; const kv = env.HYSTERSIS_BILLING ?? env.TRINETRA_BILLING;` update `metadata[trinetra_key]` → `metadata[hystersis_key]` with fallback read both; `_trinetra_*` → `_hystersis_*` (keep `_trinetra` write for one release).
- 4c. Deploy alias, then second PR remove `TRINETRA_*`.
- Depends: Phase 2 (for naming consistency).

**Phase 5 — Docs / Packaging**
- 5a. `README.md` repo layout tree `crates/codegen/hystersis-*` (`README:141-153`), `LICENSE` vs `Cargo.toml` align to MIT, `npm-package/package.json` add `"repository": "github:Himan-D/hystersis"`, update `npm-package/install.js:22` local path to `../target/debug/hystersis` with fallback, `landing/public/install.sh` dual bin.
- 5b. Delete or archive `my-site/` (or rename to `hystersis-site`). Update `landing/wrangler.toml` if needed (`name="code-hystersis"` already correct).
- Depends: Phase 2.

**Phase 6 — Cleanup (next minor)**
- Remove compat shim crates / `TRINETRA_*` aliases / `XAI_*` env fallbacks. Bump `version 1.1.0` to signal breaking rename if any external dep on `xai-*`.

## Validation Plan
| Phase | Command / Check | Expected evidence |
|---|---|---|
| 0 | `cargo check --workspace --all-features` baseline snapshot (before any rename) | Capture warning count + `cargo test --lib --no-run` success — this is the bar every phase must re-hit. |
| 1 | `cargo build --release -p hystersis-pager-bin && ls -lh target/release/hystersis && ./target/release/hystersis --version` | Binary `hystersis` exists; `cargo install --bin xai-hystersis-pager` also works (compat bin). |
| 1 | `cargo check --workspace --all-features` | Zero new errors; warning count == baseline. |
| 2 | `cargo check --workspace --all-features` + `grep -r 'xai-' crates --include="*.toml" \| grep 'name = "xai' ; echo $?` | Exit 1 (no matches). Compilation green *before* `git commit`. |
| 2 | `grep -rn "use xai_" crates --include="*.rs" \| wc -l` | 0. |
| 2 | `cargo test --workspace --no-run` (then `cargo test -p hystersis-pager -p hystersis-shell --lib` quick, plus one `pty_e2e` ignored) | Compiles + lib tests pass (pty e2e `ignored` as before). |
| 2 | `cargo metadata --format-version 1 --no-deps \| jq .packages[].name \| sort` | Lists `hystersis-*` only, no duplicate `xai-*`/`hystersis-*` collision. |
| 4 | `wrangler deploy --dry-run --config gateway-proxy/wrangler.toml` | No binding error; `HYSTERSIS_DB` resolves. Manual `curl https://gateway.../v1/billing/balance` returns `200`. |
| 5 | `npm pack --dry-run` in `npm-package/` + `node npm-package/install.js` (with `target/debug/hystersis` present) | No `xai-hystersis-pager` path error. |
| 5 | `grep -rn "xai\|TRINETRA" --include="*.md" --include="*.toml" --include="*.rs" \| grep -v "xAI auth"` | Only `xAI auth` comment in `xai-hystersis-config-types` if intentional. |

Per-phase gate: **no phase merges unless `cargo check --workspace --all-features` passes**. Highest-risk validation: `cargo check` after Phase 2d (import rewrite) — single typo breaks 50 crates; run before committing. If any phase fails, `git revert` that phase's commit(s) — no partial fix-forward that hides breakage.

## Risks / Rollback
- **Risk:** `Cargo.lock` churn + `git mv` confuses `git blame`/PR diff. Mitigate: separate `git mv` commit (no content change) then content rewrite commit (`--find-renames`).
- **Risk:** Cloudflare D1/KV binding rename causes runtime `env.TRINETRA_DB undefined`. Mitigate: dual-binding alias (Phase 4) + code fallback `??`.
- **Risk:** External `cargo install xai-hystersis-pager` breaks. Mitigate: keep `[[bin]] xai-hystersis-pager` alias + `workspace.dependencies` `package = "hystersis-..."` shim for one minor.
- **Rollback:** Each phase is revertible `git revert`. Keep Phase 2 as 3 commits (dirs, toml, rs) so `git revert` can target slice. Tag `pre-rename` before Phase 2.

## Open Questions
- **Q1:** Pure `xai-*` rename scope — confirm you want `xai-acp-lib`→`hystersis-acp-lib` etc. (counts as "single xai" to you) or keep `hystersis-shared` style and document exception? *Assumption: full rename per "not a single xai".*
- **Q2:** License target — MIT or Apache-2.0? *Assumption: MIT (README is source of truth). State if Apache-2.0 instead.*
- **Q3:** `my-site/` fate — delete, merge into `landing/`, or keep as `hystersis-site` staging? *Assumption: delete/archiving.*
- **Q4:** Shim duration — one minor (`1.0.x` compat, remove in `1.1.0`) or indefinite? *Assumption: one minor.*

## Sources
No external authoritative docs needed for this internal rename; decisions trace to workspace files inspected above (`Cargo.toml`, `crates/codegen/xai-hystersis-pager-bin/Cargo.toml`, `gateway-proxy/wrangler.toml`, `release.yml`, `landing/public/install.sh`, `README.md`). Cargo package rename alias uses Cargo `package` key (standard manifest feature).
