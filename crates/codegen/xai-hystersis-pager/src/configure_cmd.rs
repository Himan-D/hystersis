use std::io::{self, Write};
use std::fs;
use xai_hystersis_shell::util::hystersis_home::hystersis_home;

pub async fn run() -> anyhow::Result<()> {
    println!("============================================================");
    println!("           Welcome to Trinetra AI Enterprise CLI            ");
    println!("============================================================");
    println!();
    
    // 1. API Key
    print!("Enter your Trinetra AI API Key: ");
    io::stdout().flush().unwrap();
    let mut api_key = String::new();
    io::stdin().read_line(&mut api_key).unwrap();
    let api_key = api_key.trim();

    // 2. Gateway URL (No hardcodes, allow user to set their company URL)
    println!();
    print!("Enter your AI Gateway URL [default: https://trinetra-ai-gateway.himanshu-dixit.workers.dev]: ");
    io::stdout().flush().unwrap();
    let mut base_url = String::new();
    io::stdin().read_line(&mut base_url).unwrap();
    let mut base_url = base_url.trim().to_string();
    if base_url.is_empty() {
        base_url = "https://trinetra-ai-gateway.himanshu-dixit.workers.dev".to_string();
    }

    // 3. Model Selection
    println!();
    println!("Which model would you like to use?");
    println!("Popular options: gpt-5.6-sol, claude-5-sonnet, gpt-4o");
    print!("Enter model name [default: claude-5-sonnet]: ");
    io::stdout().flush().unwrap();
    let mut default_model_slug = String::new();
    io::stdin().read_line(&mut default_model_slug).unwrap();
    let mut default_model_slug = default_model_slug.trim().to_string();
    if default_model_slug.is_empty() {
        default_model_slug = "claude-5-sonnet".to_string();
    }
    
    let default_model_name = format!("trinetra/{}", default_model_slug);
    let provider = "trinetra";
    let api_backend = "chat_completions";

    // Build the TOML file manually
    let config_toml = format!(r#"# Trinetra AI Auto-Generated Configuration

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
compact_mode = true
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
    println!("You can now start the CLI by typing `hystersis`.");
    Ok(())
}
