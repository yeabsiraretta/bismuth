//! Recipe grabber IPC command — fetch a URL and extract structured recipe data
//! from JSON-LD (schema.org/Recipe) or Microdata embedded in the HTML.

use serde::{Deserialize, Serialize};

/// Raw recipe data extracted from a web page.
#[derive(Debug, Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct GrabbedRecipeData {
    pub url: String,
    pub name: String,
    pub description: String,
    pub image: String,
    pub author: String,
    pub prep_time: String,
    pub cook_time: String,
    pub total_time: String,
    pub recipe_yield: String,
    pub recipe_category: String,
    pub recipe_cuisine: String,
    pub keywords: String,
    pub date_published: String,
    pub ingredients: Vec<String>,
    pub instructions: Vec<String>,
    pub nutrition: std::collections::HashMap<String, String>,
    pub raw_json: String,
}

/// Intermediate JSON-LD Recipe type for deserialization.
#[derive(Debug, Deserialize, Default)]
#[serde(default)]
struct JsonLdRecipe {
    name: Option<String>,
    description: Option<String>,
    image: Option<serde_json::Value>,
    author: Option<serde_json::Value>,
    #[serde(alias = "prepTime")]
    prep_time: Option<String>,
    #[serde(alias = "cookTime")]
    cook_time: Option<String>,
    #[serde(alias = "totalTime")]
    total_time: Option<String>,
    #[serde(alias = "recipeYield")]
    recipe_yield: Option<serde_json::Value>,
    #[serde(alias = "recipeCategory")]
    recipe_category: Option<serde_json::Value>,
    #[serde(alias = "recipeCuisine")]
    recipe_cuisine: Option<serde_json::Value>,
    keywords: Option<serde_json::Value>,
    #[serde(alias = "datePublished")]
    date_published: Option<String>,
    #[serde(alias = "recipeIngredient")]
    recipe_ingredient: Option<Vec<String>>,
    #[serde(alias = "recipeInstructions")]
    recipe_instructions: Option<serde_json::Value>,
    nutrition: Option<serde_json::Value>,
}

/// Fetch a URL and extract recipe data from JSON-LD or embedded structured data.
#[tauri::command]
pub async fn fetch_recipe_from_url(url: String) -> Result<GrabbedRecipeData, String> {
    tokio::task::spawn_blocking(move || fetch_recipe_sync(&url))
        .await
        .map_err(|e| format!("Task join error: {e}"))?
}

fn fetch_recipe_sync(url: &str) -> Result<GrabbedRecipeData, String> {
    let resp = ureq::get(url)
        .set("User-Agent", "Mozilla/5.0 (compatible; BismuthBot/1.0)")
        .timeout(std::time::Duration::from_secs(15))
        .call()
        .map_err(|e| format!("HTTP error: {e}"))?;

    let body = resp
        .into_string()
        .map_err(|e| format!("Failed to read response: {e}"))?;

    extract_recipe_from_html(url, &body)
}

fn extract_recipe_from_html(url: &str, html: &str) -> Result<GrabbedRecipeData, String> {
    // Find all <script type="application/ld+json"> blocks
    let re = regex::Regex::new(
        r#"<script[^>]*type\s*=\s*["']application/ld\+json["'][^>]*>([\s\S]*?)</script>"#
    ).unwrap();

    for cap in re.captures_iter(html) {
        let json_str = &cap[1];
        if let Ok(recipe) = try_parse_recipe_json(json_str) {
            let mut data = build_grabbed_data(url, &recipe);
            data.raw_json = json_str.trim().to_string();
            return Ok(data);
        }
    }

    Err("No recipe data found on this page. The page may not contain structured recipe data (JSON-LD).".into())
}

fn try_parse_recipe_json(json_str: &str) -> Result<JsonLdRecipe, ()> {
    // Try direct Recipe object
    if let Ok(val) = serde_json::from_str::<serde_json::Value>(json_str) {
        if let Some(recipe) = find_recipe_in_value(&val) {
            return serde_json::from_value::<JsonLdRecipe>(recipe.clone()).map_err(|_| ());
        }
    }
    Err(())
}

fn find_recipe_in_value(val: &serde_json::Value) -> Option<&serde_json::Value> {
    match val {
        serde_json::Value::Object(map) => {
            if let Some(t) = map.get("@type") {
                let type_str = match t {
                    serde_json::Value::String(s) => s.clone(),
                    serde_json::Value::Array(arr) => arr.iter()
                        .filter_map(|v| v.as_str())
                        .collect::<Vec<_>>()
                        .join(","),
                    _ => String::new(),
                };
                if type_str.to_lowercase().contains("recipe") {
                    return Some(val);
                }
            }
            // Check @graph
            if let Some(graph) = map.get("@graph") {
                return find_recipe_in_value(graph);
            }
            None
        }
        serde_json::Value::Array(arr) => {
            for item in arr {
                if let Some(found) = find_recipe_in_value(item) {
                    return Some(found);
                }
            }
            None
        }
        _ => None,
    }
}

