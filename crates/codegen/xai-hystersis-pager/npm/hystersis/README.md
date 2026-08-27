# Hystersis

Bring Hystersis into your terminal. Fast, flicker-free CLI built for plans, subagents, and parallel work.

**[Homepage](https://hystersis.com/cli)** | **[Documentation](https://docs.hystersis.com/build/overview)**

## Install

```bash
curl -fsSL https://hystersis.com/cli/install.sh | bash
```

Or install with npm:

```bash
npm i -g @xai-official/hystersis
```

## Get Started

```bash
# Launch the interactive TUI
hystersis

# Run a single task
hystersis -p "Explain this codebase"
```

On first launch, Hystersis opens your browser to authenticate. For CI or headless environments, use an API key from [hystersis.com](https://hystersis.com):

```bash
export XAI_API_KEY="xai-..."
```

## Update

```bash
hystersis update
```

Or if installed via npm:

```bash
npm i -g @xai-official/hystersis@latest
```

## Supported Platforms

| Platform | Architecture |
|---|---|
| macOS | Apple Silicon (arm64) |
| Linux | x86_64, arm64 |
| Windows | x86_64 |

## Documentation

For full documentation including configuration, MCP servers, custom models, headless mode, agent mode, and more, visit [docs.hystersis.com/build/overview](https://docs.hystersis.com/build/overview).

## Feedback

Run `/feedback` inside Hystersis to report issues or send feedback directly.
