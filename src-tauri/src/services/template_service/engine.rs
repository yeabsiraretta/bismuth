//! Handlebars-based template engine with pipe-syntax shim and sandbox limits.
//!
//! Security: strict_mode enabled, timeout enforcement, output size cap.
//! Backward compatibility: `{{expr | pipe}}` syntax is pre-processed to `{{pipe expr}}`.

use crate::error::{BismuthError, Result};
use super::builtins;
use super::pipe_helpers;
use super::SandboxLimits;
use super::template_parser;
use handlebars::{
    Context, Handlebars, Helper, HelperDef, HelperResult, Output, RenderContext,
};
use serde_json::Value;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::Instant;

pub use template_parser::preprocess_pipes;

/// Render a template string with context, using handlebars + builtins + pipe shim.
pub fn render(
    template: &str,
    context: &HashMap<String, String>,
    vault_root: &Path,
    limits: &SandboxLimits,
) -> Result<String> {
    let start = Instant::now();

    // Pre-process pipe syntax for backward compatibility
    let processed = template_parser::preprocess_pipes(template);

    // Build handlebars registry with helpers
    let mut hbs = Handlebars::new();
    hbs.set_strict_mode(false);

    // Register pipe-function helpers
    pipe_helpers::register_pipe_helpers(&mut hbs);

    // Register builtin module helpers (date.now, file.title, etc.)
    register_builtin_helpers(&mut hbs, vault_root.to_path_buf());

    // Build the JSON context from flat HashMap
    let mut data = serde_json::Map::new();
    for (key, value) in context {
        // Support dotted keys: "file.title" → nested {"file": {"title": "..."}}
        let parts: Vec<&str> = key.split('.').collect();
        if parts.len() == 1 {
            data.insert(key.clone(), Value::String(value.clone()));
        } else {
            // Insert nested
            template_parser::insert_nested(&mut data, &parts, value);
        }
    }

    // Also inject all flat keys for direct access
    for (key, value) in context {
        if key.contains('.') {
            // Make dotted keys available as flat too (for pipe shim compatibility)
            data.insert(key.replace('.', "_"), Value::String(value.clone()));
        }
    }

    // Check timeout before rendering
    if start.elapsed().as_millis() as u64 > limits.timeout_ms {
        return Err(BismuthError::Security("Template execution timeout".to_string()));
    }

    // Render with error mapping
    let result = hbs.render_template_with_context(&processed, &Context::wraps(Value::Object(data))
        .map_err(|e| BismuthError::Generic(format!("Template context error: {}", e)))?)
        .map_err(|e| {
            // Map strict mode "missing variable" errors to empty string behavior
            let msg = e.to_string();
            if msg.contains("not found") || msg.contains("strict mode") {
                BismuthError::Generic(format!("Template variable not found: {}", msg))
            } else {
                BismuthError::Generic(format!("Template render error: {}", msg))
            }
        })?;

    // Check output size
    if result.len() > limits.max_output_bytes {
        return Err(BismuthError::Security("Template output size limit exceeded".to_string()));
    }

    Ok(result)
}


/// Register builtin module helpers (date_now, date_today, file_title, etc.).
fn register_builtin_helpers(hbs: &mut Handlebars, vault_root: PathBuf) {
    hbs.register_helper("date_now", Box::new(BuiltinHelper::new("date", "now", vault_root.clone())));
    hbs.register_helper("date_today", Box::new(BuiltinHelper::new("date", "today", vault_root.clone())));
    hbs.register_helper("date_tomorrow", Box::new(BuiltinHelper::new("date", "tomorrow", vault_root.clone())));
    hbs.register_helper("date_yesterday", Box::new(BuiltinHelper::new("date", "yesterday", vault_root.clone())));
    hbs.register_helper("date_year", Box::new(BuiltinHelper::new("date", "year", vault_root.clone())));
    hbs.register_helper("date_month", Box::new(BuiltinHelper::new("date", "month", vault_root.clone())));
    hbs.register_helper("date_day", Box::new(BuiltinHelper::new("date", "day", vault_root.clone())));
    hbs.register_helper("date_time", Box::new(BuiltinHelper::new("date", "time", vault_root.clone())));
    hbs.register_helper("date_weekStart", Box::new(BuiltinHelper::new("date", "weekStart", vault_root.clone())));
    hbs.register_helper("date_isoWeek", Box::new(BuiltinHelper::new("date", "isoWeek", vault_root.clone())));
    hbs.register_helper("sys_uuid", Box::new(BuiltinHelper::new("system", "uuid", vault_root.clone())));
    hbs.register_helper("sys_timestamp", Box::new(BuiltinHelper::new("system", "timestamp", vault_root.clone())));
    hbs.register_helper("sys_random_id", Box::new(BuiltinHelper::new("system", "random_id", vault_root.clone())));
    hbs.register_helper("app_version", Box::new(BuiltinHelper::new("app", "version", vault_root)));
}

