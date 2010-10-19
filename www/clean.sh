#! /bin/bash
if [ -z $1 ]; then
  exit;
fi

if xmlstarlet val -d /usr/share/xml/xhtml/1.0/xhtml1-strict.dtd $1; then
	xmlstarlet fo $1 > tmp
	echo '<?xml version="1.0" encoding="utf-8" ?>' > $1
	echo '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">' >> $1
	xmlstarlet c14n tmp >> $1
fi
