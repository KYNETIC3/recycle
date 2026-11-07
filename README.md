# eLoop Command Center

## 🚀 Quick Start & Local Setup

Follow these steps to set up and run the project locally.

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm** (or pnpm)
- **Git**

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KYNETIC3/recycle.git
   cd recycle
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file inside `apps/web/` and add your Supabase keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **View the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Key Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Starts local dev server |
| `npm run build` | Builds application for production |
| `npm run lint` | Runs code quality checks |