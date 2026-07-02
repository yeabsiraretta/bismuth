//! Push/pull/fetch operations for git sync.

use crate::error::{BismuthError, Result};
use super::GitService;
use super::credentials::build_callbacks;
use git2::FetchOptions;

impl GitService {
    /// Fetch from the default remote (origin).
    pub fn git_fetch(&self) -> Result<()> {
        let repo = self.open_repo()?;
        let mut remote = repo.find_remote("origin")
            .map_err(|e| BismuthError::Git(format!("No remote 'origin': {}", e)))?;

        let mut fetch_opts = FetchOptions::new();
        fetch_opts.remote_callbacks(build_callbacks());

        remote.fetch(&[] as &[&str], Some(&mut fetch_opts), None)
            .map_err(|e| BismuthError::Git(format!("Fetch failed: {}", e)))?;
        Ok(())
    }

    /// Push to the default remote (origin) on the current branch.
    /// Security: Never force-push without explicit confirmation.
    pub fn git_push(&self) -> Result<()> {
        let repo = self.open_repo()?;
        let head = repo.head()
            .map_err(|e| BismuthError::Git(format!("No HEAD: {}", e)))?;
        let branch_name = head.shorthand().unwrap_or("main");
        let refspec = format!("refs/heads/{}:refs/heads/{}", branch_name, branch_name);

        let mut remote = repo.find_remote("origin")
            .map_err(|e| BismuthError::Git(format!("No remote 'origin': {}", e)))?;

        let mut push_opts = git2::PushOptions::new();
        push_opts.remote_callbacks(build_callbacks());

        remote.push(&[&refspec], Some(&mut push_opts))
            .map_err(|e| BismuthError::Git(format!("Push failed: {}", e)))?;
        Ok(())
    }

    /// Pull: fetch + fast-forward merge. Does NOT auto-resolve conflicts.
    pub fn git_pull(&self) -> Result<String> {
        self.git_fetch()?;

        let repo = self.open_repo()?;
        let head = repo.head()
            .map_err(|e| BismuthError::Git(format!("No HEAD: {}", e)))?;
        let branch_name = head.shorthand().unwrap_or("main");

        let fetch_head = repo.find_reference(&format!("refs/remotes/origin/{}", branch_name))
            .map_err(|e| BismuthError::Git(format!("No tracking branch: {}", e)))?;

        let fetch_commit = repo.reference_to_annotated_commit(&fetch_head)
            .map_err(|e| BismuthError::Git(format!("Failed to resolve fetch HEAD: {}", e)))?;

        let (merge_analysis, _) = repo.merge_analysis(&[&fetch_commit])
            .map_err(|e| BismuthError::Git(format!("Merge analysis failed: {}", e)))?;

        if merge_analysis.is_up_to_date() {
            return Ok("Already up to date".to_string());
        }

        if merge_analysis.is_fast_forward() {
            let mut reference = repo.find_reference(&format!("refs/heads/{}", branch_name))
                .map_err(|e| BismuthError::Git(format!("Branch ref not found: {}", e)))?;
            reference.set_target(fetch_commit.id(), "fast-forward pull")
                .map_err(|e| BismuthError::Git(format!("FF failed: {}", e)))?;
            repo.set_head(&format!("refs/heads/{}", branch_name))
                .map_err(|e| BismuthError::Git(format!("Set HEAD failed: {}", e)))?;
            repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
                .map_err(|e| BismuthError::Git(format!("Checkout failed: {}", e)))?;
            return Ok("Fast-forwarded".to_string());
        }

        if merge_analysis.is_normal() {
            return Err(BismuthError::Git(
                "Merge conflicts detected. Please resolve manually.".to_string(),
            ));
        }

        Ok("No action needed".to_string())
    }
}
