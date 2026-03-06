Push all local commits to GitHub and trigger a GitHub Pages deploy.

Steps:
1. Run `git status` to show what's committed and pending
2. Run `git log origin/main..HEAD --oneline` to show commits that will be pushed
3. If there are commits to push, run `git push origin main`
4. Report the result: how many commits pushed, and remind that GitHub Pages will auto-deploy in ~1-2 minutes
5. If nothing to push, say so
