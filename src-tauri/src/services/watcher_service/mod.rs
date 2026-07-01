//! File watcher service for monitoring vault changes.

use crate::error::Result;
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

const DEBOUNCE_MS: u64 = 300;

pub struct WatcherService {
    watcher: Option<RecommendedWatcher>,
    event_rx: Arc<Mutex<Receiver<Event>>>,
    _event_tx: Sender<Event>,
}

impl WatcherService {
    pub fn new() -> Result<Self> {
        let (tx, rx) = channel();
        Ok(Self { watcher: None, event_rx: Arc::new(Mutex::new(rx)), _event_tx: tx })
    }

    pub fn watch(&mut self, path: &Path) -> Result<()> {
        let (tx, rx) = channel();
        let mut watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
            if let Ok(event) = res { let _ = tx.send(event); }
        })?;
        watcher.watch(path, RecursiveMode::Recursive)?;
        self.watcher = Some(watcher);
        self.event_rx = Arc::new(Mutex::new(rx));
        Ok(())
    }

    pub fn stop(&mut self) {
        self.watcher = None;
    }

    pub fn next_event(&self) -> Option<Event> {
        let event = { let rx = self.event_rx.lock().unwrap(); rx.try_recv().ok() }?;
        std::thread::sleep(Duration::from_millis(DEBOUNCE_MS));
        let rx = self.event_rx.lock().unwrap();
        let mut last = event;
        while let Ok(e) = rx.try_recv() { last = e; }
        Some(last)
    }

    pub fn poll_event(&self, timeout: Duration) -> Option<Event> {
        let start = Instant::now();
        loop {
            let event = { let rx = self.event_rx.lock().unwrap(); rx.try_recv().ok() };
            if let Some(event) = event {
                std::thread::sleep(Duration::from_millis(DEBOUNCE_MS));
                let rx = self.event_rx.lock().unwrap();
                let mut last = event;
                while let Ok(e) = rx.try_recv() { last = e; }
                return Some(last);
            }
            if start.elapsed() >= timeout { return None; }
            std::thread::sleep(Duration::from_millis(50));
        }
    }
}

impl Default for WatcherService {
    fn default() -> Self { Self::new().unwrap() }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_create_watcher() { assert!(WatcherService::new().is_ok()); }

    #[test]
    fn test_watch_directory() {
        let dir = tempdir().unwrap();
        let mut w = WatcherService::new().unwrap();
        assert!(w.watch(dir.path()).is_ok());
    }

    #[test]
    fn test_detect_file_creation() {
        let dir = tempdir().unwrap();
        let mut w = WatcherService::new().unwrap();
        w.watch(dir.path()).unwrap();
        fs::write(dir.path().join("test.md"), "test content").unwrap();
        assert!(w.poll_event(Duration::from_secs(2)).is_some());
    }

    #[test]
    fn test_detect_file_modification() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.md");
        fs::write(&file_path, "initial").unwrap();
        let mut w = WatcherService::new().unwrap();
        w.watch(dir.path()).unwrap();
        std::thread::sleep(Duration::from_millis(100));
        fs::write(&file_path, "modified").unwrap();
        assert!(w.poll_event(Duration::from_secs(2)).is_some());
    }

    #[test]
    fn test_stop_watching() {
        let dir = tempdir().unwrap();
        let mut w = WatcherService::new().unwrap();
        w.watch(dir.path()).unwrap();
        w.stop();
        assert!(w.watcher.is_none());
    }
}
