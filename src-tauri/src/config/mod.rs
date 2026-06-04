/// Configuration module
/// 
/// Provides centralized configuration management with:
/// - Constants: Compile-time configuration values
/// - Settings: Runtime user-configurable settings
/// 
/// # Usage
/// 
/// ```rust
/// use crate::config::constants;
/// use crate::config::settings::AppSettings;
/// 
/// // Use constants
/// if file_size > constants::filesystem::MAX_FILE_SIZE_BYTES {
///     // Handle large file
/// }
/// 
/// // Load and use settings
/// let settings = AppSettings::load(&path)?;
/// let delay = settings.editor.auto_save_delay_ms;
/// ```

pub mod constants;
pub mod settings;

pub use constants::*;
pub use settings::AppSettings;
