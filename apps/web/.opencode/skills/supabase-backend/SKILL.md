---
name: Supabase Enterprise Backend
description: Use this skill when writing database migrations, Supabase client configurations, and Row-Level Security (RLS) policies for eLoop.
---

## Enterprise Architecture Rules
1. **Database Stack:** Always use Supabase PostgreSQL. Never use local file-based databases or SQLite.
2. **Type Safety:** Write explicit TypeScript types for all database tables, schemas, and Next.js Server Actions.
3. **Security:** Ensure strict Row-Level Security (RLS) policies are drafted alongside every new database table for data privacy.