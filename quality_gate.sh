#!/bin/bash
# =============================================================================
# Quality Gate v3.1 - Merged Edition (Fixed)
# =============================================================================
# v2.2 Ruff-alapok + Solo kiegészítések (architecture, complexity, dead code)
# Fixes: src_dir guard, glob bug, CI strictness, dependency checks, set -u
# =============================================================================
# Használat: ./quality_gate.sh [--quick|--full|--ci|--strict|--trend|--health]
# =============================================================================

set -uo pipefail

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
STRICT_MODE=false
SKIP_COVERAGE=false

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
        --strict|-s) MODE="strict"; CI_MODE=true; STRICT_MODE=true; COVERAGE_THRESHOLD=90; MAX_FILE_LINES=250; shift ;;
        --no-coverage) SKIP_COVERAGE=true; shift ;;
        --trend|-t) MODE="trend"; shift ;;
        --health|-h) MODE="health"; shift ;;
        --help)
            echo "Usage: ./quality_gate.sh [MODE] [OPTIONS]"
            echo "Modes:"
            echo "  --quick, -q    Quick lint + format check"
            echo "  --full, -f     Full quality gate (default)"
            echo "  --ci           CI mode (strict thresholds)"
            echo "  --strict, -s   Strict: EVERY warning → fail"
            echo "  --trend, -t    Wily trend analysis"
            echo "  --health       Full health report"
            echo "Options:"
            echo "  --no-coverage  Skip coverage check (pl. TF/GPU hiánya esetén)"
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
SKIPPED=0
declare -a FAILED_CHECKS=()

fail_check() {
    print_fail "$1"
    FAILED_CHECKS+=("$1")
    ((FAILED++))
}

warn_or_fail() {
    # CI/strict módban fail, különben warning
    if $CI_MODE; then
        fail_check "$1"
    else
        print_warn "$1 (local: nem blokkoló)"
        ((WARNINGS++))
    fi
}

require_tool() {
    local tool="$1"
    local package="${2:-$1}"
    if ! command -v "$tool" &> /dev/null && ! python -m "$tool" --version &> /dev/null 2>&1; then
        print_warn "$tool not installed (pip install $package)"
        ((SKIPPED++))
        return 1
    fi
    return 0
}

# === DETECT PROJECT ===
detect_src_dir() {
    for dir in "src" "app" "lib"; do
        if [ -d "$dir" ] && find "$dir" -name "*.py" -type f 2>/dev/null | grep -q .; then
            echo "$dir"; return
        fi
    done
    # FIXED: glob nem működik [ -f ] -ben
    if compgen -G "*.py" > /dev/null 2>&1; then
        echo "."; return
    fi
    echo ""
}

detect_test_dir() {
    for dir in "tests" "test"; do
        [ -d "$dir" ] && echo "$dir" && return
    done
    echo ""
}

# === VENV ===
activate_venv() {
    for venv in ".venv" "venv"; do
        if [ -f "$venv/bin/activate" ]; then
            # shellcheck disable=SC1091
            source "$venv/bin/activate"
            print_info "Venv: $venv"
            return
        fi
    done
}

# === GUARD ===
guard_src_dir() {
    local src_dir="$1"
    if [ -z "$src_dir" ]; then
        echo -e "${RED}FATAL: Nem találok Python forrást (src/, app/, lib/, *.py)${NC}"
        echo "Futtasd a projekt gyökérkönyvtárából!"
        exit 1
    fi
}

# === CHECKS ===

check_ruff() {
    local src_dir="$1"

    require_tool "ruff" "ruff" || return

    print_step "Ruff lint..."
    local lint_output
    lint_output=$(python -m ruff check "$src_dir" 2>&1)
    local lint_rc=$?
    if [ $lint_rc -eq 0 ]; then
        print_pass "Ruff lint OK"
    else
        echo "$lint_output"
        fail_check "Ruff lint hibák"
        print_info "Fix: ruff check --fix $src_dir"
    fi

    print_step "Ruff format..."
    local fmt_output
    fmt_output=$(python -m ruff format --check "$src_dir" 2>&1)
    local fmt_rc=$?
    if [ $fmt_rc -eq 0 ]; then
        print_pass "Format OK"
    else
        echo "$fmt_output"
        # FIXED: CI/strict módban fail
        warn_or_fail "Format eltérések"
        print_info "Fix: ruff format $src_dir"
    fi
}

check_mypy() {
    local src_dir="$1"

    require_tool "mypy" "mypy" || return

    print_step "Mypy type checking..."
    local mypy_output
    mypy_output=$(python -m mypy "$src_dir" --ignore-missing-imports 2>&1)
    local mypy_rc=$?
    if [ $mypy_rc -eq 0 ]; then
        print_pass "Type check OK"
    else
        echo "$mypy_output"
        warn_or_fail "Type errors"
    fi
}

