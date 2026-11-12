#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
# 4174: nem ütközik a Playwright e2e dev-szerverével (4173). Korábban az e2e
# reuseExistingServer miatt a preview-t kapta el webszervernek — a VITE_E2E
# nélküli dist-ből futottak a tesztek, ami látszólagos tömeges hibát adott.
PORT="${BLACKJACK_PORT:-4174}"
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

# A dist újraépítése szükséges, ha bármely forrás (src/, public/, index.html,
# package.json) újabb, mint a dist — így az ikon soha nem nyit elavult buildet.
is_build_stale() {
  [[ ! -f "$PROJECT_DIR/dist/index.html" ]] && return 0
  local dist_mtime newest_src

  dist_mtime=$(stat -c %Y "$PROJECT_DIR/dist/index.html")
  newest_src=$(find "$PROJECT_DIR/src" "$PROJECT_DIR/public" \
    "$PROJECT_DIR/index.html" "$PROJECT_DIR/package.json" \
    -type f -newer "$PROJECT_DIR/dist/index.html" -print -quit 2>/dev/null)
  [[ -n "$newest_src" ]]
}

ensure_build_fresh() {
  if ! is_build_stale; then
    return 0
  fi

  printf 'Blackjack: forrás újabb a buildnél — újraépítés…\n'
  npm --prefix "$PROJECT_DIR" run build >"$BUILD_LOG" 2>&1 || {
    show_error "A production build meghiúsult. Napló: $BUILD_LOG"
    exit 1
  }
}

ensure_preview_running() {
  if curl -fsS "$URL" >/dev/null 2>&1; then
    return 0
  fi

  nohup npm --prefix "$PROJECT_DIR" run preview -- --host 127.0.0.1 --port "$PORT" >"$PREVIEW_LOG" 2>&1 &

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
  elif is_build_stale; then
    printf 'WARN az elavult build újraépül a következő indításkor\n'
  else
    printf 'OK build friss\n'
  fi
  printf 'OK blackjack launcher -> %s\n' "$URL"
  exit 0
fi

require_path "$PROJECT_DIR/package.json" "package.json"
require_path "$PROJECT_DIR/node_modules" "node_modules"

cd "$PROJECT_DIR"

ensure_build_fresh
ensure_preview_running
exec xdg-open "$URL"