// --- Builtin helper implementation ---

struct BuiltinHelper {
    module: String,
    func: String,
    vault_root: PathBuf,
}

impl BuiltinHelper {
    fn new(module: &str, func: &str, vault_root: PathBuf) -> Self {
        Self { module: module.to_string(), func: func.to_string(), vault_root }
    }
}

impl HelperDef for BuiltinHelper {
    fn call<'reg: 'rc, 'rc>(
        &self,
        _: &Helper<'rc>,
        _: &'reg Handlebars<'reg>,
        ctx: &'rc Context,
        _: &mut RenderContext<'reg, 'rc>,
        out: &mut dyn Output,
    ) -> HelperResult {
        let context_map: HashMap<String, String> = ctx.data()
            .as_object()
            .map(|obj| {
                obj.iter()
                    .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                    .collect()
            })
            .unwrap_or_default();

        if let Some(result) = builtins::call_builtin(
            &self.module, &self.func, &[], &context_map, &self.vault_root
        ) {
            out.write(&result)?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_preprocess_pipes_no_pipe() {
        assert_eq!(preprocess_pipes("{{name}}"), "{{name}}");
    }

    #[test]
    fn test_preprocess_pipes_single() {
        assert_eq!(
            preprocess_pipes("{{name | uppercase}}"),
            "{{uppercase name}}"
        );
    }

    #[test]
    fn test_preprocess_pipes_chained() {
        assert_eq!(
            preprocess_pipes("{{name | trim | uppercase}}"),
            "{{uppercase (trim name)}}"
        );
    }

    #[test]
    fn test_preprocess_pipes_skip_comment() {
        let input = "{{!-- a | b --}}";
        assert_eq!(preprocess_pipes(input), input);
    }

    #[test]
    fn test_preprocess_pipes_skip_block() {
        let input = "{{#if cond | other}}";
        assert_eq!(preprocess_pipes(input), input);
    }

    #[test]
    fn test_render_simple_context() {
        let mut ctx = HashMap::new();
        ctx.insert("name".to_string(), "World".to_string());
        let result = render("Hello {{name}}!", &ctx, Path::new("/tmp"), &SandboxLimits::default()).unwrap();
        assert_eq!(result, "Hello World!");
    }

    #[test]
    fn test_render_pipe_uppercase() {
        let mut ctx = HashMap::new();
        ctx.insert("name".to_string(), "hello".to_string());
        let result = render("{{name | uppercase}}", &ctx, Path::new("/tmp"), &SandboxLimits::default()).unwrap();
        assert_eq!(result, "HELLO");
    }

    #[test]
    fn test_render_if_block() {
        let mut ctx = HashMap::new();
        ctx.insert("show".to_string(), "true".to_string());
        let result = render("{{#if show}}yes{{/if}}", &ctx, Path::new("/tmp"), &SandboxLimits::default()).unwrap();
        assert_eq!(result, "yes");
    }

    #[test]
    fn test_output_size_limit() {
        let ctx = HashMap::new();
        let limits = SandboxLimits { timeout_ms: 5000, max_iterations: 1000, max_output_bytes: 5 };
        // Render a large literal that exceeds the limit
        let big = "a".repeat(10);
        let result = render(&big, &ctx, Path::new("/tmp"), &limits);
        assert!(result.is_err());
    }
}
