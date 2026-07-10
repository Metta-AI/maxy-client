#!/bin/bash
# Stop the mic capture loop while leaving the Maxy clients running.
if pkill -f '[e]cho_listen.sh'; then
  echo "maxy-echo stopped."
else
  echo "maxy-echo was not running."
fi
