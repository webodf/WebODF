#!/usr/bin/env bash
function resize {
    convert img/logo.png -resize $1x$2 -background transparent -gravity center -extent $1x$2 $3
    optipng -o7 $3
}

resize   72   72 platforms/android/res/drawable-hdpi/icon.png
resize  800  480 platforms/android/res/drawable-land-hdpi/screen.png
resize  320  200 platforms/android/res/drawable-land-ldpi/screen.png
resize  480  320 platforms/android/res/drawable-land-mdpi/screen.png
resize 1280  720 platforms/android/res/drawable-land-xhdpi/screen.png
resize   36   36 platforms/android/res/drawable-ldpi/icon.png
resize   48   48 platforms/android/res/drawable-mdpi/icon.png
resize  480  800 platforms/android/res/drawable-port-hdpi/screen.png
resize  200  320 platforms/android/res/drawable-port-ldpi/screen.png
resize  320  480 platforms/android/res/drawable-port-mdpi/screen.png
resize  720 1280 platforms/android/res/drawable-port-xhdpi/screen.png
resize   96   96 platforms/android/res/drawable-xhdpi/icon.png
resize   96   96 platforms/android/res/drawable/icon.png

resize  128  128 platforms/firefoxos/www/img/icon-128.png
