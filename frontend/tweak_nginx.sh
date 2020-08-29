find /usr/share/nginx/html -type f -exec sed -i "s{__PLACEHOLDER_PUBLIC_URL__{$PUBLIC_URL{g" {} + -name "*.css" -o -name "*.html" -o -name "*.js"

if [ -z "$PUBLIC_URL" ]
then
sed -i 's/${PUBLIC_URL}/\//g' /etc/nginx/templates/default.conf.template
sed -i "s/alias/root/g" /etc/nginx/templates/default.conf.template
fi
