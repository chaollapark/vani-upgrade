#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
IMAGE="mcr.microsoft.com/playwright:v1.52.0-jammy"

mkdir -p "${UI_DIR}/artifacts"

docker run --rm \
  --network host \
  -v "${UI_DIR}:/work" \
  -w /work \
  "${IMAGE}" \
  bash -lc "
    set -euo pipefail
    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install
    fi
    npx playwright test \"\$@\"
  " -- "$@"
