# Branching Workflow

This repository uses a strict branch model to avoid accidental production changes.

## Branch Roles

- `main`: production
- `dev`: integration/testing
- `feature/*`: experiments

## Merge Flow

`feature -> dev -> main`

## Example Branches

- `main`
- `dev`
- `feature/navbar`
- `feature/cart`
- `feature-checkout`

## Vercel Behavior

With Vercel connected to GitHub:

- `main` -> production deployment
- `dev` -> preview deployment
- `feature/*` -> preview deployment

## Daily Commands

```bash
# Start new work
git checkout dev
git pull
git checkout -b feature/my-change

# Push branch
git push -u origin feature/my-change
```

## Pull Request Policy

- Do not push directly to `main`
- Use PRs for `dev` and `main`
- Require passing CI checks before merging

## Rollback

- Preferred: Vercel -> Deployments -> promote previous stable deployment
- Alternative: revert the merge commit on `main` and redeploy
