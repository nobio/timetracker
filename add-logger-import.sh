#!/bin/bash

# Find all .js files excluding node_modules and the logger.js itself
find . -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/api/config/logger.js" | while read -r file; do
    # Calculate relative path to logger.js
    rel_path=$(realpath --relative-to="$(dirname "$file")" "./api/config")
    
    # Check if file doesn't already have logger import
    if ! grep -q "require.*logger" "$file"; then
        # Add import after the first existing require statement, or at the top if none exists
        if grep -q "require" "$file"; then
            sed -i '' -e '1,/require/!b' -e '/require/a\
const logger = require('\'"$rel_path"'/logger'\');  // Logger configuration
            ' "$file"
        else
            sed -i '' -e '1i\
const logger = require('\'"$rel_path"'/logger'\');  // Logger configuration\

            ' "$file"
        fi
        echo "Added logger import to $file"
    else
        echo "Logger import already exists in $file"
    fi
done