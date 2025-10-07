# Commit and Branch Convention

This document defines the naming conventions for commits and branches in this project.

---

## 📝 Commits

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description            | Example                             |
| ---------- | ---------------------- | ----------------------------------- |
| `Feat`     | ✨ New feature         | `Feat: add user login`              |
| `Fix`      | 🐛 Bug fix             | `Fix: resolve navbar display issue` |
| `Docs`     | 📚 Documentation       | `Docs: update installation guide`   |
| `Style`    | 💅 Formatting, style   | `Style: format code with prettier`  |
| `Refactor` | ♻️ Code refactoring    | `Refactor: simplify auth logic`     |
| `Perf`     | ⚡ Performance         | `Perf: optimize image loading`      |
| `Test`     | ✅ Tests               | `Test: add unit tests for auth`     |
| `Chore`    | 🔧 Maintenance         | `Chore: update dependencies`        |
| `Build`    | 📦 Build, dependencies | `Build: upgrade webpack config`     |
| `Ci`       | 👷 CI/CD               | `Ci: add GitHub Actions workflow`   |
| `Revert`   | ⏪ Revert changes      | `Revert: revert commit abc123`      |

### Rules

- ✅ Use **imperative mood**: "add" not "added"
- ✅ **Capitalize** the type (first letter uppercase)
- ✅ **No period** at the end
- ✅ Maximum **50 characters** for description
- ✅ Blank line before body
- ✅ Body message: maximum **72 characters** per line

### Examples

#### Simple commit

```bash
git commit -m "Feat: add user registration form"
```

#### Commit with scope

```bash
git commit -m "Fix(auth): resolve token expiration bug"
```

#### Detailed commit

```bash
git commit -m "Feat: implement password reset functionality

Add email verification system for password reset.
Include rate limiting to prevent abuse.
Update user model with reset token fields.

Closes #123"
```

---

## 🌿 Branches

### Format

```
<type>/<description-kebab-case>
```

or with ticket reference:

```
<type>/<ticket-id>-<description>
```

### Branch Types

| Type        | Description              | Example                     |
| ----------- | ------------------------ | --------------------------- |
| `feat/`     | ✨ New feature           | `feat/user-login`           |
| `fix/`      | 🐛 Bug fix               | `fix/navbar-display-issue`  |
| `docs/`     | 📚 Documentation         | `docs/installation-guide`   |
| `style/`    | 💅 Formatting, style     | `style/prettier-config`     |
| `refactor/` | ♻️ Code refactoring      | `refactor/auth-logic`       |
| `perf/`     | ⚡ Performance           | `perf/image-loading`        |
| `test/`     | ✅ Tests                 | `test/auth-unit-tests`      |
| `chore/`    | 🔧 Maintenance           | `chore/update-dependencies` |
| `build/`    | 📦 Build, dependencies   | `build/webpack-config`      |
| `ci/`       | 👷 CI/CD                 | `ci/github-actions`         |
| `hotfix/`   | 🚨 Urgent production fix | `hotfix/security-patch`     |
| `release/`  | 🚀 Release preparation   | `release/v1.2.0`            |

### Rules

- ✅ **Lowercase only**
- ✅ Use **hyphens** (`-`) to separate words
- ✅ **No spaces** or special characters
- ✅ **Descriptive and concise** name
- ✅ Include **ticket number** if applicable

### Examples

```bash
# New feature
git checkout -b feat/user-authentication

# Bug fix with ticket
git checkout -b fix/42-navbar-responsive

# Urgent hotfix
git checkout -b hotfix/critical-security-issue

# Release
git checkout -b release/v2.1.0
```

---

## 🔄 Standard Workflow

### 1. Create a branch

```bash
# From main or develop
git checkout main
git pull origin main
git checkout -b feat/new-feature
```

### 2. Make atomic commits

```bash
# Small and logical commits
git add src/auth/
git commit -m "Feat: add login component"

git add src/auth/register.js
git commit -m "Feat: add registration logic"
```

### 3. Push and Pull Request

```bash
# Push the branch
git push origin feat/new-feature

# Create a Pull Request on GitHub
# Title: "Feat: implement user authentication"
```

### 4. Merge and cleanup

```bash
# After PR approval
git checkout main
git pull origin main
git branch -d feat/new-feature
```

---

## 🎯 Recommended Scopes

Scopes allow you to specify the scope of the change:

| Scope      | Description    |
| ---------- | -------------- |
| `auth`     | Authentication |
| `api`      | API / Backend  |
| `ui`       | User Interface |
| `db`       | Database       |
| `config`   | Configuration  |
| `deps`     | Dependencies   |
| `security` | Security       |

### Examples with scope

```bash
git commit -m "Feat(auth): add OAuth2 support"
git commit -m "Fix(api): resolve CORS issue"
git commit -m "Perf(db): optimize user queries"
```

---

## 🚫 Examples to Avoid

❌ **Bad examples**

```bash
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "Update code"
git commit -m "asdf"
git checkout -b my_new_feature
git checkout -b FEAT/UserAuth
```

✅ **Good examples**

```bash
git commit -m "Fix: resolve login validation error"
git commit -m "Feat: add email verification"
git commit -m "Docs: update API documentation"
git checkout -b feat/user-authentication
git checkout -b fix/navbar-mobile
```
