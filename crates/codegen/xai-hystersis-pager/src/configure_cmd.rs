use std::io::{self, Write};
use std::fs;
use xai_hystersis_shell::util::hystersis_home::hystersis_home;

pub async fn run() -> anyhow::Result<()> {
    println!("============================================================");
    println!("                 Hystersis Setup Wizard                     ");
    println!("============================================================");
    println!();
    println!("Select your preferred AI Provider:");
    println!("  1. OpenRouter (Recommended - Access to all models)");
    println!("  2. Anthropic (Claude 3.5 Sonnet directly)");
    println!("  3. OpenAI (GPT-4o directly)");
    print!("Enter choice (1-3) [1]: ");
    io::stdout().flush().unwrap();

    let mut choice = String::new();
    io::stdin().read_line(&mut choice).unwrap();
    let choice = choice.trim();

    let provider = match choice {
        "2" => "anthropic",
        "3" => "openai",
        _ => "openrouter",
    };

    println!();
    print!("Enter your {} API Key: ", provider);
    io::stdout().flush().unwrap();
    
    let mut api_key = String::new();
    io::stdin().read_line(&mut api_key).unwrap();
    let api_key = api_key.trim();

    println!();
    println!("Select your default model:");
    
    let (default_model_name, default_model_slug, base_url, api_backend) = if provider == "openrouter" {
        println!("  1. meta-llama/llama-3.3-70b-instruct (Fast & Cheap)");
        println!("  2. anthropic/claude-3.5-sonnet (Smart)");
        println!("  3. openai/gpt-4o (Versatile)");
        print!("Enter choice (1-3) [2]: ");
        io::stdout().flush().unwrap();
        let mut m = String::new();
        io::stdin().read_line(&mut m).unwrap();
        match m.trim() {
            "1" => ("openrouter/llama", "meta-llama/llama-3.3-70b-instruct", "https://openrouter.ai/api/v1", "chat_completions"),
            "3" => ("openrouter/gpt4o", "openai/gpt-4o", "https://openrouter.ai/api/v1", "chat_completions"),
            _ => ("openrouter/claude", "anthropic/claude-3.5-sonnet", "https://openrouter.ai/api/v1", "chat_completions"),
        }
    } else if provider == "anthropic" {
        println!("  1. claude-3-5-sonnet-20240620");
        println!("  2. claude-3-opus-20240229");
        print!("Enter choice (1-2) [1]: ");
        io::stdout().flush().unwrap();
        let mut m = String::new();
        io::stdin().read_line(&mut m).unwrap();
        match m.trim() {
            "2" => ("anthropic/opus", "claude-3-opus-20240229", "https://api.anthropic.com/v1", "anthropic"),
            _ => ("anthropic/sonnet", "claude-3-5-sonnet-20240620", "https://api.anthropic.com/v1", "anthropic"),
        }
    } else {
        println!("  1. gpt-4o");
        println!("  2. gpt-4-turbo");
        print!("Enter choice (1-2) [1]: ");
        io::stdout().flush().unwrap();
        let mut m = String::new();
        io::stdin().read_line(&mut m).unwrap();
        match m.trim() {
            "2" => ("openai/turbo", "gpt-4-turbo", "https://api.openai.com/v1", "chat_completions"),
            _ => ("openai/gpt4o", "gpt-4o", "https://api.openai.com/v1", "chat_completions"),
        }
    };

    // Build the TOML file manually
    let config_toml = format!(r#"# Hystersis Auto-Generated Configuration

[model_providers.{provider}]
api_key = "{api_key}"
base_url = "{base_url}"

[models]
default = "{default_model_name}"

[model."{default_model_name}"]
model = "{default_model_slug}"
model_provider = "{provider}"
base_url = "{base_url}"
api_key = "{api_key}"
api_backend = "{api_backend}"
max_tokens = 8192

[marketplace]
default_skills_installs_purged = true

[ui]
max_thoughts_width = 120
yolo = false
compact_mode = false
permission_mode = "always-approve"
"#);

    let config_dir = hystersis_home();
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).unwrap();
    }
    
    let config_path = config_dir.join("config.toml");
    
    // Append or Overwrite
    fs::write(&config_path, config_toml).expect("Failed to write config.toml");

    println!();
    println!("✅ Setup Complete!");
    println!("Your configuration has been saved to: {}", config_path.display());
    println!("You can now start Hystersis by typing `hystersis`.");
    Ok(())
}
