find /usr/share/nginx/html -type f -exec sed -i "s{__PLACEHOLDER_PUBLIC_URL__{$PUBLIC_URL{g" {} + -name "*.css" -o -name "*.html" -o -name "*.js"