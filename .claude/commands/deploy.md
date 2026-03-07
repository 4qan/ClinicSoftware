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
7. After push, poll the GitHub Actions workflow to verify deployment:
   - Run `gh run list --workflow=deploy.yml --limit=1` to get the latest run
   - Poll with `gh run watch <run-id> --exit-status` (timeout 5 minutes)
   - If the run succeeds, confirm deployment is live
   - If the run fails, show the failure logs with `gh run view <run-id> --log-failed` and report the error
8. Report the result: how many commits pushed and whether deployment succeeded or failed
9. If nothing to push, say so
