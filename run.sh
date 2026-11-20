#!/bin/sh
# 运行小黑盒每日任务，读取同目录 account.env
set -e
cd "$(dirname "$0")"
if [ ! -f account.env ]; then
  echo "缺少 account.env，先运行 node extract.js 生成" >&2
  exit 1
fi
set -a
. ./account.env
set +a
exec node heybox_sign.js
