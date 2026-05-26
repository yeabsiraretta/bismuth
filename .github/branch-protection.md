# Branch Protection Rules

This document describes the branch protection rules to configure on GitHub.

## How to Apply

1. Go to **Settings** → **Branches** in the GitHub repository
2. Click **Add rule** for each branch pattern below
3. Configure the settings as specified

---

## `main` Branch Protection

**Branch name pattern**: `main`

### Protection Settings

✅ **Require a pull request before merging**
- Required approvals: **2**
- Dismiss stale pull request approvals when new commits are pushed: ✅
- Require review from Code Owners: ✅
- Require approval of the most recent reviewable push: ✅

✅ **Require status checks to pass before merging**
- Require branches to be up to date before merging: ✅
- Status checks that are required:
  - `Rust Checks / rust-checks (ubuntu-latest, stable)`
  - `Rust Checks / rust-checks (macos-latest, stable)`
  - `Rust Checks / rust-checks (windows-latest, stable)`
  - `Frontend Checks / frontend-checks`
  - `E2E Tests / e2e-tests (ubuntu-latest)`
  - `E2E Tests / e2e-tests (macos-latest)`
  - `E2E Tests / e2e-tests (windows-latest)`
  - `Security Audit / security-audit`
  - `Validate Commits / commit-lint`

✅ **Require conversation resolution before merging**

✅ **Require signed commits**

✅ **Require linear history**

✅ **Include administrators**

✅ **Restrict who can push to matching branches**
- Restrict pushes that create matching branches: ✅
- Allowed to push: (leave empty - no direct pushes)

✅ **Allow force pushes**: ❌ (disabled)

✅ **Allow deletions**: ❌ (disabled)

---

## `develop` Branch Protection

**Branch name pattern**: `develop`

### Protection Settings

✅ **Require a pull request before merging**
- Required approvals: **1**
- Dismiss stale pull request approvals when new commits are pushed: ✅
- Require review from Code Owners: ❌
- Require approval of the most recent reviewable push: ✅

✅ **Require status checks to pass before merging**
- Require branches to be up to date before merging: ✅
- Status checks that are required:
  - `Rust Checks / rust-checks (ubuntu-latest, stable)`
  - `Frontend Checks / frontend-checks`
  - `E2E Tests / e2e-tests (ubuntu-latest)`
  - `Security Audit / security-audit`

✅ **Require conversation resolution before merging**

✅ **Require signed commits**

✅ **Require linear history**: ❌ (allow merge commits from features)

✅ **Include administrators**

✅ **Restrict who can push to matching branches**
- Restrict pushes that create matching branches: ✅
- Allowed to push: (leave empty - no direct pushes)

✅ **Allow force pushes**: ❌ (disabled)

✅ **Allow deletions**: ❌ (disabled)

---

## `release/*` Branch Protection

**Branch name pattern**: `release/*`

### Protection Settings

✅ **Require a pull request before merging**
- Required approvals: **2**
- Dismiss stale pull request approvals when new commits are pushed: ✅
- Require review from Code Owners: ✅
- Require approval of the most recent reviewable push: ✅

✅ **Require status checks to pass before merging**
- Require branches to be up to date before merging: ✅
- Status checks that are required:
  - `Rust Checks / rust-checks (ubuntu-latest, stable)`
  - `Rust Checks / rust-checks (macos-latest, stable)`
  - `Rust Checks / rust-checks (windows-latest, stable)`
  - `Frontend Checks / frontend-checks`
  - `E2E Tests / e2e-tests (ubuntu-latest)`
  - `E2E Tests / e2e-tests (macos-latest)`
  - `E2E Tests / e2e-tests (windows-latest)`
  - `Security Audit / security-audit`
  - `Code Coverage / coverage`

✅ **Require conversation resolution before merging**

✅ **Require signed commits**

✅ **Require linear history**

✅ **Include administrators**

✅ **Allow force pushes**: ❌ (disabled)

✅ **Allow deletions**: ❌ (disabled)

---

## Additional Repository Settings

### General Settings

**Settings** → **General**

- **Default branch**: `develop`
- **Allow merge commits**: ✅
- **Allow squash merging**: ✅
- **Allow rebase merging**: ❌
- **Automatically delete head branches**: ✅

### Code Security and Analysis

**Settings** → **Code security and analysis**

- **Dependency graph**: ✅ Enabled
- **Dependabot alerts**: ✅ Enabled
- **Dependabot security updates**: ✅ Enabled
- **Dependabot version updates**: ✅ Enabled
- **Code scanning**: ✅ Enabled (CodeQL)
- **Secret scanning**: ✅ Enabled
- **Secret scanning push protection**: ✅ Enabled

### Actions Permissions

**Settings** → **Actions** → **General**

- **Actions permissions**: Allow all actions and reusable workflows
- **Workflow permissions**: Read and write permissions
- **Allow GitHub Actions to create and approve pull requests**: ❌

### Rulesets (Optional - GitHub Enterprise)

If using GitHub Enterprise, create rulesets:

1. **Critical Branches Ruleset**
   - Target branches: `main`, `develop`
   - Rules:
     - Require signed commits
     - Block force pushes
     - Require pull request reviews
     - Require status checks

2. **Release Branches Ruleset**
   - Target branches: `release/*`
   - Rules:
     - Require signed commits
     - Block force pushes
     - Require 2 reviewers

---

## CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Default owners for everything
* @yeabsiraretta

# Rust backend
/src-tauri/ @yeabsiraretta

# Frontend
/src/ @yeabsiraretta

# CI/CD
/.github/ @yeabsiraretta

# Documentation
/docs/ @yeabsiraretta
*.md @yeabsiraretta

# Configuration
*.toml @yeabsiraretta
*.json @yeabsiraretta
*.yml @yeabsiraretta
```

---

## Verification Checklist

After configuring, verify:

- [ ] Cannot push directly to `main`
- [ ] Cannot push directly to `develop`
- [ ] PRs to `main` require 2 approvals
- [ ] PRs to `develop` require 1 approval
- [ ] All CI checks must pass before merge
- [ ] Commit messages are validated
- [ ] Secrets cannot be committed
- [ ] Dependencies are scanned for vulnerabilities
- [ ] Branches are automatically deleted after merge

---

## Troubleshooting

**Issue**: Status checks not appearing
- **Solution**: Push a commit to trigger CI, then add checks to branch protection

**Issue**: Cannot merge despite passing checks
- **Solution**: Ensure branch is up-to-date with base branch

**Issue**: Administrators can bypass rules
- **Solution**: Enable "Include administrators" in branch protection

**Issue**: Signed commits required but failing
- **Solution**: Configure GPG signing: `git config commit.gpgsign true`
