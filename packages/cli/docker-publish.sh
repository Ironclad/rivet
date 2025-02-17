#!/usr/bin/env bash

yarn build

VERSION=$(node -p "require('./package.json').version")

echo "Publishing version $VERSION..."

docker build -t abrennekeironclad/rivet-server:$VERSION -t abrennekeironclad/rivet-server:latest . --platform=linux/amd64
docker build -t abrennekeironclad/rivet-server:$VERSION-arm64 -t abrennekeironclad/rivet-server:latest-arm64 . --platform=linux/arm64

docker push abrennekeironclad/rivet-server:$VERSION
docker push abrennekeironclad/rivet-server:$VERSION-arm64
docker push abrennekeironclad/rivet-server:latest
docker push abrennekeironclad/rivet-server:latest-arm64
