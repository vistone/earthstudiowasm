#!/bin/bash
# =============================================================================
# Proto Compliance Checker — 12 项快速检查
# 用法: ./devtools/checks/check-all.sh
# =============================================================================
# set -euo pipefail  # disabled: grep -L returns 1 when matches found

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
PASS=0; FAIL=0; WARN=0

red()   { echo -e "\033[31m  FAIL: $1\033[0m"; }
green() { echo -e "\033[32m  PASS: $1\033[0m"; }
yellow(){ echo -e "\033[33m  WARN: $1\033[0m"; }

echo ""
echo "══════════════════════════════════════"
echo "  Proto Compliance Checker v1.0"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════"

# ── Check 1: 语法版本 ──
echo ""
echo "── 1. Syntax version"
PROTO3_COUNT=$(grep -rl 'syntax = "proto3"' --include="*.proto" . | wc -l)
ED_COUNT=$(grep -rl 'syntax = "editions"' --include="*.proto" . | wc -l)
P2_COUNT=$(grep -rl 'syntax = "proto2"' --include="*.proto" . | wc -l)
echo "    proto2=$P2_COUNT  editions=$ED_COUNT  proto3=$PROTO3_COUNT"
yellow "New files should use editions. proto3=$PROTO3_COUNT remaining."
((WARN++))

# ── Check 2: 缺失 package ──
echo ""
echo "── 2. Missing package declarations"
MISSING_PKG=$(grep -rL "^package " --include="*.proto" .) || true
if [ -n "$MISSING_PKG" ]; then
    COUNT=$(echo "$MISSING_PKG" | wc -l)
    red "$COUNT files missing package:"
    echo "$MISSING_PKG" | while read f; do echo "      $f"; done
    ((FAIL++))
else
    green "All files have package declarations"
    ((PASS++))
fi

# ── Check 3: 缺失 java_package ──
echo ""
echo "── 3. Missing java_package"
MISSING_JP=$(grep -rL "java_package" --include="*.proto" .) || true
JP_COUNT=$(echo "$MISSING_JP" | wc -l)
yellow "$JP_COUNT files missing java_package (target: 0)"
((WARN++))

# ── Check 4: required 字段 ──
echo ""
echo "── 4. 'required' fields"
REQ=$(grep -rc "^[[:space:]]*required " --include="*.proto" . | grep -v ":0$" || true)
REQ_COUNT=$(echo "$REQ" | grep -c "." || echo 0)
if [ "$REQ_COUNT" -gt 0 ]; then
    TOTAL=$(echo "$REQ" | awk -F: '{sum+=$2} END{print sum}')
    red "$REQ_COUNT files with $TOTAL 'required' fields (target: 0)"
    echo "$REQ" | head -5
    ((FAIL++))
else
    green "No required fields"
    ((PASS++))
fi

# ── Check 5: Enum 首值 = 0 ──
echo ""
echo "── 5. Enum first value = 0"
ENUM_ISSUES=0
for f in $(grep -rl "^[[:space:]]*enum " --include="*.proto" .); do
    python3 -c "
import re
with open('$f') as fh:
    content = fh.read()
# Find all enums and check first value
for m in re.finditer(r'enum\s+\w+\s*\{([^}]+)\}', content, re.DOTALL):
    body = m.group(1)
    vals = re.findall(r'(\w+)\s*=\s*(\d+)', body)
    if vals and vals[0][1] != '0':
        print('$f: enum first value = {} (should be 0)'.format(vals[0][1]))
        exit(1)
" 2>/dev/null && true
    if [ $? -eq 1 ]; then ((ENUM_ISSUES++)); fi
done
if [ "$ENUM_ISSUES" -gt 0 ]; then
    red "$ENUM_ISSUES enum(s) with non-zero first value"
    ((FAIL++))
else
    green "All enum first values are 0"
    ((PASS++))
fi

# ── Check 6: 目录深度 ≤ 9 ──
echo ""
echo "── 6. Directory depth"
MAX_DEPTH=$(find . -type d | awk -F'/' '{print NF-1}' | sort -rn | head -1)
if [ "$MAX_DEPTH" -gt 9 ]; then
    red "Max depth=$MAX_DEPTH (limit: 9)"
    ((FAIL++))
