<div align="center">

# Hystersis

**The autonomous AI coding assistant. Bring your own model.**

[![Private](https://img.shields.io/badge/repo-private-555?style=flat-square)](#)
[![Rust](https://img.shields.io/badge/built%20with-Rust-orange?style=flat-square&logo=rust)](#)
[![OpenRouter](https://img.shields.io/badge/powered%20by-OpenRouter-7c3aed?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](#license)

```
curl -fsSL https://code.hystersis.com/install.sh | sh
```

</div>

---

## What is Hystersis?

Hystersis is a terminal-native, autonomous AI coding agent - a full-screen TUI that:

- **Understands your codebase** — semantic search, grep, file navigation
- **Edits files** — exact search-replace with live inline diff previews
- **Executes shell commands** — runs tests, builds, scripts autonomously
- **Loops without pausing** — continuous agentic execution like Claude Code
- **Brings your own model** — OpenRouter, Anthropic, OpenAI via `~/.hystersis/config.toml`
- **Manages subagents** — spawn parallel task agents with `TaskTool`
- **Thinks out loud** — collapsible `<thought>` blocks visible in real-time

---

## Install

```bash
curl -fsSL https://code.hystersis.com/install.sh | sh
```

Then configure your API key:

```bash
hystersis configure
# or from inside the TUI: /settings
```

### Supported platforms

| Platform | Binary |
|----------|--------|
| macOS Apple Silicon | `hystersis-macos-arm64` |
| macOS Intel | `hystersis-macos-x64` |
| Linux x86_64 | `hystersis-linux-x64` |
| Linux ARM64 | `hystersis-linux-arm64` |

---

## Quick start

```bash
# Interactive TUI
hystersis

# Single-turn headless
hystersis -p "refactor the auth module to use JWT"

# Continue last session
hystersis --continue

# Headless with streaming JSON output
hystersis -p "fix the bug" --output-format streaming-json
```

---

## Configuration

Hystersis is configured via `~/.hystersis/config.toml`.

### OpenRouter (recommended — access to all models)

```toml
[model_providers.openrouter]
api_key = "sk-or-v1-..."
base_url = "https://openrouter.ai/api/v1"

[models]
default = "openrouter/claude-sonnet-4.6"

[model."openrouter/claude-sonnet-4.6"]
model = "anthropic/claude-sonnet-4.6"
base_url = "https://openrouter.ai/api/v1"
api_key = "sk-or-v1-..."
api_backend = "chat_completions"
```

### Anthropic direct

```toml
[model_providers.anthropic]
api_key = "sk-ant-..."
base_url = "https://api.anthropic.com/v1"

[models]
default = "claude-sonnet-4-6"
```

You can also set these from inside the TUI with `/settings` → **Models**.

---

## TUI shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+X` | Shortcuts / command palette |
| `/settings` | Open settings modal |
| `/configure` | Re-run setup wizard |
| `Esc` | Cancel current action |
| `Shift+Tab` | Toggle mode |

---

## Building from source

```bash
# Prerequisites: Rust stable (https://rustup.rs)
git clone https://github.com/Himan-D/hystersis
cd hystersis
cargo build --release -p hystersis-pager-bin

# Binary at:
./target/release/hystersis
```

---

## Repository layout

```
crates/
├── codegen/
│   ├── hystersis-pager-bin/     # CLI entrypoint binary
│   ├── hystersis-pager/         # TUI app + slash commands + settings
│   ├── hystersis-pager-diff/    # Inline diff renderer (Ratatui + Syntect)
│   ├── hystersis-shell/         # Agent loop, config, model providers, BYOK
│   ├── hystersis-workspace/     # File system ops, git integration
│   └── hystersis-compaction-transcript/   # Context window management (2MB segments)
└── common/
    └── hystersis-compaction/    # Conversation compaction strategies
npm-package/                         # npm global install wrapper
.github/workflows/release.yml        # Cross-platform release pipeline
```

---

## Releasing

Tag a version to trigger the GitHub Actions release pipeline:

```bash
git tag v1.0.11
git push origin main --tags
```

This automatically:
1. Builds binaries for all 4 platforms
2. Creates a GitHub Release with checksums
3. Deploys `install.sh` + landing page to `code.hystersis.com`

---

## License

MIT — see [LICENSE](./LICENSE).

---

<div align="center">
  <a href="https://hystersis.com">hystersis.com</a> ·
  <a href="https://code.hystersis.com">code.hystersis.com</a> ·
  <a href="https://openrouter.ai/keys">Get OpenRouter Key</a>
</div>
