#!/bin/bash
# Copyright 2013 <copyright@kogmbh.com>
# Author: Jos van den Oever

DIR=${1%/}
OUTPUT=$2

if [ ! -d "$DIR" ]; then
	echo "Provide a directory to pack."
	exit 1
fi
if [ -z "$OUTPUT" ]; then
	BASE=${DIR%_*}
	EXT=${DIR##*_}
	if [ "${BASE}_$EXT" != "$DIR" ]; then
		echo "Provide output name or use directory like 'name_ext'."
		exit 1
	fi
	OUTPUT="$BASE.$EXT"
fi
if [ ${OUTPUT:0:1} != "/" ]; then
	OUTPUT="$PWD/$OUTPUT"
fi

if [ ! -f "$DIR/mimetype" ]; then
	echo "No mimetype file present."
	exit 1
fi
if [ ! -f "$DIR/content.xml" ]; then
	echo "No content.xml file present."
	exit 1
fi
if [ ! -f "$DIR/styles.xml" ]; then
	echo "No styles.xml file present."
	exit 1
fi
if [ -f "$OUTPUT" ]; then
	rm "$OUTPUT"
fi

cd "$DIR"
zip -D -X -0 "$OUTPUT" mimetype
zip -D -X -9 -r "$OUTPUT" . -x mimetype \*/.\* .\* \*.png \*.jpg \*.jpeg
zip -D -X -0 -r "$OUTPUT" . -i \*.png \*.jpg \*.jpeg
echo Created "$OUTPUT"
