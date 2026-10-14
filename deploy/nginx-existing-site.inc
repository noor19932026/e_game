# Include this snippet INSIDE the existing website's server { ... } block.
# Independent game files live in /var/www/word-merge/.
# Use the HTTPS server block too if HTTP redirects to HTTPS.
location = /word-merge {
    return 308 /word-merge/;
}
location ^~ /word-merge/ {
    root /var/www;
    index index.html;
    try_files $uri $uri/ =404;
    add_header Cache-Control "no-cache";
}
