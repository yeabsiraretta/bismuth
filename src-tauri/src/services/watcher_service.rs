//! File watcher service for monitoring vault changes
//!
//! Watches the vault directory for file system changes and triggers
//! appropriate handlers (database updates, index updates, etc.)

use crate::error::Result;
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Debounce duration for file system events (milliseconds)
const DEBOUNCE_MS: u64 = 300;

/// File watcher service
pub struct WatcherService {
    watcher: Option<RecommendedWatcher>,
    event_rx: Arc<Mutex<Receiver<Event>>>,
    _event_tx: Sender<Event>,
}

impl WatcherService {
    /// Creates a new WatcherService
    pub fn new() -> Result<Self> {
        let (tx, rx) = channel();

        Ok(Self {
            watcher: None,
            event_rx: Arc::new(Mutex::new(rx)),
            _event_tx: tx,
        })
    }

    /// Starts watching a directory
    ///
    /// # Arguments
    ///
    /// * `path` - Path to watch
    ///
    /// # Returns
    ///
    /// Ok(()) on success
    pub fn watch(&mut self, path: &Path) -> Result<()> {
        let (tx, rx) = channel();

        let mut watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
            if let Ok(event) = res {
                let _ = tx.send(event);
            }
        })?;

        watcher.watch(path, RecursiveMode::Recursive)?;

        self.watcher = Some(watcher);
        self.event_rx = Arc::new(Mutex::new(rx));

        Ok(())
    }

    /// Stops watching
    pub fn stop(&mut self) {
        self.watcher = None;
    }

    /// Gets the next debounced event
    ///
    /// Waits for events and debounces them (ignores rapid successive events
    /// for the same file within DEBOUNCE_MS milliseconds)
    ///
    /// # Returns
    ///
    /// The next file system event, or None if no events
    pub fn next_event(&self) -> Option<Event> {
        let rx = self.event_rx.lock().unwrap();
        
        // Try to receive an event (non-blocking)
        if let Ok(event) = rx.try_recv() {
            // Debounce: wait a bit and drain any duplicate events
            std::thread::sleep(Duration::from_millis(DEBOUNCE_MS));
            
            // Drain any additional events for the same paths
            let mut last_event = event;
            while let Ok(new_event) = rx.try_recv() {
                last_event = new_event;
            }
            
            Some(last_event)
        } else {
            None
        }
    }

    /// Polls for events with a timeout
    ///
    /// # Arguments
    ///
    /// * `timeout` - Maximum time to wait for an event
    ///
    /// # Returns
    ///
    /// The next event, or None if timeout expires
    pub fn poll_event(&self, timeout: Duration) -> Option<Event> {
        let rx = self.event_rx.lock().unwrap();
        let start = Instant::now();

        loop {
            if let Ok(event) = rx.try_recv() {
                // Debounce
                std::thread::sleep(Duration::from_millis(DEBOUNCE_MS));
                
                let mut last_event = event;
                while let Ok(new_event) = rx.try_recv() {
                    last_event = new_event;
                }
                
                return Some(last_event);
            }

            if start.elapsed() >= timeout {
                return None;
            }

            std::thread::sleep(Duration::from_millis(50));
        }
    }
}

impl Default for WatcherService {
    fn default() -> Self {
        Self::new().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_create_watcher() {
        let watcher = WatcherService::new();
        assert!(watcher.is_ok());
    }

    #[test]
    fn test_watch_directory() {
        let dir = tempdir().unwrap();
        let mut watcher = WatcherService::new().unwrap();

        let result = watcher.watch(dir.path());
        assert!(result.is_ok());
    }

    #[test]
    fn test_detect_file_creation() {
        let dir = tempdir().unwrap();
        let mut watcher = WatcherService::new().unwrap();
        watcher.watch(dir.path()).unwrap();

        // Create a file
        let file_path = dir.path().join("test.md");
        fs::write(&file_path, "test content").unwrap();

        // Poll for event with timeout
        let event = watcher.poll_event(Duration::from_secs(2));
        assert!(event.is_some());
    }

    #[test]
    fn test_detect_file_modification() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        fs::write(&file_path, "initial").unwrap();

        let mut watcher = WatcherService::new().unwrap();
        watcher.watch(dir.path()).unwrap();

        // Give watcher time to initialize
        std::thread::sleep(Duration::from_millis(100));

        // Modify file
        fs::write(&file_path, "modified").unwrap();

        // Poll for event
        let event = watcher.poll_event(Duration::from_secs(2));
        assert!(event.is_some());
    }

    #[test]
    fn test_stop_watching() {
        let dir = tempdir().unwrap();
        let mut watcher = WatcherService::new().unwrap();
        watcher.watch(dir.path()).unwrap();

        watcher.stop();
        assert!(watcher.watcher.is_none());
    }
}
