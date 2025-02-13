#!/bin/sh

PROJECT_PATH="$2"
shift 2
exec npx @ironclad/rivet-cli serve "/project/$PROJECT_PATH" "$@"
