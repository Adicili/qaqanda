# QAQandA App

Internal QA & Knowledge Management tool built with **Next.js (App Router)**, **TypeScript**, **TailwindCSS**, and **Playwright**.  
Project adheres to EP01 setup and follows strict linting, testing, and CI/CD standards.

---

## 🧰 Prerequisites

| Tool       | Version   |
| ---------- | --------- |
| Node.js    | >= 20.x   |
| pnpm       | >= 10.x   |
| TypeScript | >= 5.x    |
| Playwright | >= 1.48.x |

> Check your setup:
>
> ```bash
> node -v
> pnpm -v
> ```

---

## ⚙️ Setup & Run

### 1. Install dependencies

```bash
pnpm install
```

### 2. Run in development mode

```bash
pnpm dev
```

App starts on [http://localhost:3000](http://localhost:3000).

### 3. Build for production

```bash
pnpm build && pnpm start
```

---

## 🧪 Testing

### Run Playwright tests

```bash
pnpm playwright test
```

### Run TypeScript type check

```bash
pnpm tsc --noEmit
```

### Run ESLint & Prettier

```bash
pnpm lint
pnpm format
```

Pre-commit hook enforces lint + format automatically.

---

## 🧱 Project Structure

```
/app       → Next.js App Router
/lib       → Utilities (env, session, db wrappers)
/schemas   → Zod schemas & DTO definitions
/tests     → Playwright tests
  /ui      → UI smoke & regression
  /api     → API & integration tests
  /pages   → Page Object Models (POM)
/public    → Static assets
```

---

## 🎨 Styling

TailwindCSS (utility-first).  
Edit styles in `app/globals.css` and configure paths in `tailwind.config.js`.

---

## 🧩 Tooling

| Tool        | Purpose                                    |
| ----------- | ------------------------------------------ |
| ESLint      | Code linting                               |
| Prettier    | Formatting                                 |
| Husky       | Git hooks (pre-commit)                     |
| Lint-Staged | Runs lint on staged files                  |
| Playwright  | End-to-end testing                         |
| CI/CD       | GitHub Actions integration planned in EP08 |

---

## 🧭 Runbook

| Command             | Description          |
| ------------------- | -------------------- |
| `pnpm install`      | Install dependencies |
| `pnpm dev`          | Run local dev server |
| `pnpm build`        | Production build     |
| `pnpm lint`         | Run ESLint           |
| `pnpm format`       | Format code          |
| `pnpm test`         | Run Playwright suite |
| `pnpm tsc --noEmit` | Type check only      |

---

## 🧾 Notes

- Environment variables: define in `.env.local` (ignored by Git).
- Git hooks auto-run lint & format before every commit.
- Code style follows **Next.js + Prettier** conventions.

---

💡 _Maintained as part of EP01 – Project Foundation and Tooling._
