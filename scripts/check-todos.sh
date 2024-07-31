#!/bin/bash

BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
SPECIFIC_BRANCH="feat/enhancements-2"

echo "BRANCH_NAME: $BRANCH_NAME"
echo "SPECIFIC_BRANCH: $SPECIFIC_BRANCH"

if [ "$BRANCH_NAME" != "$SPECIFIC_BRANCH" ]; then
  exit 0
fi

if grep -r "TODO(release-check)" --include=\*.{html,ts,svelte} . --exclude-dir={.git,node_modules}; then
  echo "Warning: There are TODOs in HTML or TypeScript files. Use --no-verify if you still want to proceed."
  exit 1
fi

exit 0