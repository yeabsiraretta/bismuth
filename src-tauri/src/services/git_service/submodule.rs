//! Git submodule operations.

use crate::error::{BismuthError, Result};
use super::GitService;

/// Status of a single submodule.
#[derive(Debug, Clone, serde::Serialize)]
pub struct SubmoduleStatus {
    pub name: String,
    pub path: String,
    pub url: String,
    pub initialized: bool,
}

impl GitService {
    /// Detect and list all submodules in the vault repo.
    pub fn submodule_status(&self) -> Result<Vec<SubmoduleStatus>> {
        let repo = self.open_repo()?;
        let submodules = repo.submodules()
            .map_err(|e| BismuthError::Git(format!("Failed to list submodules: {}", e)))?;

        let mut results = Vec::new();
        for sm in &submodules {
            results.push(SubmoduleStatus {
                name: sm.name().unwrap_or("").to_string(),
                path: sm.path().to_string_lossy().to_string(),
                url: sm.url().unwrap_or("").to_string(),
                initialized: sm.open().is_ok(),
            });
        }
        Ok(results)
    }

    /// Initialize all submodules.
    pub fn init_submodules(&self) -> Result<()> {
        let repo = self.open_repo()?;
        let mut submodules = repo.submodules()
            .map_err(|e| BismuthError::Git(format!("Failed to list submodules: {}", e)))?;

        for sm in &mut submodules {
            sm.init(false)
                .map_err(|e| BismuthError::Git(format!("Init submodule failed: {}", e)))?;
        }
        Ok(())
    }

    /// Update all submodules (fetch + checkout).
    pub fn update_submodules(&self) -> Result<()> {
        let repo = self.open_repo()?;
        let mut submodules = repo.submodules()
            .map_err(|e| BismuthError::Git(format!("Failed to list submodules: {}", e)))?;

        for sm in &mut submodules {
            sm.update(true, None)
                .map_err(|e| BismuthError::Git(format!("Update submodule failed: {}", e)))?;
        }
        Ok(())
    }
}
