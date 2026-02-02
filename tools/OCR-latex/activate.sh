#!/bin/bash

# 根目录路径
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

case "$1" in
  latexocr)
    source "$BASE_DIR/envs/latexocr-env/bin/activate"
    ;;
  mineru)
    source "$BASE_DIR/envs/mineru-env/bin/activate"
    ;;
  *)
    echo "用法: ./activate.sh [latexocr|mineru]"
    exit 1
    ;;
esac
