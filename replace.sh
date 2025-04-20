#!/bin/bash

find . -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/api/config/logger.js" | while read -r file; do
    dir=$(dirname "$file")
    relative_path=$(python3 -c "import os.path; print(os.path.relpath('api/config', '$dir'))")
    
    if ! grep -q "require.*logger" "$file"; then
        temp_file=$(mktemp)
        echo "const logger = require('$relative_path/logger'); // Logger configuration" > "$temp_file"
        cat "$file" >> "$temp_file"
        mv "$temp_file" "$file"
        echo "Added logger import to $file"
    else
        echo "Logger import already exists in $file"
    fi
done