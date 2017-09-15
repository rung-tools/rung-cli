#!/bin/bash

echo '----------------------------'
echo 'Lines of source code'
echo '----------------------------'
find src -name '*.js' | xargs wc -l

echo '----------------------------'
echo 'Lines of tests'
echo '----------------------------'
find test -name '*.js' | xargs wc -l
