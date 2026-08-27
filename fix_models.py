import json

with open("crates/codegen/xai-hystersis-models/default_models.json", "r") as f:
    data = json.load(f)

# Change default models to match the 'model' field
data["default"] = "anthropic/claude-3.7-sonnet"
data["web_search"] = "anthropic/claude-3.7-sonnet"
data["image_description"] = "anthropic/claude-3.7-sonnet"
data["session_summary"] = "anthropic/claude-3.7-sonnet"

with open("crates/codegen/xai-hystersis-models/default_models.json", "w") as f:
    json.dump(data, f, indent=2)
