#!/bin/bash
set -e
npm run build -- --base=/mobile/
rsync -avz --delete dist/ tempo2:www/mobile/ --exclude='.well-known'
cp htaccess.mobile dist/.htaccess
rsync -avz dist/.htaccess tempo2:www/mobile/.htaccess
rsync -avz api/ tempo2:www/api/
echo "Deploy completado. Disponible en https://tempo2.molotov.es/mobile/"
