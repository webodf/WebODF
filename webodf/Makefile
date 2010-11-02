COMPILERJAR=/tmp/compiler.jar
RHINOJAR=/usr/share/java/rhino.jar
NODE=/tmp/node-v0.2.4/node
JSFILES := $(wildcard lib/*.js lib/*/*.js lib/*/*/*.js tests/*/*.js tests/*/*/*.js tests/*.js)
CMD := $(foreach JSFILE,$(JSFILES), --js $(JSFILE))

all: test

test: nodetest rhinotest simplecompiled.js compilednodetest compiledrhinotest
#test: nodetest rhinotest compiled.js

nodetest: $(JSFILES)
	$(NODE) lib/runtime.js tests/tests.js

rhinotest: $(JSFILES)
	java -jar $(RHINOJAR) -debug lib/runtime.js tests/tests.js

compilednodetest: compiled.js
	$(NODE) compiled.js

compiledrhinotest: compiled.js
	java -jar $(RHINOJAR) -debug compiled.js

# --compilation_level ADVANCED_OPTIMIZATIONS does not work
simplecompiled.js: $(JSFILES) externs.js
	java -jar $(COMPILERJAR) --define='IS_COMPILED_CODE=true' --warning_level VERBOSE --compilation_level SIMPLE_OPTIMIZATIONS --formatting PRETTY_PRINT --externs externs2.js $(foreach JSFILE,$(JSFILES), --js $(JSFILE)) > simplecompiled.js

compiled.js: $(JSFILES) externs.js
	java -jar $(COMPILERJAR) --define='IS_COMPILED_CODE=true' --warning_level VERBOSE --compilation_level ADVANCED_OPTIMIZATIONS --formatting PRETTY_PRINT --externs externs.js --use_only_custom_externs true $(foreach JSFILE,$(JSFILES), --js $(JSFILE)) > compiled.js

clean:
	$(RM) compiled.js simplecompiled.js

# make sure targets are deleted if a build exits with a non-zero status code
.DELETE_ON_ERROR:

