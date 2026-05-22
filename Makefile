# Project-specific Code Health Toolkit Makefile
# Project: blackjack

.PHONY: help install check quality ci strict test coverage lint format typecheck clean

help:
	@echo "blackjack - Code Health Toolkit (node)"
	@echo "make check | quality | ci | strict | test | coverage"

check:
	@./quality_gate.sh
quality:
	@./quality_gate.sh
ci:
	@./quality_gate.sh --ci
test:
	@npm run test:run || npm run test
coverage:
	@npm run test:coverage || npm run coverage
lint format typecheck install clean:
	@echo "Use project-native commands or ./quality_gate.sh for this target."
