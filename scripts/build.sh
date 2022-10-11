#!/usr/bin/env bash
set -e

mkdir -p dist
rollup --config rollup.config.js
# Not sure why we get CRLF but we do?
sed -i '' 's/\r//' dist/heic-convert.js
minify dist/heic-convert.js > dist/heic-convert.min.js
#fingerprint=$(openssl sha1 -binary dist/heic-convert.js  | xxd -p | cut -c1-8)
fingerprint=$(cat package.json | jq -r '.version')
cp dist/heic-convert.js dist/heic-convert.${fingerprint}.js
cp dist/heic-convert.min.js dist/heic-convert.${fingerprint}.min.js
