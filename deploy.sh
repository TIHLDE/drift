#!/usr/bin/env bash

set -e

docker compose -f compose.prod.yml up -d --build --force-recreate