else
    green "Max depth=$MAX_DEPTH (≤9)"
    ((PASS++))
fi

# ── Check 7: 文件名小写 ──
echo ""
echo "── 7. Lowercase filenames"
BAD=$(find . -name "*.proto" | grep '[A-Z]' || true)
if [ -n "$BAD" ]; then
    red "$(echo "$BAD" | wc -l) files with uppercase: $(echo "$BAD" | head -3 | tr '\n' ' ')"
    ((FAIL++))
else
    green "All filenames lowercase"
    ((PASS++))
fi

# ── Check 8: 重复 import ──
echo ""
echo "── 8. Duplicate imports"
DUP_FILES=0
for f in $(grep -rl "^import" --include="*.proto" .); do
    DUPS=$(grep "^import" "$f" | sort | uniq -d | wc -l)
    if [ "$DUPS" -gt 0 ]; then ((DUP_FILES++)); fi
done
if [ "$DUP_FILES" -gt 0 ]; then
    red "$DUP_FILES files with duplicate imports"
    ((FAIL++))
else
    green "No duplicate imports"
    ((PASS++))
fi

# ── Check 9: 未使用的 import ──
echo ""
echo "── 9. Potentially unused imports"
yellow "Full unused-import check requires protoc (not available). Manual review needed."
((WARN++))

# ── Check 10: deprecated 统计 ──
echo ""
echo "── 10. Deprecated markers"
DEP_COUNT=$(grep -r "deprecated" --include="*.proto" . | wc -l)
echo "    Total deprecated references: $DEP_COUNT"
yellow "Audit deprecated fields every MINOR release."
((WARN++))

# ── Check 11: 循环依赖 ──
echo ""
echo "── 11. Circular dependency check"
python3 -c "
import re, os, sys
from collections import defaultdict
edges = defaultdict(set)
for root, dirs, files in os.walk('.'):
    # Skip .git
    dirs[:] = [d for d in dirs if d != '.git']
    for f in files:
        if f.endswith('.proto'):
            path = os.path.join(root, f)[2:]
            try:
                with open(path) as fh:
                    for line in fh:
                        m = re.match(r'^import \"(.+)\"', line)
                        if m:
                            edges[path].add(m.group(1))
            except: pass

WHITE, GRAY, BLACK = 0, 1, 2
color = {}
for n in list(edges.keys()):
    color[n] = WHITE

def dfs(node, stack):
    if node not in color:
        return
    if color[node] == GRAY:
        idx = stack.index(node)
        cycle = stack[idx:] + [node]
        print('CYCLE: ' + ' -> '.join(cycle[:6]) + ('...' if len(cycle)>6 else ''))
        sys.exit(1)
    if color[node] == BLACK:
        return
    color[node] = GRAY
    stack.append(node)
    for nb in edges.get(node, set()):
        dfs(nb, stack)
    stack.pop()
    color[node] = BLACK

try:
    for n in list(edges.keys()):
        if color.get(n) == WHITE:
            dfs(n, [])
    print('PASS: No cycles')
except SystemExit:
    print('FAIL: Circular dependency detected')
    sys.exit(1)
" 2>&1
if [ $? -eq 0 ]; then
    green "No circular dependencies"
    ((PASS++))
else
    red "Circular dependency found!"
    ((FAIL++))
fi

# ── Check 12: 文件大小 ──
echo ""
echo "── 12. File size outliers"
LARGEST=$(find . -name "*.proto" -exec wc -l {} \; | sort -rn | head -5)
echo "    Largest files:"
echo "$LARGEST" | while read lines path; do
    printf "      %5d lines  %s\n" "$lines" "$path"
done
yellow "Files >1000 lines should be split. $(echo "$LARGEST" | awk '$1>1000' | wc -l) above threshold."
((WARN++))

# ── Summary ──
echo ""
echo "══════════════════════════════════════"
echo "  RESULT: $PASS passed  $FAIL failed  $WARN warnings"
echo "══════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
    echo "  ❌ $FAIL check(s) FAILED. Fix before merge."
    exit 1
else
    echo "  ✅ All critical checks passed!"
    exit 0
fi
