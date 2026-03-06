---
quick_task: 1
name: "Set up GitHub remote repo and deploy to GitHub Pages"
tasks: 3
autonomous: true
---

# Quick Task 1: GitHub Remote + GitHub Pages Deployment

## Objective

Create a private GitHub repo, push all existing commits, and set up automatic deployment to GitHub Pages so the PWA can be installed from a real URL.

## Task 1: Create GitHub repo and push

### Action
1. Create a private repo named `ClinicSoftware` on GitHub using `gh repo create`
2. Add the remote to the local repo
3. Push all existing commits to `main`

### Files
- (no file changes, git operations only)

### Verify
- `gh repo view` shows the repo
- `git remote -v` shows the remote
- `git log origin/main --oneline -3` shows commits pushed

### Done
Remote repo exists and all commits are pushed.

## Task 2: Add GitHub Actions deploy workflow

### Action
Create `.github/workflows/deploy.yml` that:
1. Triggers on push to `main`
2. Installs Node 20, runs `npm ci`, runs `npm run build`
3. Deploys `dist/` to GitHub Pages using `actions/deploy-pages`

### Files
- `.github/workflows/deploy.yml` (create)

### Verify
- File exists with correct workflow syntax
- Uses `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`

### Done
Workflow file committed and pushed.

## Task 3: Enable GitHub Pages in repo settings

### Action
1. Enable GitHub Pages via `gh api` to use GitHub Actions as the source
2. Commit the vite.config.ts devOptions change (already made)
3. Push to trigger the deploy workflow
4. Report the Pages URL to the user

### Files
- `vite.config.ts` (already modified, just needs committing)

### Verify
- `gh api repos/{owner}/{repo}/pages` returns the Pages config
- Deploy workflow is triggered

### Done
GitHub Pages is enabled, first deploy triggered, URL reported.
