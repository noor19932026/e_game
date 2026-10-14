# Include this snippet INSIDE the existing website's server { ... } block.
# Independent game files live in /var/www/e-game/word-merge/.
# Use the HTTPS server block too if HTTP redirects to HTTPS.
location = /e-game/word-merge {
    return 308 https://$host/e-game/word-merge/$is_args$args;
}
location ^~ /e-game/word-merge/ {
    root /var/www;
    index index.html;
    try_files $uri $uri/ =404;
    add_header Cache-Control "no-cache";
}

# Keep previously shared links working, including their relative asset URLs.
location = /word-merge {
    return 308 https://$host/e-game/word-merge/$is_args$args;
}
location ^~ /word-merge/ {
    return 308 https://$host/e-game$uri$is_args$args;
}
