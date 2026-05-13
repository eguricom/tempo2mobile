#!/bin/bash
set -e
npm run build
rsync -avz --delete dist/ tempo2:www-mobile/ --exclude='.well-known'
rsync -avz api/ tempo2:www-mobile/api/
echo "Deploy completado"
