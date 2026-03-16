#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${BLACKJACK_PORT:-4173}"
URL="http://127.0.0.1:${PORT}/"
BUILD_LOG="/tmp/blackjack-build.log"
PREVIEW_LOG="/tmp/blackjack-preview.log"

show_error() {
  local message="$1"

  if command -v zenity >/dev/null 2>&1; then
    zenity --error --title="Blackjack indítási hiba" --text="$message"
  else
    printf '%s\n' "$message" >&2
  fi
}

require_path() {
  local path="$1"
  local label="$2"

  if [[ ! -e "$path" ]]; then
    show_error "Hiányzó $label: $path"
    exit 1
  fi
}

ensure_preview_running() {
  if curl -fsS "$URL" >/dev/null 2>&1; then
    return 0
  fi

  nohup npm run preview -- --host 127.0.0.1 --port "$PORT" >"$PREVIEW_LOG" 2>&1 &

  for _ in {1..20}; do
    if curl -fsS "$URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  show_error "A preview szerver nem indult el. Napló: $PREVIEW_LOG"
  exit 1
}

if [[ "${1:-}" == "--check" ]]; then
  require_path "$PROJECT_DIR/package.json" "package.json"
  require_path "$PROJECT_DIR/node_modules" "node_modules"
  if [[ ! -f "$PROJECT_DIR/dist/index.html" ]]; then
    printf 'WARN build hiányzik: %s/dist/index.html\n' "$PROJECT_DIR"
  fi
  printf 'OK blackjack launcher -> %s\n' "$URL"
  exit 0
fi

require_path "$PROJECT_DIR/package.json" "package.json"
require_path "$PROJECT_DIR/node_modules" "node_modules"

cd "$PROJECT_DIR"

if [[ ! -f dist/index.html ]]; then
  npm run build >"$BUILD_LOG" 2>&1 || {
    show_error "A production build meghiúsult. Napló: $BUILD_LOG"
    exit 1
  }
fi

ensure_preview_running
exec xdg-open "$URL"
