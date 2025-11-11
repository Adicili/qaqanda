# EP08 — CI/CD Pipeline Integration

## Epic Description

This epic establishes continuous integration and continuous delivery (CI/CD) for the QAQ&A application.  
It ensures automated builds, tests, and deployments for both backend and frontend using GitHub Actions.  
The pipeline will run unit, API, and UI tests, generate reports, and automatically deploy to staging after successful checks.

### Epic Completion Criteria

- GitHub Actions pipeline configured and functional
- Separate workflows for `build`, `test`, and `deploy`
- Unit, API, and Playwright tests run on each pull request
- Test artifacts (reports, screenshots, videos) uploaded
- Deployment to staging triggered on main branch merge
- Environment variables securely managed via GitHub Secrets

---

## EP08-US01 — CI: Build & Test Pipeline (3 pts)

### Description

As a developer, I want CI to automatically build and test the app on every PR, so code quality and stability are maintained.

### Acceptance Criteria

- Workflow runs on `pull_request` and `push` to `main`
- Installs dependencies using Node.js 20
- Runs `lint`, `type-check`, and `test` scripts
- Uploads Playwright reports as artifacts on failure
- Fails fast on any test error

### Tasks

- **EP08-US01-T01 — Create GitHub Actions workflow**
  1. File: `.github/workflows/ci.yml`
  2. Define jobs: `build`, `test`
  3. Matrix for OS: `ubuntu-latest`
  4. Commands:
     ```bash
     npm ci
     npm run lint
     npm run type-check
     npm run test
     ```

- **EP08-US01-T02 — Add Playwright test integration**
  1. Add step to install browsers: `npx playwright install --with-deps`
  2. Run UI tests with `npx playwright test`
  3. Upload test artifacts (`playwright-report`, `videos`, `screenshots`)

- **EP08-US01-T03 — Configure caching**
  - Use npm cache to speed up CI runs

### Deliverables

```
.github/workflows/ci.yml
```

---

## EP08-US02 — CD: Deployment Pipeline (3 pts)

### Description

As a DevOps engineer, I want CI/CD to deploy the app to a staging environment after successful tests, ensuring a stable build before production.

### Acceptance Criteria

- Workflow triggered on successful CI merge to `main`
- Deploys automatically to `staging` environment (e.g., Vercel or Azure Web App)
- Uses GitHub Secrets for tokens and credentials
- Includes environment variables for DB, LLM API, etc.
- Deployment status visible in GitHub Actions tab

### Tasks

- **EP08-US02-T01 — Create `deploy.yml` workflow**
  1. File: `.github/workflows/deploy.yml`
  2. Trigger: `on: push: branches: [main]`
  3. Steps:
     - Checkout repo
     - Install dependencies
     - Build project
     - Deploy using platform CLI (Vercel or Azure)
  4. Use environment variables from GitHub Secrets

- **EP08-US02-T02 — Configure staging environment**
  - Add `.env.staging` file locally (excluded from Git)
  - Include secrets:
    - `DATABRICKS_HOST`
    - `DATABRICKS_TOKEN`
    - `OPENAI_API_KEY`

- **EP08-US02-T03 — Add deployment badge**
  - Add status badge to `README.md` for quick visibility

### Deliverables

```
.github/workflows/deploy.yml
README.md (with build + deploy badges)
```

---

## EP08-US03 — CI Test Reports & Notifications (2 pts)

### Description

As a QA Lead, I want CI to automatically generate and share test reports and failure notifications so that issues are visible immediately.

### Acceptance Criteria

- Playwright HTML report uploaded as artifact
- Slack or email notification sent on failure (optional later)
- Workflow summary shows pass/fail counts

### Tasks

- **EP08-US03-T01 — Add artifact upload to CI workflow**
  - On failure, upload `/playwright-report` as artifact
  - Retain artifacts for 7 days

- **EP08-US03-T02 — Add job summary**
  - Append summary with key stats:
    - Passed/failed test counts
    - Duration
    - Commit info

- **EP08-US03-T03 — Optional notification integration**
  - Slack webhook or email trigger for failed runs

### Deliverables

```
.github/workflows/ci.yml (updated with artifacts + summary)
```

---

## ✅ EP08 Epic Done When

- CI runs build + test automatically on PRs
- Playwright tests run in headless mode with reports saved
- Deploy pipeline triggers on main merges
- Artifacts and status visible in GitHub Actions
- Staging deployment stable and repeatable
