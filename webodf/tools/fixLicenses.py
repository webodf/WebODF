#!/usr/bin/python -Qwarnall
# -*- coding: utf-8 -*-
#
# This script checks if all files have licenses and fixes them if needed.
# The script should be run from the root directory of the webodf project.
import os, os.path, re

# read the license text from the source file
# the license starts at the line ' * @licstart' and ends at ' */'
def readLicense(path):
	file = open(path, "rU")
	licensetext = []
	started = False
	for line in file:
		if line.rstrip() == ' * @licstart':
			started = True
		if started:
			licensetext.append(line)
		if line.rstrip() == ' */':
			break
	return licensetext

def writeLicense(file, license, defaultcopyright):
	if defaultcopyright:
		file.write(defaultcopyright)
	file.writelines(license)

def fixLicense(path, license, defaultcopyright):
	# read the file
	file = open(path, "rU")
	lines = file.readlines()
	file.close()
	# does the file have any copyright statement already?
	hasLicense = False
	hasCopyright = False
	for line in lines:
		if line.rstrip() == ' * @licstart':
			hasLicense = True
		if line[:17] == ' * Copyright (C) ':
			hasCopyright = True
	if hasCopyright:
		defaultcopyright = None
	wroteLicense = False
	skip = False
	# write the file with the new slice
	file = open(path, "w")
	for line in lines:
		if not wroteLicense:
			if not hasLicense:
				file.write("/**\n")
				writeLicense(file, license, defaultcopyright)
				wroteLicense = True
			elif line.rstrip() == ' * @licstart':
				writeLicense(file, license, defaultcopyright)
				wroteLicense = True
				skip = True
		if skip:
			if line.rstrip() == ' */':
				skip = False
		else:
			file.write(line)
	file.close()

# get list of *.js files
jsfiles = []
for root, directories, files in os.walk("."):
	for f in files:
		if f[-3:] == ".js":
			jsfiles.append(os.path.abspath(os.path.join(root, f)))

lic_ignores = []

# don't touch .git
lic_ignores.append("\\.git/")

# third party
lic_ignores.append("node_modules/xmldom/")
lic_ignores.append("programs/.*/cordova-[0-9.]*\\.js$")
lic_ignores.append(".*/sencha-touch\\.js$")
lic_ignores.append(".*/JSLint\\.js$")

common_base = os.getcwd()+"/"
removees = []
for lignore in lic_ignores:
	r = re.compile(lignore)
	for jsfile in jsfiles:
		if r.match(jsfile[len(common_base):]):
			removees.append(jsfile)
			print "skipping:",jsfile

for removee in removees:
	jsfiles.remove(removee)

sourcefilepath = os.path.join(os.getcwd(), "LICENSE")
licensetext = readLicense(sourcefilepath)
defaultcopyright = " * Copyright (C) 2012 KO GmbH <copyright@kogmbh.com>\n\n"

for f in jsfiles:
	fixLicense(f, licensetext, defaultcopyright)
