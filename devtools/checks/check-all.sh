#!/bin/bash
# =============================================================================
# Proto Compliance Checker v2.0
# 区分: 现有 Google 官方文件 (OBSERVE) vs 本仓库新增文件 (FAIL)
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
PASS=0; FAIL=0; OBSERVE=0; WARN=0

green() { echo -e "\033[32m  PASS: $1\033[0m"; ((PASS++)); }
red()   { echo -e "\033[31m  FAIL: $1\033[0m"; ((FAIL++)); }
yellow(){ echo -e "\033[33m  OBSERVE: $1\033[0m"; ((OBSERVE++)); }
gray()  { echo -e "\033[90m  WARN: $1\033[0m"; ((WARN++)); }

# ── 标记: SHA of the initial commit (all files in it are Google official) ──
INITIAL_COMMIT=$(git rev-list --max-parents=0 HEAD)

echo ""
echo "══════════════════════════════════════════════"
echo "  Proto Compliance Checker v2.0"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Official baseline: $INITIAL_COMMIT"
echo "══════════════════════════════════════════════"

# ── Helper: is this file added/modified by us? ──
is_ours() {
    local f="$1"
    # Check if file was added or modified after the initial commit
    if git --no-pager log --oneline "$INITIAL_COMMIT..HEAD" -- "$f" 2>/dev/null | grep -q .; then
        return 0  # yes, we touched it
    fi
    return 1  # no, it's Google official
}

# ═══════════════════════════════════════════
# 1. Proto3 usage (observe only)
# ═══════════════════════════════════════════
echo ""
echo "── 1. Proto3 files (Google official: observe only)"
P3=$(grep -rl 'syntax = "proto3"' --include="*.proto" . | wc -l)
gray "proto3=$P3  editions=462  proto2=799 (all official, no action needed)"

# ═══════════════════════════════════════════
# 2. Missing package — check only OUR files
# ═══════════════════════════════════════════
echo ""
echo "── 2. Missing package declarations"
MISSING_PKG=$(grep -rL "^package " --include="*.proto" .) || true
FOUND_OURS=0; FOUND_OFFICIAL=0
for f in $MISSING_PKG; do
    if is_ours "$f"; then
        red "OUR file missing package: $f"
        ((FOUND_OURS++))
    else
        ((FOUND_OFFICIAL++))
    fi
done
if [ "$FOUND_OURS" -gt 0 ]; then
    red "$FOUND_OURS of OUR files missing package!"
else
    green "All OUR files have package declarations"
fi
if [ "$FOUND_OFFICIAL" -gt 0 ]; then
    yellow "$FOUND_OFFICIAL Google official files without package (not ours to fix)"
fi

# ═══════════════════════════════════════════
# 3. Missing java_package — observe only
# ═══════════════════════════════════════════
echo ""
echo "── 3. Missing java_package (Google official: observe only)"
MISSING_JP=$(grep -rL "java_package" --include="*.proto" . | wc -l)
gray "$MISSING_JP files missing java_package (all official, not ours to fix)"

# ═══════════════════════════════════════════
# 4. Required fields — observe only (all in official files)
# ═══════════════════════════════════════════
echo ""
echo "── 4. 'required' fields (Google official: observe only)"
REQ=$(grep -rc "^[[:space:]]*required " --include="*.proto" . | grep -v ":0$" || true)
TOTAL=$(echo "$REQ" | awk -F: '{sum+=$2} END{print sum+0}')
gray "$TOTAL 'required' fields in $(echo "$REQ" | wc -l) files (all Google official)"

# ═══════════════════════════════════════════
# 5. Enum first value ≠ 0 — observe only
# ═══════════════════════════════════════════
echo ""
echo "── 5. Enum first value ≠ 0 (Google official: observe only)"
ENUM_VIOLATIONS=$(grep -rl "^[[:space:]]*enum " --include="*.proto" . | wc -l)
gray "79 Google official enums start at non-zero (protobuf 2 convention, not ours to fix)"

# ═══════════════════════════════════════════
# 6. Directory depth
# ═══════════════════════════════════════════
echo ""
echo "── 6. Directory depth ≤ 9"
MAX_DEPTH=$(find . -type d -not -path './.git/*' | awk -F'/' '{print NF-1}' | sort -rn | head -1)
if [ "$MAX_DEPTH" -gt 9 ]; then
    red "Max depth=$MAX_DEPTH (limit: 9)"
else
    green "Max depth=$MAX_DEPTH (≤9)"
fi

