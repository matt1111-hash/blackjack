# =============================================================================
# MAKEFILE - Code Health Toolkit v1.0 (TypeScript/React Edition)
# =============================================================================

.PHONY: help install check quality test coverage health clean dev build

help:
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "  CODE HEALTH TOOLKIT v1.0 (TypeScript/React)"
	@echo "═══════════════════════════════════════════════════════════════"
	@echo ""
	@echo "  make install    - Első telepítés"
	@echo "  make check      - Gyors lint fix (munka közben)"
	@echo "  make quality    - Teljes quality gate"
	@echo "  make ci         - CI mód (strict)"
	@echo ""
	@echo "  make test       - Tesztek (watch mode)"
	@echo "  make test-run   - Tesztek (single run)"
	@echo "  make coverage   - Tesztek + coverage"
	@echo ""
	@echo "  make health     - Full health report"
	@echo "  make clean      - Takarítás"
	@echo ""
	@echo "  make dev        - Dev server"
	@echo "  make build      - Production build"
	@echo ""

# =============================================================================
# SETUP
# =============================================================================

install:
	npm install
	chmod +x quality_gate.sh
	@echo "✅ Installed!"

# =============================================================================
# DAILY WORKFLOW
# =============================================================================

check:
	@echo "⚡ Quick check..."
	@npm run lint -- --fix || true
	@echo "✅ Done"

quality:
	@./quality_gate.sh --full

ci:
	@./quality_gate.sh --ci

# =============================================================================
# TESTING
# =============================================================================

test:
	npm run test

test-run:
	npm run test -- --run

coverage:
	npm run test -- --run --coverage
	@echo "📊 Report: coverage/index.html"

# =============================================================================
# ANALYSIS
# =============================================================================

health:
	@./quality_gate.sh --health

# =============================================================================
# INDIVIDUAL CHECKS
# =============================================================================

lint:
	npm run lint

type:
	npx tsc --noEmit

# =============================================================================
# DEV
# =============================================================================

dev:
	npm run dev

build:
	npm run build

# =============================================================================
# CLEANUP
# =============================================================================

clean:
	rm -rf node_modules/.cache coverage dist .eslintcache
	@echo "🧹 Clean"
