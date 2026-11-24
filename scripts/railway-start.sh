#!/usr/bin/env bash
# Back-compat wrapper — prefer scripts/container-start.sh
exec bash "$(dirname "$0")/container-start.sh"