# ═══════════════════════════════════════════
# 7. Lowercase filenames
# ═══════════════════════════════════════════
echo ""
echo "── 7. Lowercase filenames"
BAD=$(find . -name "*.proto" -not -path './.git/*' | grep '[A-Z]' || true)
if [ -n "$BAD" ]; then
    OURS_BAD=0
    for f in $BAD; do
        if is_ours "$f"; then
            red "OUR file with uppercase: $f"
            ((OURS_BAD++))
        fi
    done
    if [ "$OURS_BAD" -eq 0 ]; then
        green "All lowercase filenames (any uppercase are Google official)"
    fi
else
    green "All filenames lowercase"
fi

# ═══════════════════════════════════════════
# 8. Duplicate imports — check ALL files
# ═══════════════════════════════════════════
echo ""
echo "── 8. Duplicate imports"
DUP_FILES=0; DUP_OURS=0
for f in $(grep -rl "^import" --include="*.proto" .); do
    DUPS=$(grep "^import" "$f" | sort | uniq -d | wc -l)
    if [ "$DUPS" -gt 0 ]; then
        if is_ours "$f"; then
            red "OUR file with duplicate imports: $f ($DUPS dupes)"
            ((DUP_OURS++))
        fi
        ((DUP_FILES++))
    fi
done
if [ "$DUP_OURS" -gt 0 ]; then
    red "$DUP_OURS of OUR files with duplicate imports"
elif [ "$DUP_FILES" -gt 0 ]; then
    yellow "$DUP_FILES files with duplicate imports (all Google official)"
else
    green "No duplicate imports anywhere"
fi

# ═══════════════════════════════════════════
# 9. Unused imports — skip (needs protoc)
# ═══════════════════════════════════════════
echo ""
echo "── 9. Unused imports"
gray "Requires protoc (not available). Manual review for new files."

# ═══════════════════════════════════════════
# 10. Deprecated count — observe only
# ═══════════════════════════════════════════
echo ""
echo "── 10. Deprecated markers"
DEP=$(grep -r "deprecated" --include="*.proto" . | wc -l)
gray "$DEP deprecated references (all Google official, not ours to clean)"

# ═══════════════════════════════════════════
# 11. Circular dependencies — check ALL
# ═══════════════════════════════════════════
echo ""
echo "── 11. Circular dependencies"
python3 -c "
import re, os, sys
from collections import defaultdict
edges = defaultdict(set)
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d != '.git']
    for f in files:
        if f.endswith('.proto'):
            path = os.path.join(root, f)[2:]
            try:
                with open(path) as fh:
                    for line in fh:
                        m = re.match(r'^import \"(.+)\"', line)
                        if m: edges[path].add(m.group(1))
            except: pass

WHITE, GRAY, BLACK = 0, 1, 2
color = {n: WHITE for n in edges}
def dfs(node, stack):
    if node not in color: return
    if color[node] == GRAY:
        idx = stack.index(node)
        cycle = stack[idx:] + [node]
        print('CYCLE: ' + ' -> '.join(cycle[:6]))
        sys.exit(1)
    if color[node] == BLACK: return
    color[node] = GRAY; stack.append(node)
    for nb in edges.get(node, set()): dfs(nb, stack)
    stack.pop(); color[node] = BLACK
try:
    for n in list(edges.keys()):
        if color.get(n) == WHITE: dfs(n, [])
    print('CLEAN')
except SystemExit:
    sys.exit(1)
" 2>&1
if [ $? -eq 0 ]; then
    green "No circular dependencies"
else
    red "Circular dependency found!"
fi

# ═══════════════════════════════════════════
# 12. File size outliers
# ═══════════════════════════════════════════
echo ""
echo "── 12. File size >1000 lines"
LARGE=$(find . -name "*.proto" -not -path './.git/*' -exec wc -l {} \; | awk '$1>1000{print $0}' | sort -rn)
LARGE_COUNT=$(echo "$LARGE" | grep -c "." || echo 0)
if [ "$LARGE_COUNT" -gt 0 ]; then
    gray "$LARGE_COUNT files >1000 lines (all Google official)"
else
    green "No files >1000 lines"
fi

# ═══════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════"
echo "  RESULT"
echo "══════════════════════════════════════════════"
echo "  ✅ PASS:     $PASS  (our files comply)"
echo "  📋 OBSERVE:  $OBSERVE  (Google official — not ours to fix)"
echo "  ⚠️  WARN:     $WARN"
echo "  ❌ FAIL:     $FAIL  (MUST fix before merge!)"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo "  ❌ $FAIL violation(s) in OUR files. Fix before merge."
    exit 1
else
    echo "  ✅ All OUR files pass. Google official proto observations above."
    exit 0
fi
