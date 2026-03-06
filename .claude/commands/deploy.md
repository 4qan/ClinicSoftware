Push all local commits to GitHub and trigger a GitHub Pages deploy.

Steps:
1. Read `.planning/PROJECT.md` and `.planning/ROADMAP.md` for current project state
2. Read the existing `README.md` and update it to reflect:
   - Current feature set (what's shipped)
   - Current roadmap progress (check/uncheck items based on ROADMAP.md phase completion)
   - Any new sections or changes warranted by project evolution
   - Do NOT change the overall structure or tone, just keep content current
3. If README.md changed, stage and commit it with message: `docs: update README`
4. Run `git status` to show what's committed and pending
5. Run `git log origin/main..HEAD --oneline` to show commits that will be pushed
6. If there are commits to push, run `git push origin main`
7. Report the result: how many commits pushed, and remind that GitHub Pages will auto-deploy in ~1-2 minutes
8. If nothing to push, say so
