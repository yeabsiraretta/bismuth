use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Represents a Bismuth vault (a folder containing markdown notes)
///
/// A Vault is the root container for all notes and configuration.
/// It validates that the path exists and is a directory.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vault {
    /// Absolute path to the vault root directory
    pub root_path: PathBuf,
    
    /// Path to the settings file (.bismuth/config.json)
    pub settings_path: PathBuf,
    
    /// Display name of the vault
    pub name: String,
}

impl Vault {
    /// Creates a new Vault from a root path
    ///
    /// Validates that the path exists and is a directory.
    /// Sets up the settings path at `.bismuth/config.json`.
    ///
    /// # Arguments
    ///
    /// * `root_path` - Absolute path to the vault directory
    ///
    /// # Returns
    ///
    /// Result containing the Vault or an error message
    ///
    /// # Errors
    ///
    /// Returns an error if:
    /// - Path does not exist
    /// - Path is not a directory
    /// - Path cannot be canonicalized
    pub fn new(root_path: PathBuf) -> Result<Self, String> {
        // Validate path exists
        if !root_path.exists() {
            return Err(format!("Path does not exist: {}", root_path.display()));
        }
        
        // Validate it's a directory
        if !root_path.is_dir() {
            return Err(format!("Path is not a directory: {}", root_path.display()));
        }
        
        // Canonicalize to get absolute path
        let root_path = root_path
            .canonicalize()
            .map_err(|e| format!("Failed to canonicalize path: {}", e))?;
        
        // Set up settings path
        let settings_path = root_path.join(".bismuth").join("config.json");
        
        // Extract vault name from directory name
        let name = root_path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("Unnamed Vault")
            .to_string();
        
        Ok(Self {
            root_path,
            settings_path,
            name,
        })
    }
    
    /// Creates a new vault with a custom name
    pub fn with_name(root_path: PathBuf, name: String) -> Result<Self, String> {
        let mut vault = Self::new(root_path)?;
        vault.name = name;
        Ok(vault)
    }
    
    /// Gets the .bismuth directory path
    pub fn bismuth_dir(&self) -> PathBuf {
        self.root_path.join(".bismuth")
    }
    
    /// Gets the notes directory path (defaults to root)
    pub fn notes_dir(&self) -> PathBuf {
        self.root_path.clone()
    }
    
    /// Gets the templates directory path
    pub fn templates_dir(&self) -> PathBuf {
        self.bismuth_dir().join("templates")
    }
    
    /// Gets the themes directory path
    pub fn themes_dir(&self) -> PathBuf {
        self.bismuth_dir().join("themes")
    }
    
    /// Gets the plugins directory path
    pub fn plugins_dir(&self) -> PathBuf {
        self.bismuth_dir().join("plugins")
    }
    
    /// Gets the index directory path
    pub fn index_dir(&self) -> PathBuf {
        self.bismuth_dir().join("index")
    }
    
    /// Gets the recovery directory path
    pub fn recovery_dir(&self) -> PathBuf {
        self.bismuth_dir().join("recovery")
    }
    
    /// Gets the history directory path
    pub fn history_dir(&self) -> PathBuf {
        self.bismuth_dir().join("history")
    }
    
    /// Checks if a path is within the vault
    pub fn contains_path(&self, path: &PathBuf) -> bool {
        path.starts_with(&self.root_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;
    
    #[test]
    fn test_new_vault_valid_path() {
        let temp_dir = TempDir::new().unwrap();
        let vault_path = temp_dir.path().to_path_buf();
        
        let vault = Vault::new(vault_path.clone());
        
        assert!(vault.is_ok());
        let vault = vault.unwrap();
        assert_eq!(vault.root_path, vault_path.canonicalize().unwrap());
        assert!(vault.settings_path.ends_with(".bismuth/config.json"));
    }
    
    #[test]
    fn test_new_vault_nonexistent_path() {
        let vault_path = PathBuf::from("/nonexistent/path");
        let vault = Vault::new(vault_path);
        
        assert!(vault.is_err());
        assert!(vault.unwrap_err().contains("does not exist"));
    }
    
    #[test]
    fn test_new_vault_file_not_directory() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("file.txt");
        fs::write(&file_path, "test").unwrap();
        
        let vault = Vault::new(file_path);
        
        assert!(vault.is_err());
        assert!(vault.unwrap_err().contains("not a directory"));
    }
    
    #[test]
    fn test_vault_with_custom_name() {
        let temp_dir = TempDir::new().unwrap();
        let vault_path = temp_dir.path().to_path_buf();
        
        let vault = Vault::with_name(vault_path, "My Custom Vault".to_string());
        
        assert!(vault.is_ok());
        assert_eq!(vault.unwrap().name, "My Custom Vault");
    }
    
    #[test]
    fn test_vault_directory_helpers() {
        let temp_dir = TempDir::new().unwrap();
        let vault_path = temp_dir.path().to_path_buf();
        let vault = Vault::new(vault_path.clone()).unwrap();
        
        assert!(vault.bismuth_dir().ends_with(".bismuth"));
        assert!(vault.templates_dir().ends_with(".bismuth/templates"));
        assert!(vault.themes_dir().ends_with(".bismuth/themes"));
        assert!(vault.index_dir().ends_with(".bismuth/index"));
        assert!(vault.recovery_dir().ends_with(".bismuth/recovery"));
        assert!(vault.history_dir().ends_with(".bismuth/history"));
    }
    
    #[test]
    fn test_contains_path() {
        let temp_dir = TempDir::new().unwrap();
        let vault_path = temp_dir.path().to_path_buf();
        let vault = Vault::new(vault_path.clone()).unwrap();
        
        // Use canonicalized vault path for comparison
        let inside_path = vault.root_path.join("notes").join("test.md");
        let outside_path = PathBuf::from("/tmp/other.md");
        
        assert!(vault.contains_path(&inside_path));
        assert!(!vault.contains_path(&outside_path));
    }
}
