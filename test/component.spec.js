'use strict';
var path = require('path');
var helpers = require('yeoman-test');
var assert = require('yeoman-assert');

describe('moda Component generator', function() {
    var SUB_GEN_PATH = '../cp';

    // not testing the actual run of generators yet
    it('can be required without throwing', function() {
        this.app = require(SUB_GEN_PATH);
    });

    describe('basic file creation', function() {
        var testArguments = 'test-name';
        var expectedContent = [
            ['app/scripts/test-name/test-name-cp.js', /testName/],
            ['app/scripts/test-name/test-name-cp.js', /module\('tmp'\)/],
            ['app/scripts/test-name/test-name-cp.js', /scripts\/test-name\/test-name-cp\.html/],
            ['app/scripts/test-name/test-name-cp.spec.js', /\('<test-name><\/test-name>'\)/],
            ['app/scripts/test-name/test-name-cp.html', /testName/],
        ];
        var expected = [
            'app/scripts/test-name/test-name-cp.js',
            'app/scripts/test-name/test-name-cp.spec.js',
            'app/scripts/test-name/test-name-cp.html',
            'app/scripts/test-name/_test-name-cp.scss'
        ];

        var noFile = [
            'app/scripts/test-name/test-name-s.js',
            'app/scripts/test-name/test-name-f.js',
            'app/scripts/test-name-cp.js'
        ];

        var nonExpected = [
            ['app/scripts/test-name/test-name-cp.js', /testNamea/]
        ];

        var options = {
            'useDefaults': true,
            'skipInject': true
        };

        var runGen;

        beforeEach(function() {
            runGen = helpers
                .run(path.join(__dirname, SUB_GEN_PATH))
                .inDir(path.join(__dirname, '.tmp'))
        });

        it('creates expected files', function(done) {
            runGen
                .withArguments(testArguments)
                .withOptions(options)
                .on('end', function() {
                    assert.file([].concat(
                        expected
                    ));
                    assert.noFile([].concat(
                        noFile
                    ));
                    assert.fileContent([].concat(
                        expectedContent
                    ));
                    assert.noFileContent([].concat(
                        nonExpected
                    ));
                    done();
                });
        });
    });


    describe('file in sub folder creation', function() {
        var testArguments = 'test-name test-path';
        var expectedContent = [
            ['app/scripts/test-path/test-name/test-name-cp.js', /testName/],
            ['app/scripts/test-path/test-name/test-name-cp.js', /module\('tmp'\)/],
            ['app/scripts/test-path/test-name/test-name-cp.js', /scripts\/test-path\/test-name\/test-name-cp\.html/],
            ['app/scripts/test-path/test-name/test-name-cp.spec.js', /\('<test-name><\/test-name>'\)/],
            ['app/scripts/test-path/test-name/test-name-cp.html', /testName/],
        ];
        var expected = [
            'app/scripts/test-path/test-name/test-name-cp.js',
            'app/scripts/test-path/test-name/test-name-cp.spec.js',
            'app/scripts/test-path/test-name/test-name-cp.html',
            'app/scripts/test-path/test-name/_test-name-cp.scss'
        ];

        var noFile = [
            'app/scripts/test-path/test-name/test-name-s.js',
            'app/scripts/test-path/test-name/test-name-f.js',
            'app/scripts/test-name-cp.js'
        ];

        var nonExpected = [
            ['app/scripts/test-path/test-name/test-name-cp.js', /testNamea/]
        ];

        var options = {
            'useDefaults': true,
            'skipInject': true
        };

        var runGen;

        beforeEach(function() {
            runGen = helpers
                .run(path.join(__dirname, SUB_GEN_PATH))
                .inDir(path.join(__dirname, '.tmp'))
        });

        it('creates expected files', function(done) {
            runGen
                .withArguments(testArguments)
                .withOptions(options)
                .on('end', function() {
                    assert.file([].concat(
                        expected
                    ));
                    assert.noFile([].concat(
                        noFile
                    ));
                    assert.fileContent([].concat(
                        expectedContent
                    ));
                    assert.noFileContent([].concat(
                        nonExpected
                    ));
                    done();
                });
        });
    });


    describe('file with service creation and no template (in sub folder)', function() {
        var testArguments = 'test-name test-path';
        var expectedContent = [
            ['app/scripts/test-path/test-name/test-name-cp.js', /testName/],
            ['app/scripts/test-path/test-name/test-name-cp.js', /module\('tmp'\)/],
            ['app/scripts/test-path/test-name/test-name-s.js', /module\('tmp'\)/],
            ['app/scripts/test-path/test-name/test-name-s.js', /TestName/],
            ['app/scripts/test-path/test-name/test-name-s.spec.js', /TestName/],
            ['app/scripts/test-path/test-name/test-name-cp.spec.js', /\('<test-name><\/test-name>'\)/],
        ];
        var expected = [
            'app/scripts/test-path/test-name/test-name-cp.js',
            'app/scripts/test-path/test-name/test-name-cp.spec.js',
            'app/scripts/test-path/test-name/test-name-s.js',
            'app/scripts/test-path/test-name/test-name-s.spec.js'
        ];

        var noFile = [
            'app/scripts/test-path/test-name/test-name-f.js',
            'app/scripts/test-path/test-name/test-name-f.spec.js',
            'app/scripts/test-name-cp.js',
            'app/scripts/test-path/test-name/test-name-cp.html',
            'app/scripts/test-path/test-name/_test-name-cp.scss'
        ];

        var nonExpected = [
            ['app/scripts/test-path/test-name/test-name-cp.js', /templateUrl/]
        ];

        var options = {
            'skipInject': true
        };

        var runGen;

        beforeEach(function() {
            runGen = helpers
                .run(path.join(__dirname, SUB_GEN_PATH))
                .inDir(path.join(__dirname, '.tmp'))

        });

        it('creates expected files', function(done) {
            runGen
                .withArguments(testArguments)
                .withPrompts({
                    createService: 'service',
                    createTemplate: false
                })
                .withOptions(options)
                .on('end', function() {
                    assert.file([].concat(
                        expected
                    ));
                    assert.noFile([].concat(
                        noFile
                    ));
                    assert.fileContent([].concat(
                        expectedContent
                    ));
                    assert.noFileContent([].concat(
                        nonExpected
                    ));
                    done();
                });
        });
    });
});