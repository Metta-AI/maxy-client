#!/bin/bash
# Maxy echo listener — fully on-device and ephemeral.
set -uo pipefail

WHISPER=/opt/homebrew/bin/whisper-cli
FFMPEG=/opt/homebrew/bin/ffmpeg
MODEL="${MAXY_ECHO_MODEL:-$HOME/maxy-echo/models/ggml-base.en.bin}"
DEVICE="${MAXY_MIC_DEVICE:-0}"
CHUNK="${MAXY_ECHO_CHUNK:-5}"
PORTS="${MAXY_ECHO_PORTS:-8123 8124}"
SILENCE_DB="${MAXY_ECHO_SILENCE_DB:--45}"

TMP="$(mktemp -d /tmp/maxy-echo.XXXXXX)"
trap 'rm -rf "$TMP"' EXIT

# Common whisper silence hallucinations that should never reach the display.
JUNK_RE='^(you|thank you\.?|thanks for watching\.?|\.+|\[.*\]|\(.*\)|bye\.?|so\.?|okay\.?|uh\.?|um\.?)$'

echo "maxy-echo: device=$DEVICE chunk=${CHUNK}s ports=[$PORTS] model=$(basename "$MODEL")"

while true; do
  WAV="$TMP/chunk.wav"
  "$FFMPEG" -hide_banner -loglevel error -f avfoundation -i ":$DEVICE" \
    -t "$CHUNK" -ac 1 -ar 16000 -y "$WAV" 2>/dev/null || { sleep 0.3; continue; }
  [ -s "$WAV" ] || { sleep 0.2; continue; }

  MEAN=$("$FFMPEG" -hide_banner -i "$WAV" -af volumedetect -f null - 2>&1 \
    | sed -n 's/.*mean_volume: \(-*[0-9.]*\) dB.*/\1/p')
  if [ -n "$MEAN" ] && awk "BEGIN{exit !($MEAN < $SILENCE_DB)}"; then
    rm -f "$WAV"
    continue
  fi

  TEXT=$("$WHISPER" -m "$MODEL" -f "$WAV" -nt -np -l en -t 4 2>/dev/null \
    | tr '\n' ' ' | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//; s/[[:space:]]+/ /g')
  rm -f "$WAV"

  [ -z "$TEXT" ] && continue
  LOWER=$(printf '%s' "$TEXT" | tr '[:upper:]' '[:lower:]')
  echo "$LOWER" | grep -qE "$JUNK_RE" && continue
  [ "${#TEXT}" -lt 2 ] && continue

  echo "  ↪ $TEXT"
  for PORT in $PORTS; do
    curl -s -m 2 -X POST "http://127.0.0.1:$PORT/echo" \
      -H 'Content-Type: text/plain' --data "$TEXT" >/dev/null 2>&1 || true
  done
done
