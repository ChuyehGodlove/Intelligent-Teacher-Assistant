# Intelligent Teacher Assistant

## Overview

Full-stack education management platform. Teachers can manage classes, create MCQ tests, view Class Understanding Index (CUI) scores, and upload handwritten papers for OCR. Students can log in with a code and take MCQ tests.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/intelligent-teacher), Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend API**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **File uploads**: Multer
- **Build**: esbuild (CJS bundle)

## Structure

```text
/
├── artifacts/
│   ├── api-server/         # Express API backend
│   └── intelligent-teacher/ # React + Vite frontend
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── classes.ts      # Classes table
│           ├── students.ts     # Students table (with student codes e.g. STU001)
│           ├── tests.ts        # Tests + Questions tables
│           ├── results.ts      # Test results table
│           └── uploads.ts      # Paper uploads table
├── scripts/
└── pnpm-workspace.yaml
```

## Database Schema

- **classes** — id, name, subject, grade, created_at
- **students** — id, name, email, student_code (e.g. STU001), class_id, created_at
- **tests** — id, title, class_id, duration_minutes, is_active, created_at
- **questions** — id, test_id, question_text, option_a/b/c/d, correct_answer, points, order_index
- **test_results** — id, test_id, student_id, earned_points, total_points, submitted_at
- **paper_uploads** — id, filename, original_name, student_id, class_id, description, ocr_status, ocr_text, uploaded_at

## API Routes (all at /api prefix)

- `GET /api/healthz` — Health check
- `GET/POST /api/classes` — List/create classes
- `GET /api/classes/:id` — Get class
- `GET /api/classes/:id/cui` — Class Understanding Index
- `GET /api/dashboard/overview` — Teacher dashboard overview
- `GET/POST /api/students` — List/create students (auto-generates student codes)
- `GET /api/students/:id` — Get student
- `GET/POST /api/tests` — List/create MCQ tests (with questions array)
- `GET /api/tests/:id` — Get test with questions (no correct answers shown)
- `POST /api/tests/:id/submit` — Submit MCQ answers by student code
- `GET /api/results` — List results (filterable by testId, studentId, classId)
- `GET/POST /api/uploads` — List/upload papers (multipart/form-data)
- `POST /api/uploads/:id/ocr` — Trigger OCR processing

## Frontend Pages

- `/` — Landing page (choose Teacher or Student portal)
- `/dashboard` — Teacher overview with CUI score cards per class
- `/classes` — Classes list
- `/classes/:id` — Class detail with students and tests
- `/students` — Students list
- `/tests` — Tests list
- `/tests/create` — Create MCQ test form
- `/tests/:id` — Test detail with results
- `/uploads` — Paper uploads with file upload capability
- `/student` — Student login (enter student code)
- `/student/tests` — Available tests for student
- `/student/tests/:id` — Take an MCQ test

## Sample Data

Pre-seeded with:
- 3 classes: Class 10A (Math), Class 9B (Science), Class 11C (English)
- 6 students: STU001-STU006
- 4 tests with 9 questions total
- 8 test results

## Key Commands

- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API client after spec changes
- `pnpm --filter @workspace/db run push` — Push schema changes to DB
- `pnpm --filter @workspace/api-server run dev` — Run API dev server
- `pnpm --filter @workspace/intelligent-teacher run dev` — Run frontend dev server
