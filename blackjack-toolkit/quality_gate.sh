#!/bin/bash
# =============================================================================
# Quality Gate v1.0 - TypeScript/React Edition
# =============================================================================
# Based on Python Code Health Toolkit v3.0
# Adapted for: Vite + React 19 + TypeScript + Vitest
# =============================================================================
# Usage: ./quality_gate.sh [--quick|--full|--ci|--health]
# =============================================================================

set -o pipefail

# === COLORS ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# === DEFAULTS ===
COVERAGE_THRESHOLD=85
MAX_FILE_LINES=300
CI_MODE=false

# === CONFIG ===
CONFIG_FILE=".quality_gate.conf"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

# === CLI ARGS ===
MODE="full"
while [[ $# -gt 0 ]]; do
    case $1 in
        --quick|-q) MODE="quick"; shift ;;
        --full|-f) MODE="full"; shift ;;
        --ci) MODE="ci"; CI_MODE=true; COVERAGE_THRESHOLD=90; MAX_FILE_LINES=250; shift ;;
        --health|-h) MODE="health"; shift ;;
        --help)
            echo "Usage: ./quality_gate.sh [MODE]"
            echo "  --quick, -q   Quick lint + format check"
            echo "  --full, -f    Full quality gate (default)"
            echo "  --ci          CI mode (strict thresholds)"
            echo "  --health      Full health report"
            exit 0 ;;
        *) echo "Unknown: $1"; exit 1 ;;
    esac
done

