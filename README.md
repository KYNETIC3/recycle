# eLoop — AI Hardware Triage & E-Waste Recovery

eLoop is a high-contrast, clean-tech e-waste triage web application built with Next.js, React, and Tailwind CSS. It provides instant component diagnosis, repair pathways, and certified e-waste recycling routing.

---

## 🛠️ Prerequisites

Before you start, make sure you have the following installed on your computer:

1. **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **Git**: Installed and configured ([Download Git](https://git-scm.com/))
3. **Code Editor**: VS Code (recommended)

---

## 🚀 Step-by-Step Local Setup

Follow these exact steps to clone, set up, and run eLoop on your machine:

### Step 1: Open Your Terminal
Open **Terminal** (macOS/Linux) or **Git Bash / Command Prompt** (Windows).

### Step 2: Clone the Repository
Navigate to the directory where you store your projects and clone the repo:
```bash
cd ~/Documents
git clone https://github.com/KYNETIC3/recycle.git
cd recycle
```

### Step 3: Install Dependencies
Install all required package dependencies:
```bash
npm install
```

### Step 4: Configure Environment Variables (If Applicable)
If there is an `.env.example` file in the project, copy it to create your local `.env.local` file:
```bash
cp .env.example .env.local
```
*(If no environment variables are required for basic UI testing, you can skip this step).*

### Step 5: Start the Development Server
Launch the local Next.js development server:
```bash
npm run dev
```

### Step 6: Open the Application in Your Browser
Once the terminal displays `Ready in ...`, open your web browser and navigate to:
```text
http://localhost:3000
```

---

## 🎨 Design System & Accessibility Rules

When contributing to eLoop UI components, adhere to these WCAG-compliant design standards:

* **Background Base:** Industrial Warm Stone (`#EAE6DF`)
* **Card Containers:** Deep Tech-Teal (`#0F2C33`) with subtle border (`#1B434C`)
* **Icon Accents:** High-Contrast Cyan-Teal (`#3A828F`)
* **Typography on Dark Cards:** Pure White (`#FFFFFF`) headings, Soft Bone (`#F4F1EA`) body text
* **Typography on Light Backgrounds:** Dark Charcoal (`#15261F`)

---

## 🌿 Team Git Workflow (Branching Policy)

To avoid breaking the `main` branch, all teammates must work on dedicated feature branches:

### 1. Update your local `main` branch:
```bash
git checkout main
git pull origin main
```

### 2. Create a new feature branch:
```bash
git checkout -b feature/your-feature-name
```

### 3. Save and commit your work:
```bash
git add .
git commit -m "feat: brief description of what you built or fixed"
```

### 4. Push your branch to GitHub:
```bash
git push -u origin feature/your-feature-name
```

### 5. Open a Pull Request:
Go to [https://github.com/KYNETIC3/recycle](https://github.com/KYNETIC3/recycle), click **Compare & pull request**, and assign a teammate for review!