check_tests() {
    local src_dir="$1"
    local test_dir="$2"

    # Skip coverage check if requested
    if $SKIP_COVERAGE; then
        print_step "Tests (coverage skipped)..."

        if [ -z "$test_dir" ] || [ ! -d "$test_dir" ]; then
            print_info "Nincs tests/ könyvtár - tests SKIPPED"
            return
        fi

        require_tool "pytest" "pytest" || return

        export PYTHONPATH="${src_dir}:${PYTHONPATH:-}"

        local test_output
        test_output=$(python -m pytest "$test_dir" -v --tb=short 2>&1)
        local test_rc=$?
        echo "$test_output"
        if [ $test_rc -eq 0 ]; then
            print_pass "Tests PASS (coverage skipped)"
        else
            fail_check "Tests failed"
        fi
        return
    fi

    print_step "Tests + coverage (min: ${COVERAGE_THRESHOLD}%)..."

    if [ -z "$test_dir" ] || [ ! -d "$test_dir" ]; then
        fail_check "Nincs tests/ könyvtár!"
        return
    fi

    require_tool "pytest" "pytest" || return

    export PYTHONPATH="${src_dir}:${PYTHONPATH:-}"

    local test_output
    test_output=$(python -m pytest "$test_dir" -v --tb=short \
        --cov="$src_dir" --cov-branch \
        --cov-report=term-missing:skip-covered \
        --cov-fail-under="$COVERAGE_THRESHOLD" 2>&1)
    local test_rc=$?
    echo "$test_output"
    if [ $test_rc -eq 0 ]; then
        print_pass "Tests PASS, coverage >= ${COVERAGE_THRESHOLD}%"
    else
        fail_check "Tests or coverage failed"
    fi
}

