#!/usr/bin/env bash
# Local MongoDB (localuser / localuser). Prefer: npm run mongo:local:up  (no script exec / no .env issues)
#
# If you run this file and see "Operation not permitted":
#   - Use: bash scripts/local-mongo-podman.sh up
#   - Or: xattr -c scripts/local-mongo-podman.sh
#   - Or grant Terminal / Cursor access to Desktop (project path) in System Settings → Privacy & Security → Files and Folders
set -euo pipefail

NAME=reviewpulse-mongo-local
IMAGE=docker.io/library/mongo:7

usage() {
  echo "Usage: bash scripts/local-mongo-podman.sh {up|down|logs|status}"
  echo "  up     — podman run on 127.0.0.1:27018 (host) → 27017 (container)"
  echo "  down   — remove container"
  echo "  logs   — follow logs"
  echo "  status — podman ps"
}

case "${1:-}" in
  up)
    podman rm -f "$NAME" 2>/dev/null || true
    podman run -d --name "$NAME" \
      -p 127.0.0.1:27018:27017 \
      -e MONGO_INITDB_ROOT_USERNAME=localuser \
      -e MONGO_INITDB_ROOT_PASSWORD=localuser \
      "$IMAGE"
    echo ""
    echo "Mongo is up on host port 27018. Ensure .env: USE_LOCAL_MONGO=true and MONGODB_URI_LOCAL uses :27018"
    echo ""
    ;;
  down)
    podman rm -f "$NAME" 2>/dev/null || true
    echo "Stopped and removed $NAME"
    ;;
  logs)
    podman logs -f "$NAME"
    ;;
  status)
    podman ps -a --filter "name=$NAME"
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac
