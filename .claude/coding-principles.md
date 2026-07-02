# Global Coding Principles

Produce clean, efficient, maintainable code. Strive for readability, simplicity, modularity regardless of language.
Respect language idioms, use intuitive naming, consider error handling and testing from the outset.
Balance clarity with performance, factor in future scalability and maintainability.

## Code Style and Readability

1. **Clarity Over Brevity**: Favor understandable code over clever tricks
2. **Consistent Naming**: Descriptive, self-explanatory names following language conventions
3. **Consistent Formatting**: Uniform indentation, spacing, line width via automated tools
4. **Comments That Add Value**: Explain "why" behind complex logic, not just "what"
5. **Small, Single-Responsibility Functions**: Concise, focused, one thing well

## Architecture and Modularity

1. **Encapsulate Complexity**: Hide complex logic behind clear interfaces
2. **Decouple Components**: Minimal direct knowledge, use interfaces/dependency injection
3. **DRY (Don't Repeat Yourself)**: Factor out repetitive patterns
4. **Design for Extensibility**: Add features without major rewrites

## Error Handling and Testing

1. **Fail Fast, Fail Loud**: Validate early, clear error messages
2. **Testability as Priority**: Easy to test in isolation, separate pure logic from side effects
3. **Thorough Input Validation**: Check correctness, sanity, security before processing
4. **Iterative Validation**: Run tests frequently, catch regressions early

## Performance and Resource Management

1. **Appropriate Data Structures**: Choose best-suited for problem, reasonable complexity
2. **Avoid Premature Optimization**: Start clean, measure with profiling, address hotspots
3. **Resource Lifecycle Awareness**: Proper memory, file handles, connections cleanup

## Git and Commit Guidelines

- **Never use terminal Git commands in Cascade chat**
- **Commit message format**: `prefix: short description (max one sentence)`
- **Prefixes**: feat, fix, tweak, style, refactor, perf, test, docs, chore, ci, build, revert, hotfix, init, merge
- Always format commit messages in code blocks

## Language-Specific Best Practices

### TypeScript/JavaScript

- Use strict mode and proper type annotations
- Prefer `const` over `let`, avoid `var`
- Use async/await over raw promises
- Destructure for clarity

### Rust

- Use `Result<T, E>` for error handling
- Prefer borrowing over cloning
- Use iterators over loops when appropriate
- Follow Rust API guidelines

### Svelte

- Keep components under 300 lines
- Use stores for shared state
- Reactive statements for derived values
- Props for component inputs

---

**Source**: Adapted from industry best practices and steipete/agent-scripts  
**Last Updated**: 2026-05-26
