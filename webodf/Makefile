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

COMPILERJAR=/tmp/compiler.jar
RHINOJAR=/usr/share/java/rhino.jar
NODE=/tmp/node-v0.2.4/node
JSCOVERAGE=/tmp/jscoverage-0.5.1/jscoverage
JSDOCDIR=/tmp/jsdoc_toolkit-2.3.2/jsdoc-toolkit

LIBJSFILES := $(wildcard lib/*.js lib/*/*.js lib/*/*/*.js)
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
	$(NODE) simplecompiled.js

compiledrhinotest: simplecompiled.js
	java -jar $(RHINOJAR) -debug simplecompiled.js

# simplecompiled.js should actually work, creating compiled.js is just to
# trigger compiler errors
simplecompiled.js: $(JSFILES)
	java -jar $(COMPILERJAR) --warning_level VERBOSE --compilation_level WHITESPACE_ONLY --formatting PRETTY_PRINT $(foreach JSFILE,$(JSFILES), --js $(JSFILE)) > simplecompiled.js

compiled.js: $(JSFILES) externs.js
	java -jar $(COMPILERJAR) --define='IS_COMPILED_CODE=true' --warning_level VERBOSE --compilation_level ADVANCED_OPTIMIZATIONS --formatting PRETTY_PRINT --externs externs.js --use_only_custom_externs true $(foreach JSFILE,$(JSFILES), --js $(JSFILE)) > compiled.js

clean:
	$(RM) -rf compiled.js simplecompiled.js docs instrumented

# make sure targets are deleted if a build exits with a non-zero status code
.DELETE_ON_ERROR:

