# Branching Strategy

This project follows a specific branching and mirroring strategy to ensure data autonomy and source integrity.

### Primary Principles

1.  **Main Branch is Sacred**: The `main` branch represents the stable, production-ready state of the project. Direct commits to `main` are prohibited. All changes must arrive via merges from `development`.
2.  **Development is Part-Time Sacred**: The `development` branch is the staging ground for all new features and bug fixes.
    *   **Synchronization**: Whenever any change is merged into `main`, the `development` branch is immediately rebased onto `main`.
    *   **Identical State**: This process ensures that `development` remains identical to `main` at the start of every new work cycle.

### Remote Sources

*   **Codeberg (Source of Truth)**: All primary development and repository management occurs on Codeberg.
*   **GitHub (Mirror)**: The GitHub repository is a secondary mirror.

### Workflow Summary

1.  Feature work starts from a fresh `development` branch (synced with `main`).
2.  Once validated, `development` is merged into `main`.
3.  `development` is then rebased to match `main`.