# === HELPERS ===
print_header() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}$1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
}
print_step() { echo -e "${YELLOW}[CHECK]${NC} $1"; }
print_pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
print_fail() { echo -e "${RED}[FAIL]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_info() { echo -e "${CYAN}[INFO]${NC} $1"; }

FAILED=0
WARNINGS=0
declare -a FAILED_CHECKS=()

fail_check() {
    print_fail "$1"
    FAILED_CHECKS+=("$1")
    ((FAILED++))
}

# === CHECKS ===

check_eslint() {
    print_step "ESLint..."
    if npm run lint 2>&1; then
        print_pass "ESLint OK"
    else
        fail_check "ESLint errors"
        print_info "Fix: npm run lint -- --fix"
    fi
}

check_typescript() {
    print_step "TypeScript type check..."
    if npx tsc --noEmit 2>&1; then
        print_pass "Type check OK"
    else
        fail_check "TypeScript errors"
    fi
}

check_tests() {
    print_step "Tests + coverage (min: ${COVERAGE_THRESHOLD}%)..."
    
    # Check if tests exist
    if ! find src -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | grep -q .; then
        if ! [ -d "tests" ]; then
            fail_check "No test files found!"
            return
        fi
    fi
    
    # Run tests with coverage
    local output
    output=$(npm run test -- --run --coverage 2>&1)
    local exit_code=$?
    
    echo "$output"
    
    if [ $exit_code -ne 0 ]; then
        fail_check "Tests failed"
        return
    fi
    
    # Extract coverage percentage
    local coverage
    coverage=$(echo "$output" | grep -E "All files\s*\|" | awk -F'|' '{print $2}' | tr -d ' ' | cut -d'.' -f1)
    
    if [ -z "$coverage" ]; then
        print_warn "Could not extract coverage percentage"
        ((WARNINGS++))
        return
    fi
    
    if [ "$coverage" -ge "$COVERAGE_THRESHOLD" ]; then
        print_pass "Tests PASS, coverage ${coverage}% >= ${COVERAGE_THRESHOLD}%"
    else
        fail_check "Coverage ${coverage}% < ${COVERAGE_THRESHOLD}%"
    fi
}

check_file_sizes() {
    print_step "File sizes (max: $MAX_FILE_LINES)..."
    
    local oversized=()
    while IFS= read -r file; do
        local lines=$(wc -l < "$file")
        [ "$lines" -gt "$MAX_FILE_LINES" ] && oversized+=("$file ($lines)")
    done < <(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v node_modules)
    
    if [ ${#oversized[@]} -eq 0 ]; then
        print_pass "All files <= $MAX_FILE_LINES lines"
    else
        for f in "${oversized[@]}"; do
            fail_check "Too large: $f"
        done
    fi
}

check_dead_code() {
    print_step "Dead code (knip)..."
    
    if ! command -v npx &> /dev/null; then
        print_info "npx not available - skipped"
        return
    fi
    
    # Check if knip is installed
    if ! npm list knip &>/dev/null; then
        print_info "knip not installed - skipped"
        return
    fi
    
    local result
    result=$(npx knip 2>&1)
    if [ -z "$result" ] || echo "$result" | grep -q "No unused"; then
        print_pass "No dead code"
    else
        print_warn "Dead code found (not blocking)"
        echo "$result" | head -10
        ((WARNINGS++))
    fi
}

check_architecture() {
    print_step "Architecture (logic/ independence)..."
    
    # Check that logic/ doesn't import from store/ or components/
    if [ -d "src/logic" ]; then
        if grep -rq "from ['\"].*store\|from ['\"].*components\|import.*store\|import.*components" src/logic/ 2>/dev/null; then
            fail_check "logic/ imports store/ or components/ (FORBIDDEN)"
        else
            print_pass "Architecture OK - logic/ is pure"
        fi
    else
        print_info "No src/logic/ - architecture check skipped"
    fi
}

check_security() {
    print_step "Security (npm audit)..."
    
    local result
    result=$(npm audit --audit-level=high 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_pass "No high-risk vulnerabilities"
    else
        print_warn "Security warnings (not blocking)"
        echo "$result" | head -10
        ((WARNINGS++))
    fi
}

# === QUICK MODE ===
run_quick() {
    print_header "⚡ Quick Check"
    
    echo "Lint fix + format..."
    npm run lint -- --fix 2>/dev/null || true
    
    echo -e "${GREEN}✅ Done${NC}"
}

# === HEALTH MODE ===
run_health() {
    print_header "🏥 Full Health Report"
    
    echo -e "${BOLD}📏 FILE SIZES${NC}"
    echo "────────────────────────────────────────"
    find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | while read -r f; do
        lines=$(wc -l < "$f")
        printf "%-50s %4d lines\n" "$f" "$lines"
    done | sort -t' ' -k2 -rn | head -10
    
    echo ""
    echo -e "${BOLD}📊 DEPENDENCIES${NC}"
    echo "────────────────────────────────────────"
    npm list --depth=0 2>/dev/null || echo "No deps"
    
    echo ""
    echo -e "${BOLD}🔍 ESLINT SUMMARY${NC}"
    echo "────────────────────────────────────────"
    npm run lint 2>&1 | tail -10 || echo "No issues"
    
    echo ""
    echo -e "${BOLD}🏛️  ARCHITECTURE${NC}"
    echo "────────────────────────────────────────"
    check_architecture
}

# === FULL MODE ===
run_full() {
    print_header "🚀 Quality Gate v1.0 (TypeScript)"
    
    if $CI_MODE; then
        print_info "MODE: CI (strict: ${COVERAGE_THRESHOLD}% cov, ${MAX_FILE_LINES} LOC)"
    else
        print_info "MODE: Local (${COVERAGE_THRESHOLD}% cov, ${MAX_FILE_LINES} LOC)"
    fi
    
    echo ""
    check_eslint
    
    echo ""
    check_typescript
    
    echo ""
    check_file_sizes
    
    echo ""
    check_architecture
    
    echo ""
    check_dead_code
    
    echo ""
    check_security
    
    echo ""
    check_tests
    
    # === SUMMARY ===
    print_header "📊 Summary"
    
    if [ $FAILED -eq 0 ]; then
        if [ $WARNINGS -eq 0 ]; then
            echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
        else
            echo -e "${GREEN}✅ PASSED${NC} ${YELLOW}($WARNINGS warnings)${NC}"
        fi
        exit 0
    else
        echo -e "${RED}❌ FAILED ($FAILED checks):${NC}"
        for check in "${FAILED_CHECKS[@]}"; do
            echo -e "  ${RED}•${NC} $check"
        done
        echo ""
        echo "Quick fixes:"
        echo "  npm run lint -- --fix"
        echo "  npx tsc --noEmit"
        exit 1
    fi
}

# === MAIN ===
case $MODE in
    quick) run_quick ;;
    full) run_full ;;
    ci) run_full ;;
    health) run_health ;;
esac