check_file_sizes() {
    local src_dir="$1"
    print_step "File sizes (max: $MAX_FILE_LINES)..."

    local oversized=()
    while IFS= read -r file; do
        local lines
        lines=$(wc -l < "$file")
        [ "$lines" -gt "$MAX_FILE_LINES" ] && oversized+=("$file ($lines)")
    done < <(find "$src_dir" -name "*.py" -type f \
        -not -path "*/__pycache__/*" \
        -not -path "*/.venv/*" \
        -not -path "*/venv/*" 2>/dev/null)

    if [ ${#oversized[@]} -eq 0 ]; then
        print_pass "All files <= $MAX_FILE_LINES lines"
    else
        for f in "${oversized[@]}"; do
            fail_check "Too large: $f"
        done
    fi
}

check_complexity() {
    local src_dir="$1"
    print_step "Complexity gate (xenon)..."

    require_tool "xenon" "xenon" || return

    local xenon_output
    xenon_output=$(xenon "$src_dir" --max-absolute=B --max-modules=A --max-average=A 2>&1)
    local xenon_rc=$?
    if [ $xenon_rc -eq 0 ]; then
        print_pass "Complexity OK (max B)"
    else
        echo "$xenon_output"
        fail_check "Complexity too high!"
    fi
}

check_dead_code() {
    local src_dir="$1"
    print_step "Dead code (vulture)..."

    require_tool "vulture" "vulture" || return

    local result
    result=$(vulture "$src_dir" --min-confidence=80 2>&1)
    if [ -z "$result" ]; then
        print_pass "No dead code"
    else
        echo "$result" | head -10
        # FIXED: strict módban fail
        if $STRICT_MODE; then
            fail_check "Dead code found"
        else
            print_warn "Dead code found (nem blokkoló)"
            ((WARNINGS++))
        fi
    fi
}

check_architecture() {
    local src_dir="$1"
    print_step "Clean Architecture (import-linter)..."

    if [ ! -f ".importlinter" ]; then
        # Fallback: grep-based check
        if [ -d "$src_dir/domain" ]; then
            if grep -rq "from infrastructure\|from src\.infrastructure" "$src_dir/domain/" 2>/dev/null; then
                fail_check "Domain imports infrastructure! (TILOS)"
            else
                print_pass "Architecture OK (basic check)"
            fi
        else
            print_info "No domain/ - architecture check skipped"
            ((SKIPPED++))
        fi
        return
    fi

    require_tool "lint-imports" "import-linter" || return

    local lint_output
    lint_output=$(lint-imports 2>&1)
    local lint_rc=$?
    if [ $lint_rc -eq 0 ]; then
        print_pass "Architecture OK"
    else
        echo "$lint_output"
        fail_check "Architecture violation!"
    fi
}

check_security() {
    local src_dir="$1"
    print_step "Security (bandit)..."

    require_tool "bandit" "bandit" || return

    local bandit_output
    bandit_output=$(python -m bandit -r "$src_dir" -ll -q 2>&1)
    local bandit_rc=$?
    if [ $bandit_rc -eq 0 ]; then
        print_pass "No high-risk issues"
    else
        echo "$bandit_output"
        # FIXED: CI módban fail
        warn_or_fail "Security warnings"
    fi
}

# === TREND MODE ===
run_trend() {
    print_header "📈 Code Health Trends"

    if ! command -v wily &> /dev/null; then
        echo "Wily not installed. Run: pip install wily"
        exit 1
    fi

    local src_dir
    src_dir=$(detect_src_dir)
    guard_src_dir "$src_dir"

    echo "Building metrics..."
    wily build "$src_dir" 2>/dev/null || true

    echo ""
    echo "Current state:"
    wily report "$src_dir"

    echo ""
    echo "Recent changes:"
    wily diff "$src_dir" 2>/dev/null || echo "No previous data"
}

# === HEALTH MODE ===
run_health() {
    print_header "🏥 Full Health Report"

    local src_dir
    src_dir=$(detect_src_dir)
    guard_src_dir "$src_dir"

    echo -e "${BOLD}📏 COMPLEXITY${NC}"
    echo "────────────────────────────────────────"
    radon cc "$src_dir" -a -s 2>/dev/null || echo "radon not installed"

    echo ""
    echo -e "${BOLD}📊 MAINTAINABILITY${NC}"
    echo "────────────────────────────────────────"
    radon mi "$src_dir" -s 2>/dev/null || echo "radon not installed"

    echo ""
    echo -e "${BOLD}💀 DEAD CODE${NC}"
    echo "────────────────────────────────────────"
    vulture "$src_dir" --min-confidence=80 2>/dev/null || echo "None found"

    echo ""
    echo -e "${BOLD}🔍 RUFF SUMMARY${NC}"
    echo "────────────────────────────────────────"
    ruff check "$src_dir" --statistics 2>/dev/null | tail -20 || echo "No issues"

    echo ""
    echo -e "${BOLD}🏛️  ARCHITECTURE${NC}"
    echo "────────────────────────────────────────"
    if [ -f ".importlinter" ]; then
        lint-imports 2>&1 | head -10
    else
        echo "No .importlinter config"
    fi
}

# === QUICK MODE ===
run_quick() {
    print_header "⚡ Quick Check"

    local src_dir
    src_dir=$(detect_src_dir)
    guard_src_dir "$src_dir"

    echo "Ruff fix + format..."
    ruff check "$src_dir" --fix 2>/dev/null || true
    ruff format "$src_dir" 2>/dev/null || true

    echo -e "${GREEN}✅ Done${NC}"
}

# === FULL MODE ===
run_full() {
    print_header "🚀 Quality Gate v3.1"

    if $STRICT_MODE; then
        print_info "MODE: STRICT (minden warning → fail)"
    elif $CI_MODE; then
        print_info "MODE: CI (strict: ${COVERAGE_THRESHOLD}% cov, ${MAX_FILE_LINES} LOC)"
    elif $SKIP_COVERAGE; then
        print_info "MODE: Local (${MAX_FILE_LINES} LOC, coverage SKIPPED)"
    else
        print_info "MODE: Local (${COVERAGE_THRESHOLD}% cov, ${MAX_FILE_LINES} LOC)"
    fi

    activate_venv

    local src_dir
    src_dir=$(detect_src_dir)
    guard_src_dir "$src_dir"

    local test_dir
    test_dir=$(detect_test_dir)

    print_info "Source: ${src_dir}"
    print_info "Tests: ${test_dir:-'(none)'}"

    echo ""
    check_ruff "$src_dir"

    echo ""
    check_mypy "$src_dir"

    echo ""
    check_complexity "$src_dir"

    echo ""
    check_dead_code "$src_dir"

    echo ""
    check_architecture "$src_dir"

    echo ""
    check_file_sizes "$src_dir"

    echo ""
    check_security "$src_dir"

    echo ""
    check_tests "$src_dir" "$test_dir"

    # === SUMMARY ===
    print_header "📊 Summary"

    [ $SKIPPED -gt 0 ] && print_info "$SKIPPED check(s) skipped (missing tools)"

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
        echo "  ruff check --fix $src_dir"
        echo "  ruff format $src_dir"
        exit 1
    fi
}

# === MAIN ===
case $MODE in
    quick) run_quick ;;
    full|ci|strict) run_full ;;
    trend) run_trend ;;
    health) run_health ;;
esac
