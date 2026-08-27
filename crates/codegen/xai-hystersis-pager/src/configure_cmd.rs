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
    println!("  2. Anthropic (Claude 3.5 Sonnet)");
    println!("  3. OpenAI (GPT-4o)");
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
    let default_model = if provider == "openrouter" {
        println!("  1. meta-llama/llama-3.1-405b-instruct");
        println!("  2. anthropic/claude-3.5-sonnet");
        println!("  3. openai/gpt-4o");
        print!("Enter choice (1-3) [2]: ");
        io::stdout().flush().unwrap();
        let mut m = String::new();
        io::stdin().read_line(&mut m).unwrap();
        match m.trim() {
            "1" => "meta-llama/llama-3.1-405b-instruct",
            "3" => "openai/gpt-4o",
            _ => "anthropic/claude-3.5-sonnet",
        }
    } else if provider == "anthropic" {
        println!("  1. claude-3-5-sonnet-20240620");
        println!("  2. claude-3-opus-20240229");
        print!("Enter choice (1-2) [1]: ");
        io::stdout().flush().unwrap();
        let mut m = String::new();
        io::stdin().read_line(&mut m).unwrap();
        match m.trim() {
            "2" => "claude-3-opus-20240229",
            _ => "claude-3-5-sonnet-20240620",
        }
    } else {
        println!("  1. gpt-4o");
        println!("  2. gpt-4-turbo");
        print!("Enter choice (1-2) [1]: ");
        io::stdout().flush().unwrap();
        let mut m = String::new();
        io::stdin().read_line(&mut m).unwrap();
        match m.trim() {
            "2" => "gpt-4-turbo",
            _ => "gpt-4o",
        }
    };

    // Build the TOML file manually
    let config_toml = format!(r#"# Hystersis Auto-Generated Configuration

[model_providers.{}]
api_key = "{}"
{}

[models]
default = "{}"

[model."{}"]
model_provider = "{}"
"#, 
        provider, 
        api_key, 
        if provider == "openrouter" { "api_base = \"https://openrouter.ai/api/v1\"" } else { "" },
        default_model,
        default_model,
        provider
    );

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
