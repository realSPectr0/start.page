#!/usr/bin/env bash
# Convenience wrapper for macOS users.

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
exec "$SCRIPT_DIR/setup.sh" "$@"
