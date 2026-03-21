# =============================================================================
# MAKEFILE - Code Health Toolkit v4.0 (Monorepo Edition)
# =============================================================================
# Struktúra: backend/ (Python) + frontend/ (React/Vite)
# Minden parancsnak van -be és -fe variánsa, az alap mindkettőt futtatja.
# =============================================================================

BE_DIR  ?= backend
FE_DIR  ?= frontend

# Python forrás detekció a backend/ mappán belül
SRC_DIR ?= $(shell for d in $(BE_DIR)/src $(BE_DIR)/app $(BE_DIR)/lib $(BE_DIR); do \
    [ -d "$$d" ] && find "$$d" -name "*.py" -maxdepth 3 -type f 2>/dev/null | grep -q . && echo "$$d" && break; \
done)

# Frontend detektálva?
FE_EXISTS := $(shell [ -f "$(FE_DIR)/package.json" ] && echo "yes" || echo "no")

.PHONY: help install install-be install-fe \
        check check-be check-fe \
        quality quality-be quality-fe \
        ci ci-be ci-fe \
        strict \
        test test-be test-fe \
        coverage coverage-be coverage-fe \
        trend health mutation \
        lint lint-be lint-fe \
        format format-be format-fe \
        typecheck clean

# =============================================================================
# HELP
# =============================================================================

help:
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "  CODE HEALTH TOOLKIT v4.0 (Monorepo)"
	@echo "  backend: $(BE_DIR)  |  frontend: $(FE_DIR)"
	@echo "═══════════════════════════════════════════════════════════════"
	@echo ""
	@echo "  SETUP"
	@echo "  make install       - Mindkét oldal telepítése"
	@echo "  make install-be    - Csak Python backend"
	@echo "  make install-fe    - Csak React frontend"
	@echo ""
	@echo "  NAPI MUNKA"
	@echo "  make check         - Gyors lint+format (mindkét oldal)"
	@echo "  make check-be      - Csak backend"
	@echo "  make check-fe      - Csak frontend"
	@echo ""
	@echo "  QUALITY GATE"
	@echo "  make quality       - Teljes gate (mindkét oldal)"
	@echo "  make quality-be    - Csak backend"
	@echo "  make quality-fe    - Csak frontend"
	@echo "  make ci            - CI mód (strict, mindkét oldal)"
	@echo "  make strict        - Strict mód (minden warning → fail)"
	@echo ""
	@echo "  TESZTEK"
	@echo "  make test          - Mindkét oldal tesztjei"
	@echo "  make test-be       - Pytest"
	@echo "  make test-fe       - Vitest"
	@echo "  make coverage      - Coverage mindkét oldalon"
	@echo ""
	@echo "  ANALÍZIS (csak backend)"
	@echo "  make trend         - Wily trendek"
	@echo "  make health        - Teljes health report"
	@echo "  make mutation      - Mutation testing"
	@echo ""
	@echo "  BE: SRC_DIR=$(SRC_DIR)"
	@echo "  FE: $(FE_DIR)/package.json $(FE_EXISTS)"
	@echo ""

# =============================================================================
# SETUP
# =============================================================================

install: install-be install-fe

install-be:
	@echo "🐍 Backend setup..."
	cd $(BE_DIR) && python -m pip install -r requirements-dev.txt
	python -m pre_commit install
	@if [ ! -f .secrets.baseline ]; then \
		if command -v detect-secrets >/dev/null 2>&1; then \
			detect-secrets scan > .secrets.baseline; \
			echo "✅ .secrets.baseline létrehozva"; \
		fi; \
	fi
	@echo "✅ Backend kész"

install-fe:
	@echo "⚛️  Frontend setup..."
	@if [ ! -d "$(FE_DIR)" ]; then echo "❌ $(FE_DIR)/ nem létezik"; exit 1; fi
	cd $(FE_DIR) && npm install
	cd $(FE_DIR) && npm install -D \
		typescript @types/react @types/react-dom \
		eslint @eslint/js typescript-eslint \
		eslint-plugin-react eslint-plugin-react-hooks \
		prettier eslint-config-prettier \
		vitest @vitest/coverage-v8 \
		@testing-library/react @testing-library/jest-dom jsdom \
		husky lint-staged
	@echo "✅ Frontend kész"

