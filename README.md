# MemoHack

MemoHack is a mobile learning companion built with Expo for students preparing for CBSE board exams and competitive tests such as JEE and NEET. The app combines curated chapter content, progress insights, and a coming-soon AI tutor to keep learners on track across Physics and Biology modules.

## Features

- Authenticated learning experience with Convex-powered sign up, sign in, and persistent sessions backed by secure JWTs.
- Dynamic home dashboard with subject highlights, study stats, and quick actions for browsing or searching the catalog.
- Chapter catalogue grouped by subject and class levels, including metadata such as difficulty, estimated time, and associated video resources.
- Profile management so learners can update their personal details and class information directly in the app.
- Admin mutations for seeding or updating curriculum content, protected behind token-based access control.
- AI support area showcasing the roadmap for instant doubt-solving and adaptive practice (shipping soon).

## Tech Stack

- [Expo Router](https://expo.dev/router) + React Native 0.79 with TypeScript for the mobile interface.
- [NativeWind](https://www.nativewind.dev/) for Tailwind-compatible styling in React Native.
- [Convex](https://www.convex.dev/) for the serverless backend, data storage, and authentication flows.
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) for local session persistence on device.
- [EAS](https://expo.dev/eas) configuration for building and distributing native bundles.

## Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

2. **Configure environment secrets**
   - Set a JWT secret for Convex so auth tokens can be issued and verified:
     ```bash
     npx convex env set dev JWT_SECRET "super-secret-value"
     # repeat with "prod" when configuring your production deployment
     ```
   - If you prefer local files, create `convex/.env.local` with:
     ```bash
     JWT_SECRET=super-secret-value
     ```

3. **Run the Convex backend**
   ```bash
   npx convex dev
   ```

4. **Start the Expo app** (new terminal)
   ```bash
   pnpm start
   ```
   Use the Expo CLI output to launch iOS, Android, or web targets.

## Project Structure

```
app/                # Expo Router screens (auth, tabs, subject drill-downs)
components/         # Shared UI and context providers
convex/             # Convex schema and serverless functions (auth + chapters)
assets/             # App icons, splash imagery, and illustrations
scripts/            # Project utility scripts (reset-project)
```

## Useful Commands

- `pnpm start` – Launch the Expo bundler (aliases: `pnpm android`, `pnpm ios`, `pnpm web`).
- `npx convex dev` – Run Convex locally with live reload of functions.
- `pnpm lint` – Run Expo's ESLint configuration.
- `eas build --platform android --profile preview` – Sample EAS build command configured in `eas.json`.

## Deployment Notes

- Update app metadata, bundle identifiers, and EAS project IDs via `app.json` and `eas.json` before shipping to stores.
- Provision Convex environment variables (`JWT_SECRET`, plus any future secrets) in each deployment with `npx convex env set`.
- When you are ready for store builds, submit through [EAS Submit](https://expo.dev/eas-submit) using the profiles defined in `eas.json`.

Happy hacking and best of luck with your studies! 📚✨

