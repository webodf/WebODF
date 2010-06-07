#! /bin/bash
echo 'var fileList = [' > filelist.js
for f in `find .. -type f -name '*.od?'`; do echo "'$f',"; done >> filelist.js
echo '];' >> filelist.js
