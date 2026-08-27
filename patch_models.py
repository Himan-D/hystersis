import json

with open("crates/codegen/xai-hystersis-models/default_models.json", "r") as f:
    data = json.load(f)

# Change default models
data["default"] = "claude-3.7-sonnet"
data["web_search"] = "claude-3.7-sonnet"
data["image_description"] = "claude-3.7-sonnet"
data["session_summary"] = "claude-3.7-sonnet"

# Add Claude 3.7 Sonnet
data["models"].insert(0, {
    "id": "claude-3.7-sonnet",
    "model": "anthropic/claude-3.7-sonnet",
    "model_family": "openrouter",
    "name": "Claude 3.7 Sonnet",
    "description": "Anthropic's most intelligent model",
    "context_window": 200000,
    "api_backend": "chat_completions",
    "supports_backend_search": False,
    "system_prompt_label": "Claude 3.7 Sonnet"
})

with open("crates/codegen/xai-hystersis-models/default_models.json", "w") as f:
    json.dump(data, f, indent=2)
