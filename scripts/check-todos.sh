BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
SPECIFIC_BRANCH="release"

if [ "$BRANCH_NAME" = "$SPECIFIC_BRANCH" ]; then
  # Search for TODOs in the code
  if grep -r "TODO" .; then
    echo "Warning: There are TODOs in the code. Please check them before pushing."
    exit 1
  fi
fi

exit 0