# =============================================================================
# GYORS CHECK
# =============================================================================

check: check-be check-fe

check-be:
	@echo "⚡ Backend check ($(SRC_DIR))..."
	@cd $(BE_DIR) && ruff check . --fix
	@cd $(BE_DIR) && ruff format .
	@echo "✅ Backend check OK"

check-fe:
	@echo "⚡ Frontend check..."
	@if [ "$(FE_EXISTS)" = "no" ]; then echo "⚠️  $(FE_DIR)/package.json nem található - skip"; exit 0; fi
	@cd $(FE_DIR) && npx eslint src --fix
	@cd $(FE_DIR) && npx prettier --write src
	@echo "✅ Frontend check OK"

# =============================================================================
# QUALITY GATE
# =============================================================================

quality: quality-be quality-fe

quality-be:
	@./quality_gate.sh --backend --full

quality-fe:
	@./quality_gate.sh --frontend --full

ci: ci-be ci-fe

ci-be:
	@./quality_gate.sh --backend --ci

ci-fe:
	@./quality_gate.sh --frontend --ci

strict:
	@./quality_gate.sh --backend --strict
	@./quality_gate.sh --frontend --ci

# =============================================================================
# TESZTEK
# =============================================================================

test: test-be test-fe

test-be:
	cd $(BE_DIR) && pytest tests/ -v --tb=short

test-fe:
	@if [ "$(FE_EXISTS)" = "no" ]; then echo "⚠️  Frontend nem található - skip"; exit 0; fi
	cd $(FE_DIR) && npx vitest run

coverage: coverage-be coverage-fe

coverage-be:
	cd $(BE_DIR) && pytest tests/ \
		--cov=. \
		--cov-branch \
		--cov-report=html:htmlcov \
		--cov-report=term-missing:skip-covered
	@echo "📊 Backend report: $(BE_DIR)/htmlcov/index.html"

coverage-fe:
	@if [ "$(FE_EXISTS)" = "no" ]; then echo "⚠️  Frontend nem található - skip"; exit 0; fi
	cd $(FE_DIR) && npx vitest run --coverage
	@echo "📊 Frontend report: $(FE_DIR)/coverage/index.html"

# =============================================================================
# ANALÍZIS (backend)
# =============================================================================

trend:
	@./quality_gate.sh --backend --trend

health:
	@./quality_gate.sh --backend --health

mutation:
	@echo "🧬 Mutation testing..."
	cd $(BE_DIR) && mutmut run || true
	cd $(BE_DIR) && mutmut results

# =============================================================================
# EGYEDI CHECKEK
# =============================================================================

lint: lint-be lint-fe

lint-be:
	cd $(BE_DIR) && ruff check .

lint-fe:
	@if [ "$(FE_EXISTS)" = "no" ]; then exit 0; fi
	cd $(FE_DIR) && npx eslint src

format: format-be format-fe

format-be:
	cd $(BE_DIR) && ruff format .

format-fe:
	@if [ "$(FE_EXISTS)" = "no" ]; then exit 0; fi
	cd $(FE_DIR) && npx prettier --write src

typecheck:
	@echo "🔷 TypeScript typecheck..."
	@if [ "$(FE_EXISTS)" = "no" ]; then echo "⚠️  Frontend nem található - skip"; exit 0; fi
	cd $(FE_DIR) && npx tsc --noEmit

# =============================================================================
# CLEANUP
# =============================================================================

clean:
	rm -rf \
		$(BE_DIR)/.pytest_cache \
		$(BE_DIR)/.mypy_cache \
		$(BE_DIR)/.ruff_cache \
		$(BE_DIR)/.coverage \
		$(BE_DIR)/htmlcov \
		$(BE_DIR)/.mutmut-cache \
		$(BE_DIR)/.wily \
		$(FE_DIR)/coverage \
		$(FE_DIR)/dist
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@echo "🧹 Clean"
