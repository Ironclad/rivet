#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"

# no-deprecation silences somes warnings
NODE_OPTIONS="--no-deprecation" exec ts-node -T "$SCRIPT_DIR/src/cli.ts" "$@"
