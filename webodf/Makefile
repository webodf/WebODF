COMPILERJAR=/tmp/compiler.jar
RHINOJAR=/usr/share/java/rhino.jar
NODE=/tmp/node-v0.2.4/node
JSFILES := $(wildcard lib/*.js lib/*/*.js lib/*/*/*.js tests/*.js tests/*/*.js tests/*/*/*.js)
CMD := $(foreach JSFILE,$(JSFILES), --js $(JSFILE))

all: test

#test: nodetest rhinotest compilednodetest compiledrhinotest
test: nodetest rhinotest compiled.js

nodetest: $(JSFILES)
	$(NODE) lib/runtime.js tests/tests.js

rhinotest: $(JSFILES)
	java -jar $(RHINOJAR) lib/runtime.js tests/tests.js

compilednodetest: compiled.js
	$(NODE) compiled.js

compiledrhinotest: compiled.js
	java -jar $(RHINOJAR) compiled.js

compiled.js: $(JSFILES) externs.js
	java -jar $(COMPILERJAR) --define='IS_COMPILED_CODE=true' --warning_level VERBOSE --compilation_level ADVANCED_OPTIMIZATIONS --formatting PRETTY_PRINT --externs externs.js $(foreach JSFILE,$(JSFILES), --js $(JSFILE)) --js_output_file compiled.js

# make sure targets are deleted if a build exits with a non-zero status code
.DELETE_ON_ERROR:
