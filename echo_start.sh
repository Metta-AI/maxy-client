#!/bin/bash
# Start the on-device Maxy echo listener without persisting transcripts.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if pgrep -f '[e]cho_listen.sh' >/dev/null; then
  echo "maxy-echo already running (pid $(pgrep -f '[e]cho_listen.sh' | tr '\n' ' '))"
  exit 0
fi

nohup bash "$SCRIPT_DIR/echo_listen.sh" >/dev/null 2>/tmp/maxy-echo.err &
echo "maxy-echo started (pid $!)."
echo "To watch live text, run: bash $SCRIPT_DIR/echo_listen.sh"
