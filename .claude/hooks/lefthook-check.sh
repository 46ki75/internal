#!/usr/bin/env bash
# Claude Code Stop hook: run `lint` and `fmt-check` over changed files.
# The aggregate `check` is project-wide. On failure, block the stop so
# Claude fixes the issues. `stop_hook_active` guards against an infinite loop:
# the second time we're invoked (because we blocked once), we just allow stop.
set -uo pipefail

input=$(cat)
active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false')
[ "$active" = "true" ] && exit 0

proj="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$proj" || exit 0

# Changed (added/modified, not deleted) + untracked files vs HEAD.
args=()
while IFS= read -r -d '' file; do
  args+=(--file "$file")
done < <(
  {
    git diff --name-only --diff-filter=d -z HEAD
    git ls-files --others --exclude-standard -z
  } 2>/dev/null
)

[ ${#args[@]} -eq 0 ] && exit 0

# `output: false` in lefthook.yml keeps this quiet on success and limits a
# failure to just the failing command's output (no banner/summary/ANSI).
raw=$(
  exec 2>&1
  status=0
  for hook in lint fmt-check; do
    NO_COLOR=1 mise run --quiet "$hook" "${args[@]}" || status=$?
  done
  exit "$status"
)
status=$?
[ "$status" -eq 0 ] && exit 0

# Strip any ANSI a tool emitted on its own; never block with an empty reason.
raw=$(printf '%s' "$raw" | sed -E 's/\x1b\[[0-9;]*m//g')
[ -n "${raw//[$' \t\n']/}" ] || raw="lefthook lint/fmt-check exited $status"

jq -n --arg r "$raw" \
  '{decision: "block", reason: ("Lefthook lint/fmt-check failed — fix these before stopping:\n\n" + $r)}'
exit 0
