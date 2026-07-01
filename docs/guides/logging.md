# Bismuth Logging Guide

## Frontend Logger (TypeScript)

### Basic Usage

```typescript
import { log, logger, LogLevel } from '@/utils/logger';

// Simple logging
log.debug('Debug message');
log.info('Application started');
log.warn('Warning message');
log.error('Error occurred', new Error('Something went wrong'));
log.fatal('Fatal error', new Error('Critical failure'));

// With context
log.info('User action', { action: 'create_note', noteId: '123' });
log.error('API call failed', error, { endpoint: '/api/notes', status: 500 });
```

### Advanced Features

```typescript
// Set log level (DEBUG, INFO, WARN, ERROR, FATAL)
logger.setLevel(LogLevel.DEBUG);

// Get all logs
const allLogs = logger.getLogs();

// Get logs by level
const errors = logger.getLogs(LogLevel.ERROR);

// Export logs as JSON
const logsJson = logger.exportLogs();

// Download logs as file
logger.downloadLogs();

// Clear all logs
logger.clearLogs();
```

### Features

- **5 Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Structured Logging**: Add context objects to any log
- **Persistence**: Automatically saves last 100 logs to localStorage
- **Color-coded Console**: Different colors for each log level
- **Export**: Download logs as JSON file
- **Stack Traces**: Automatic stack trace capture for errors

## Backend Logger (Rust)

### Basic Usage

```rust
use tracing::{debug, info, warn, error};

// Simple logging
debug!("Debug message");
info!("Application started");
warn!("Warning message");
error!("Error occurred");

// With context
info!(user_id = "123", action = "create_note", "User created a note");
error!(error = ?err, path = "/api/notes", "API call failed");
```

### Structured Logging with Context

```rust
use crate::log_with_context;

// Using the custom macro
log_with_context!(info, "Processing request",
    request_id = "abc123",
    user_id = "user_456",
    duration_ms = 150
);

log_with_context!(error, "Database query failed",
    query = "SELECT * FROM notes",
    error = err.to_string()
);
```

### Features

- **File Rotation**: Daily log rotation in `.bismuth/logs/`
- **Dual Output**: Logs to both file and console
- **Structured Logging**: Key-value pairs with context
- **Thread Information**: Thread IDs and names in file logs
- **Source Location**: File and line numbers in file logs
- **Colored Console**: ANSI colors for terminal output
- **Environment Control**: Set `RUST_LOG` env var to control levels

### Log Levels

```bash
# Set log level via environment variable
export RUST_LOG=debug  # Show all logs
export RUST_LOG=info   # Show info and above
export RUST_LOG=bismuth=debug  # Debug for bismuth, info for others
```

## Log Files

### Frontend

- Stored in browser localStorage
- Key: `bismuth_logs`
- Last 100 entries persisted
- Can be exported as JSON

### Backend

- Location: `.bismuth/logs/bismuth.log`
- Rotation: Daily
- Format: Structured JSON-like format
- Includes: timestamp, level, target, thread, file, line, message

## Example Output

### Frontend Console

```
[14:30:45] [INFO] Application started
Context: { version: "0.0.1", mode: "development" }

[14:30:46] [ERROR] Failed to load note
Context: { noteId: "123", path: "/notes/test.md" }
Error: Error: File not found
Stack: Error: File not found
    at loadNote (vault.ts:45)
```

### Backend File

```
2026-05-26T14:30:45.123Z INFO bismuth::main: Starting Bismuth PKM Editor
2026-05-26T14:30:45.456Z INFO bismuth::main: Database initialized path="/Users/user/.bismuth/bismuth.db"
2026-05-26T14:30:46.789Z ERROR bismuth::commands::vault: Failed to read note path="/notes/test.md" error="No such file"
```

## Best Practices

1. **Use appropriate log levels**
   - DEBUG: Detailed diagnostic information
   - INFO: General informational messages
   - WARN: Warning messages for potentially harmful situations
   - ERROR: Error events that might still allow the app to continue
   - FATAL: Severe errors that will lead to abort

2. **Add context to logs**

   ```typescript
   // Good
   log.error('Failed to save note', error, { noteId, userId, timestamp });

   // Bad
   log.error('Error');
   ```

3. **Don't log sensitive information**
   - Avoid logging passwords, tokens, API keys
   - Sanitize user data before logging

4. **Use structured logging**

   ```rust
   // Good
   info!(user_id = user.id, action = "login", "User logged in");

   // Bad
   info!("User {} logged in", user.id);
   ```

5. **Review logs regularly**
   - Check `.bismuth/logs/` for backend issues
   - Use browser DevTools for frontend logs
   - Download and analyze exported logs for debugging
