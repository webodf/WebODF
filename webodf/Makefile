# This makefile performs a number of tasks:
# * run unit tests in
#   - node.js
#   - rhino
# * compile javascript into a single file with only whitespace cleaned up and
#   run unit tests in node.js and rhino with that file simplecompiled.js
# * compile javascript into a single file while optimizing. This resulting file,
#   compiled.js is not used anywhere but the compilation step will perform nice
#   checks on the source code.
# * instrument the unit tests for determining unit test coverage.
# * generated documentation with jsdoc

# COMPILERJAR should point the JAR file of the Closure Compiler.
# http://code.google.com/closure/compiler/
COMPILERJAR=/tmp/compiler.jar
# RHINOJAR should point the Rhino JAR file. http://www.mozilla.org/rhino/
RHINOJAR=/usr/share/java/rhino.jar
# NODE should point to the Node.JS executable. http://nodejs.org/
NODE=/tmp/node-v0.2.4/node
# JSCOVERAGE should point to the JSCoverage executable.
# http://siliconforks.com/jscoverage/
JSCOVERAGE=/tmp/jscoverage-0.5.1/jscoverage
# JSDOCDIR should point to the directory where the JSDoc JAR, code and template
# can be found
# http://code.google.com/p/jsdoc-toolkit/
JSDOCDIR=/tmp/jsdoc_toolkit-2.3.2/jsdoc-toolkit

LIBJSFILES := $(wildcard lib/*.js lib/*/*.js lib/*/*/*.js) base64.js bytearray.js rawinflate.js zip.js odf.js
TESTJSFILES := $(wildcard tests/*/*.js tests/*/*/*.js tests/*.js)
JSFILES := $(LIBJSFILES) $(TESTJSFILES)

all: test compiled.js doc instrumented

doc: $(LIBJSFILES)
	java -jar $(JSDOCDIR)/jsrun.jar $(JSDOCDIR)/app/run.js -d=docs \
		-t=$(JSDOCDIR)/templates/jsdoc $(LIBJSFILES)

instrumented: $(JSFILES)
	$(JSCOVERAGE) . --exclude=extjs ../instrumented/

test: nodetest rhinotest compilednodetest compiledrhinotest

nodetest: $(JSFILES)
	$(NODE) lib/runtime.js tests/tests.js

rhinotest: $(JSFILES)
	java -jar $(RHINOJAR) -debug lib/runtime.js tests/tests.js

compilednodetest: simplecompiled.js
	cd tests && $(NODE) ../simplecompiled.js

compiledrhinotest: simplecompiled.js
	cd tests && java -jar $(RHINOJAR) -debug ../simplecompiled.js

# simplecompiled.js should actually work, creating compiled.js is just to
# trigger compiler errors
SHAREDARGS=--warning_level VERBOSE --formatting PRETTY_PRINT --jscomp_error accessControls --jscomp_error checkRegExp --jscomp_error checkTypes --jscomp_error checkVars --jscomp_error deprecated --jscomp_error fileoverviewTags --jscomp_error invalidCasts --jscomp_error missingProperties --jscomp_error nonStandardJsDocs --jscomp_error strictModuleDepCheck --jscomp_error undefinedVars --jscomp_error unknownDefines --jscomp_error visibility

simplecompiled.js: $(JSFILES)
	java -jar $(COMPILERJAR) $(SHAREDARGS) --compilation_level WHITESPACE_ONLY $(foreach JSFILE,$(JSFILES), --js $(JSFILE)) > simplecompiled.js

compiled.js: $(JSFILES) externs.js
	java -jar $(COMPILERJAR) --define='IS_COMPILED_CODE=true' $(SHAREDARGS) --compilation_level ADVANCED_OPTIMIZATIONS --externs externs.js  $(foreach JSFILE,$(JSFILES), --js $(JSFILE)) > compiled.js
#--use_only_custom_externs true

clean:
	$(RM) -rf compiled.js simplecompiled.js docs instrumented

# make sure targets are deleted if a build exits with a non-zero status code
.DELETE_ON_ERROR:

