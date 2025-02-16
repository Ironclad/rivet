#!/usr/bin/env bash

yarn build

VERSION=$(node -p "require('./package.json').version")

echo "Publishing version $VERSION..."

docker build -t abrennekeironclad/rivet-server:$VERSION -t abrennekeironclad/rivet-server:latest .

docker push abrennekeironclad/rivet-server:$VERSION
docker push abrennekeironclad/rivet-server:latest
