#!/bin/bash
# bump-version.sh — bump version + update CHANGELOG + tag + push
# Usage: ./devtools/bump-version.sh <major|minor|patch> "<changelog message>"

set -euo pipefail

BUMP_TYPE="${1:-}"
CHANGELOG_MSG="${2:-}"

if [ -z "$BUMP_TYPE" ] || [ -z "$CHANGELOG_MSG" ]; then
    echo "Usage: ./devtools/bump-version.sh <major|minor|patch> \"<changelog message>\""
    exit 1
fi

if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "Error: BUMP_TYPE must be major, minor, or patch"
    exit 1
fi

CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
CURRENT_VERSION=${CURRENT_VERSION#v}

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

case "$BUMP_TYPE" in
    major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
    minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
    patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="v${MAJOR}.${MINOR}.${PATCH}"
TODAY=$(date +%Y-%m-%d)

# Check if CHANGELOG.md exists
CHANGELOG_FILE="CHANGELOG.md"
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo "Error: CHANGELOG.md not found. Create it first."
    exit 1
fi

# Insert new entry after the header line
HEADER_LINE=$(grep -n "^## " "$CHANGELOG_FILE" | head -1 | cut -d: -f1)
if [ -z "$HEADER_LINE" ]; then
    HEADER_LINE=7
fi

INSERT_AFTER=$((HEADER_LINE))
sed -i "${INSERT_AFTER}a\\\n## [${NEW_VERSION}] - ${TODAY}\n\n${CHANGELOG_MSG}\n" "$CHANGELOG_FILE"

echo "Bumping version: $CURRENT_VERSION → $NEW_VERSION"
echo "Changelog entry added."
echo ""
echo "Next steps:"
echo "  1. Review CHANGELOG.md"
echo "  2. git add -A"
echo "  3. git commit -m \"chore: bump version to $NEW_VERSION\""
echo "  4. git tag -a $NEW_VERSION -m \"$NEW_VERSION\""
echo "  5. git push origin main --tags"
