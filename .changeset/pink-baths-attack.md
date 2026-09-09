---
'@tenpercent/app': patch
---

Release configuration for the app stores: build profiles now pin their own Sentry
environment and pull the rest from EAS environment variables (a gitignored `.env` never
reaches a cloud build), production builds auto-increment their build number from EAS
(`appVersionSource: "remote"`), and the store-facing version is read from
`packages/app/package.json` so Changesets is the only thing that moves it. The Settings
screen reports the version of the installed binary instead of a hardcoded string.
