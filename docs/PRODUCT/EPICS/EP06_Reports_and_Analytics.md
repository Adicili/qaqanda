# EP06 — Reports & Analytics

## Epic Description
This epic adds reporting and analytics capabilities to the QAQ&A platform.  
It provides an API endpoint and UI for visualizing key usage metrics such as total queries, top questions, latency statistics, and knowledge base engagement.  
The goal is to help QA Leads and Engineers monitor platform effectiveness and usage patterns.

### Epic Completion Criteria
- Reports API aggregates live query and KB data from Databricks
- Reports UI displays data as readable charts and summary cards
- Only authenticated users (Engineer or Lead) can access reports
- Tests validate API data correctness and UI rendering
- Reports load in <1s on dev dataset

---

## EP06-US01 — Reports Summary API (3 pts)

### Description
As a developer, I need an endpoint that provides summary statistics so that the Reports UI can display real-time platform metrics.

### Acceptance Criteria
- Endpoint: `/api/reports/summary`
- Auth required: Engineer or Lead
- Returns JSON with keys:  
  `{ total_queries, top_questions[], top_docs[], avg_latency_ms }`
- Performs aggregation directly in Databricks
- Returns empty arrays if no data

### Tasks
- **EP06-US01-T01 — Implement `/api/reports/summary`**
  1. File: `app/api/reports/summary/route.ts`
  2. Validate user session and role (Engineer or Lead)
  3. Execute SQL queries for aggregations:
     - Total query count
     - Top 5 most frequent questions
     - Top 5 referenced KB docs
     - Average latency
  4. Return JSON response

- **EP06-US01-T02 — Write API tests**
  - Authenticated → 200 and valid structure
  - Unauthorized → 401
  - Empty DB → default zeros

### Deliverables
```
app/api/reports/summary/route.ts
tests/api/reports-summary.spec.ts
```

---

## EP06-US02 — Reports Dashboard UI (3 pts)

### Description
As an authenticated user, I want to view usage analytics in a simple dashboard so I can understand how the platform is performing.

### Acceptance Criteria
- Route `/reports`
- Accessible only to authenticated users
- Displays key metrics:
  - Total queries
  - Average latency
  - Top questions (list)
  - Top KB documents (list)
- Responsive layout with Tailwind
- Data fetched from `/api/reports/summary`
- Shows “No data available” message when empty

### Tasks
- **EP06-US02-T01 — Create Reports UI page**
  1. File: `app/reports/page.tsx`
  2. Fetch data from `/api/reports/summary`
  3. Render stats cards (Total queries, Avg latency)
  4. Render lists for top questions and top docs
  5. Handle loading + error states gracefully

- **EP06-US02-T02 — Add UI tests**
  - Authenticated user sees data
  - Unauthorized user redirected
  - No data → displays empty state message

### Deliverables
```
app/reports/page.tsx
tests/ui/reports.spec.ts
```

---

## ✅ EP06 Epic Done When
- `/api/reports/summary` returns valid JSON data
- `/reports` page renders analytics correctly
- Access restricted to authenticated users
- API and UI both covered by tests
- Reports load quickly on dev environment
