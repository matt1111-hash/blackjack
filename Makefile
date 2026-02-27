# =============================================================================
# MAKEFILE - Code Health Toolkit v3.1 (Merged Edition)
# =============================================================================
# SRC_DIR automatikusan detektálva, vagy felülírható: make lint SRC_DIR=app
# =============================================================================

# Dinamikus forrás detekció (ugyanaz a logika mint quality_gate.sh-ban)
SRC_DIR ?= $(shell for d in src app lib; do \
    [ -d "$$d" ] && find "$$d" -name "*.py" -type f 2>/dev/null | grep -q . && echo "$$d" && break; \
done)

.PHONY: help install check quality test coverage trend health clean

help:
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "  CODE HEALTH TOOLKIT v3.1"
	@echo "═══════════════════════════════════════════════════════════════"
	@echo ""
	@echo "  make install    - Első telepítés"
	@echo "  make check      - Gyors lint+format (munka közben)"
	@echo "  make quality    - Teljes quality gate"
	@echo "  make ci         - CI mód (strict)"
	@echo "  make strict     - Strict mód (minden warning → fail)"
	@echo ""
	@echo "  make test       - Tesztek"
	@echo "  make coverage   - Tesztek + coverage"
	@echo "  make mutation   - Mutation testing"
	@echo ""
	@echo "  make trend      - Wily trendek"
	@echo "  make health     - Teljes health report"
	@echo "  make clean      - Takarítás"
	@echo ""
	@echo "  SRC_DIR=$(SRC_DIR) (felülírható: make lint SRC_DIR=app)"
	@echo ""

# =============================================================================
# SETUP
# =============================================================================

install:
	pip install -e ".[dev]"
	pre-commit install
	@command -v wily >/dev/null && wily build $(SRC_DIR) || true
	@echo "✅ Installed!"

# =============================================================================
# DAILY WORKFLOW
# =============================================================================

check:
	@echo "⚡ Quick check ($(SRC_DIR))..."
	@ruff check $(SRC_DIR) --fix
	@ruff format $(SRC_DIR)
	@echo "✅ Done"

quality:
	@./quality_gate.sh --full

ci:
	@./quality_gate.sh --ci

strict:
	@./quality_gate.sh --strict

# =============================================================================
# TESTING
# =============================================================================

test:
	pytest tests/ -v --tb=short

coverage:
	pytest tests/ --cov=$(SRC_DIR) --cov-branch --cov-report=html --cov-report=term-missing:skip-covered
	@echo "📊 Report: htmlcov/index.html"

mutation:
	@echo "🧬 Mutation testing..."
	mutmut run --paths-to-mutate=$(SRC_DIR) || true
	mutmut results

# =============================================================================
# ANALYSIS
# =============================================================================

trend:
	@./quality_gate.sh --trend

health:
	@./quality_gate.sh --health

complexity:
	@echo "📏 Complexity:"
	@radon cc $(SRC_DIR) -a -s
	@echo ""
	@echo "📊 Maintainability:"
	@radon mi $(SRC_DIR) -s

dead:
	@echo "💀 Dead code:"
	@vulture $(SRC_DIR) --min-confidence=80 || echo "None"

architecture:
	@echo "🏛️  Architecture:"
	@lint-imports || echo "No .importlinter config"

security:
	@echo "🔒 Security:"
	@bandit -r $(SRC_DIR) -ll -q || echo "No issues"

# =============================================================================
# INDIVIDUAL CHECKS
# =============================================================================

lint:
	ruff check $(SRC_DIR)

format:
	ruff format $(SRC_DIR)

type:
	mypy $(SRC_DIR) --ignore-missing-imports

# =============================================================================
# CLEANUP
# =============================================================================

clean:
	rm -rf .pytest_cache .mypy_cache .ruff_cache .coverage htmlcov .mutmut-cache .wily
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@echo "🧹 Clean"