fn build_grabbed_data(url: &str, recipe: &JsonLdRecipe) -> GrabbedRecipeData {
    GrabbedRecipeData {
        url: url.to_string(),
        name: recipe.name.clone().unwrap_or_default(),
        description: html_strip(&recipe.description.clone().unwrap_or_default()),
        image: extract_image(&recipe.image),
        author: extract_author(&recipe.author),
        prep_time: recipe.prep_time.clone().unwrap_or_default(),
        cook_time: recipe.cook_time.clone().unwrap_or_default(),
        total_time: recipe.total_time.clone().unwrap_or_default(),
        recipe_yield: extract_string_or_first(&recipe.recipe_yield),
        recipe_category: extract_string_or_first(&recipe.recipe_category),
        recipe_cuisine: extract_string_or_first(&recipe.recipe_cuisine),
        keywords: extract_keywords(&recipe.keywords),
        date_published: recipe.date_published.clone().unwrap_or_default(),
        ingredients: recipe.recipe_ingredient.clone().unwrap_or_default()
            .into_iter().map(|s| html_strip(&s)).collect(),
        instructions: extract_instructions(&recipe.recipe_instructions),
        nutrition: extract_nutrition(&recipe.nutrition),
        raw_json: String::new(),
    }
}

fn extract_image(val: &Option<serde_json::Value>) -> String {
    match val {
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(serde_json::Value::Array(arr)) => {
            arr.first().and_then(|v| v.as_str()).unwrap_or("").to_string()
        }
        Some(serde_json::Value::Object(map)) => {
            map.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string()
        }
        _ => String::new(),
    }
}

fn extract_author(val: &Option<serde_json::Value>) -> String {
    match val {
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(serde_json::Value::Object(map)) => {
            map.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string()
        }
        Some(serde_json::Value::Array(arr)) => {
            arr.iter()
                .filter_map(|v| match v {
                    serde_json::Value::String(s) => Some(s.clone()),
                    serde_json::Value::Object(m) => m.get("name").and_then(|n| n.as_str()).map(String::from),
                    _ => None,
                })
                .collect::<Vec<_>>()
                .join(", ")
        }
        _ => String::new(),
    }
}

fn extract_string_or_first(val: &Option<serde_json::Value>) -> String {
    match val {
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(serde_json::Value::Array(arr)) => {
            arr.first().and_then(|v| v.as_str()).unwrap_or("").to_string()
        }
        Some(serde_json::Value::Number(n)) => n.to_string(),
        _ => String::new(),
    }
}

fn extract_keywords(val: &Option<serde_json::Value>) -> String {
    match val {
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(serde_json::Value::Array(arr)) => {
            arr.iter().filter_map(|v| v.as_str()).collect::<Vec<_>>().join(", ")
        }
        _ => String::new(),
    }
}

fn extract_instructions(val: &Option<serde_json::Value>) -> Vec<String> {
    match val {
        Some(serde_json::Value::String(s)) => {
            s.split('\n').map(|l| html_strip(l.trim())).filter(|l| !l.is_empty()).collect()
        }
        Some(serde_json::Value::Array(arr)) => {
            let mut steps = Vec::new();
            for item in arr {
                match item {
                    serde_json::Value::String(s) => {
                        let cleaned = html_strip(s.trim());
                        if !cleaned.is_empty() { steps.push(cleaned); }
                    }
                    serde_json::Value::Object(map) => {
                        // HowToStep or HowToSection
                        if let Some(text) = map.get("text").and_then(|v| v.as_str()) {
                            let cleaned = html_strip(text.trim());
                            if !cleaned.is_empty() { steps.push(cleaned); }
                        } else if let Some(items) = map.get("itemListElement") {
                            // HowToSection with nested steps
                            if let Some(sub) = extract_instructions(&Some(items.clone())).into_iter().next() {
                                steps.push(sub);
                            }
                            let sub_steps = extract_instructions(&Some(items.clone()));
                            steps.extend(sub_steps);
                        }
                    }
                    _ => {}
                }
            }
            steps
        }
        _ => Vec::new(),
    }
}

fn extract_nutrition(val: &Option<serde_json::Value>) -> std::collections::HashMap<String, String> {
    let mut map = std::collections::HashMap::new();
    if let Some(serde_json::Value::Object(obj)) = val {
        for (key, value) in obj {
            if key == "@type" { continue; }
            if let Some(s) = value.as_str() {
                map.insert(key.clone(), s.to_string());
            } else if let Some(n) = value.as_f64() {
                map.insert(key.clone(), n.to_string());
            }
        }
    }
    map
}

/// Strip HTML tags from a string.
fn html_strip(s: &str) -> String {
    let no_tags = regex::Regex::new(r"<[^>]+>").unwrap().replace_all(s, "");
    no_tags
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
        .trim()
        .to_string()
}
