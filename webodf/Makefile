all:
	java -jar /tmp/compiler.jar --define='IS_COMPILED_CODE=true' --warning_level VERBOSE --compilation_level ADVANCED_OPTIMIZATIONS --formatting PRETTY_PRINT --externs externs.js --js lib/runtime.js --js lib/packages.js --js lib/core/UnitTester.js --js tests/tests.js > out
