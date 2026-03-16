# AGENTS.md

## Default Branching Rules

Always follow this branch policy for any code changes:

- `main` = production
- `dev` = integration/testing
- `feature/*` = experiments

Never push experimental or unreviewed changes directly to `main`.

## Required Flow

`feature -> dev -> main`

1. Create/update feature branch from `dev`
2. Open PR into `dev`
3. After validation, open PR from `dev` into `main`

## Deployment Safety

With Vercel connected to GitHub:

- `main` -> production deployment
- `dev` -> preview deployment
- `feature/*` -> preview deployment

## Before Any Production Push

Confirm all of the following:

- changes validated in preview/test
- PR merged into `main`
- explicit approval to deploy production

See `BRANCHING.md` for full workflow and commands.
 
