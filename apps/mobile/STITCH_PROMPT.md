# MemoHack — Google Stitch UI Prompt

**App:** MemoHack — a CBSE learning app for students (Classes 9–12), covering Physics & Biology.  
**Style:** Modern, premium, indigo/violet primary (`#6366F1`), white cards, soft slate backgrounds, rounded corners, subtle shadows, smooth animations. Mobile-first (iOS + Android).

---

## Screens to Design

### 1. Splash / Onboarding

Brief welcome screen with app logo, tagline _"Master CBSE, the smart way"_, and a CTA to sign in or sign up.

### 2. Sign In

Email + password form. App logo/icon at top. "Sign In" primary button. Link to Sign Up. Clean minimal card layout.

### 3. Sign Up

Multi-field form: name, email, phone, password, class selector (9/10/11/12), MemoHack Student toggle. Profile photo upload optional.

### 4. Home

- Indigo gradient header: greeting, search icon button
- 3 stat chips: Total Chapters, Active Learners, Success Rate
- Hero banner: _"Master CBSE Curriculum"_ with illustration
- White rounded card section below: subject cards for **Physics** (⚡) and **Biology** (🧬) showing chapter count
- Quick action buttons: Browse All, Search

### 5. Subject Screen (e.g. Physics)

- Indigo gradient header with subject emoji icon, total chapters & classes count
- White rounded bottom sheet with accordion list of classes (9, 10, 11, 12)
- Each class expands to show a numbered list of chapter titles with chevron

### 6. Chapter Screen

- Indigo gradient header: subject · class breadcrumb, chapter title, description, difficulty badge (Beginner/Intermediate/Advanced), video count
- Tab bar: **Video** | **Notes**
- Video tab: YouTube embedded player + scrollable video playlist below
- Notes tab: PDF document cards (amber accent) — tap to open

### 7. Search

- Indigo gradient header with full-width search input (autofocused)
- Results list: chapter cards showing title, description, subject tag, class badge, difficulty pill
- Empty state with search icon illustration

### 8. AI Tutor _(Coming Soon)_

- Indigo header with robot/bot icon
- _"Coming Soon"_ badge
- Feature preview cards: Instant Doubt Solving, Personalized Learning, Smart Practice

### 9. Profile

- Indigo gradient header: profile photo, name, class badge, email, join date
- White card: Personal Information (email, phone, class, joined date, MemoHack Student status)
- Account settings list: Edit Profile, Account Settings, Sign Out (red)

### 10. Auth Gate (Not Signed In — Profile)

Shown when user is not logged in inside the Profile tab. Indigo gradient background, illustration image, _"Sign In Required"_ message, Sign In button, Sign Up link, and _"Continue as Guest"_ ghost button.

---

**Design tokens:** Indigo `#6366F1` primary · Slate `#F8FAFC` background · White cards · `rounded-3xl` corners · Smooth fade/slide entrance animations · Bottom tab bar with 4 tabs: Home, Search, AI, Profile.
