//! Deployment targets for the published site.
//!
//! Supports:
//! - Local: just writes to output_dir (handled by static_gen)
//! - Git: pushes output to a configured git repo
//! - Vercel: deploys via Vercel API (requires deploy_token + project_name)
//! - Netlify: deploys via Netlify API (requires deploy_token + site_id)

use super::PublishConfig;
use crate::error::{BismuthError, Result};
use std::process::Command;

/// Deploys the generated site to the configured target.
pub fn deploy(config: &PublishConfig) -> Result<()> {
    match config.target {
        super::PublishTarget::Local => Ok(()),
        super::PublishTarget::Git => deploy_git(config),
        super::PublishTarget::Vercel => deploy_vercel(config),
        super::PublishTarget::Netlify => deploy_netlify(config),
    }
}

/// Deploys via git: init, add, commit, push to configured remote.
fn deploy_git(config: &PublishConfig) -> Result<()> {
    let output_dir = &config.output_dir;

    // Init git repo if not exists
    run_git(output_dir, &["init"])?;
    run_git(output_dir, &["add", "."])?;
    run_git(output_dir, &["commit", "-m", "Publish update"])?;

    // Push requires a configured remote — this will fail gracefully if none set
    if let Err(e) = run_git(output_dir, &["push", "origin", "main"]) {
        return Err(BismuthError::Generic(format!(
            "Git push failed. Ensure remote is configured: {}",
            e
        )));
    }

    Ok(())
}

fn run_git(cwd: &std::path::Path, args: &[&str]) -> Result<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| BismuthError::Generic(format!("Failed to run git: {}", e)))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Allow "nothing to commit" as non-error
        if stderr.contains("nothing to commit") {
            return Ok(String::new());
        }
        return Err(BismuthError::Generic(format!("git {} failed: {}", args[0], stderr)));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Deploys via Vercel CLI. Requires `vercel` CLI installed and deploy_token set.
fn deploy_vercel(config: &PublishConfig) -> Result<()> {
    let token = config.deploy_token.as_deref().ok_or_else(|| {
        BismuthError::Generic("Vercel deploy requires a deploy_token".to_string())
    })?;

    let mut args = vec!["deploy", "--prod", "--yes"];
    let token_flag = format!("--token={}", token);
    args.push(&token_flag);

    if let Some(ref name) = config.project_name {
        tracing::info!(project = %name, "Deploying to Vercel");
    }

    let output = Command::new("vercel")
        .args(&args)
        .current_dir(&config.output_dir)
        .output()
        .map_err(|e| BismuthError::Generic(format!(
            "Failed to run vercel CLI (is it installed?): {}", e
        )))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(BismuthError::Generic(format!("Vercel deploy failed: {}", stderr)));
    }

    let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
    tracing::info!(url = %url, "Vercel deploy complete");
    Ok(())
}

/// Deploys via Netlify CLI. Requires `netlify` CLI installed and deploy_token + site_id.
fn deploy_netlify(config: &PublishConfig) -> Result<()> {
    let token = config.deploy_token.as_deref().ok_or_else(|| {
        BismuthError::Generic("Netlify deploy requires a deploy_token".to_string())
    })?;
    let site_id = config.site_id.as_deref().ok_or_else(|| {
        BismuthError::Generic("Netlify deploy requires a site_id".to_string())
    })?;

    let output_dir_str = config.output_dir.to_string_lossy().to_string();
    let output = Command::new("netlify")
        .args(["deploy", "--prod", "--dir", &output_dir_str, "--site", site_id])
        .env("NETLIFY_AUTH_TOKEN", token)
        .output()
        .map_err(|e| BismuthError::Generic(format!(
            "Failed to run netlify CLI (is it installed?): {}", e
        )))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(BismuthError::Generic(format!("Netlify deploy failed: {}", stderr)));
    }

    tracing::info!(site = %site_id, "Netlify deploy complete");
    Ok(())
}
