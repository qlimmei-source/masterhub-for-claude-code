#!/bin/bash
# Copies the hub template into a project in one step (Mac and Linux).
# It never deletes and never overwrites: a file that already exists is kept and reported.
# No network, no sudo, nothing outside the project folder is changed.
#
# Run: bash copy_template.sh "<project folder>"

set -u

if [ $# -ne 1 ]; then
    echo "STOP: give the project folder: bash copy_template.sh \"<project folder>\""
    exit 2
fi
if [ ! -d "$1" ]; then
    echo "STOP: no such folder: $1"
    exit 2
fi

template="$(cd "$(dirname "$0")/../template" && pwd)"
target="$(cd "$1" && pwd)"

copied=0
kept=0
while IFS= read -r -d '' source; do
    relative="${source#"$template"/}"
    destination="$target/$relative"
    if [ -e "$destination" ]; then
        echo "kept (already there): $relative"
        kept=$((kept + 1))
        continue
    fi
    mkdir -p "$(dirname "$destination")"
    # -n: never overwrite, even if the file appeared a moment ago.
    if cp -n "$source" "$destination" && [ -e "$destination" ]; then
        echo "copied: $relative"
        copied=$((copied + 1))
    else
        echo "STOP: could not copy $relative"
        exit 1
    fi
done < <(find "$template" -type f -print0)

echo "DONE: $copied copied, $kept kept as they were"
