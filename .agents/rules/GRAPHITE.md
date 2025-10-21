# Graphite Usage

- Inspect current stack with `gt log` before coding.
- Create branches with `gt create --message "<scope>: <summary>"`. The first line becomes the PR title.
- Once changes pass local checks, run `gt submit --no-interactive` to open the stack (draft by default).
- Rebase stacks with `gt sync` when `main` advances; resolve conflicts locally.
- After feedback, use `gt amend` / `gt restack` to update commits—avoid force-pushing through git directly.
