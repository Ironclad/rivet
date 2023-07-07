#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"

# no-deprecation silences somes warnings
exec yarn tsx "$SCRIPT_DIR/src/cli.ts" "$@"
