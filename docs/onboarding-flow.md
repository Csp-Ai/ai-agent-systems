# Onboarding Flow

The onboarding experience introduces new users to the platform in a controlled sequence.

1. **OnboardingOverlay** – shown on first visit until the user clicks *Start*. Completion sets `localStorage.onboarded`.
2. **WelcomeExperience** – displayed after onboarding to provide a brief tour. Dismissal sets `welcomeExperienceSeen`.
3. **WelcomeOverlay** – a quick welcome message that appears only after the experience is finished. Dismissal stores `welcomeOverlayDismissed`.

The overlays appear in this order for the first run. Retry tokens may be issued via `/welcome-log` to analyse drop-off. Setting any of the localStorage flags back to `false` will replay the flow for testing.
