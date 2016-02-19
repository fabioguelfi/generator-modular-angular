'use strict';
var path = require('path');
var yeoman = require('yeoman-generator');
var defaultSettings = require('./default-settings.js');
var helper = require('./helper.js');
var chalk = require('chalk');
var fs = require('fs');
var _s = require('underscore.string');
var _ = require('lodash');

module.exports = yeoman.Base.extend({
    constructor: function() {
        // super constructor needs to be called manually
        // as the constructor-function is overwritten by this
        yeoman.Base.apply(this, arguments);
        this.argument('name', {type: String, required: true});

        // define global options
        this.option('useDefaults');
        this.option('openInEditor');
        this.option('noParentFolder');
        this.option('skipInject');

        // define arguments
        this.argument('targetFolder', {
            type: String,
            required: false,
            description: 'The path of the parent module. Strips app and scripts folders'
        });


        // set all the different name versions to be used in the templates
        this.setModuleNames(this.name);

        // set app name
        this.setAppVariables();


        // set sources root (for file-templates)
        var sourceRoot = '/templates/app';
        this.sourceRoot(path.join(__dirname, sourceRoot));

        // additional variables
        this.createdFiles = [];

        // init here, although its double the trouble for now
        //this.mergeConfig();
    },

    /**
     *  parent initialize function, inherited by sub-gens
     */
    init: function() {
        this.mergeConfig();
        this.overWriteTplPathIfSet();
    },

    /**
     * helper function to merge default settings with the ones
     * provided by the .yo-rc.json
     */
    mergeConfig: function() {
        // get either default or from config

        // create a clone to avoid testing issues
        var defaultCfg = _.cloneDeep(defaultSettings);
        _.merge(defaultCfg, this.config.getAll());
        _.merge(this, defaultCfg);
    },

    /**
     * allows overwriting of the template path of the generator
     * so users can specifiy their own template path
     */
    overWriteTplPathIfSet: function() {
        if (this.customTemplatesPath) {
            if (fs.existsSync(this.customTemplatesPath)) {
                this.sourceRoot(this.customTemplatesPath);
            } else {
                throw (new Error('custom template path ' + this.customTemplatesPath + ' does not exist. Check your .yo-rc.json.'));
            }
        }
    },

    /**
     * set the app variables, e.g. the name of the app in the
     * different required formats such as camelized or slugified
     */
    setAppVariables: function() {
        // define app name variables
        var bowerJson = {};
        try {
            bowerJson = require(path.join(process.cwd(), 'bower.json'));
        } catch (e) {
        }
        if (bowerJson.name) {
            this.appname = bowerJson.name;
        } else {
            this.appname = path.basename(process.cwd());
        }
        this.appname = _s.camelize(_s.slugify(_s.humanize(this.appname)));
        this.scriptAppName = bowerJson.moduleName || this.appname;

        // define app path variable
        if (typeof this.env.options.appPath === 'undefined') {
            this.env.options.appPath = this.options.appPath || bowerJson.appPath || 'app';
            this.options.appPath = this.env.options.appPath;
        }
    },

    /**
     * sets all the different name versions to be used in the templates
     */
    setModuleNames: function(name) {
        this.cameledName = _s.camelize(name);
        this.classedName = _s.classify(name);
        this.sluggedName = _s.slugify(name);
        this.dashedName = _s.dasherize(name);
        this.humanizedName = _s.humanize(name);
    },

    /**
     * helper function to get rid of potential parent paths
     * @param path{string}
     * @returns {string}
     */
    cleanUpPath: function(path) {
        path = path
            .replace(this.dirs.appModules, '')
            .replace(this.dirs.app, '');
        return path;
    },

    /**
     * helper function to format the path names to the preferred
     * style as configured in the .yo-rc.json
     * @param name{string}
     * @returns {string}
     */
    formatNamePath: function(name) {
        var style = this.config.get('pathOutputStyle') || 'dasherize';
        return _s[style](name);
    },

    /**
     *
     * @returns {string}
     */
    defineTargetFolder: function() {
        var realTargetFolder;

        // allow creating sub-modules via reading and parsing the path argument
        if (this.targetFolder) {
            this.targetFolder = this.cleanUpPath(this.targetFolder);
            realTargetFolder = path.join(this.targetFolder);
        } else {

            if (this.curGenCfg.globalDir) {
                realTargetFolder = this.curGenCfg.globalDir;
            } else {
                realTargetFolder = '.'
            }
        }

        // check if a same named parent directory should be created
        // for directives and routes
        if (this.curGenCfg.createDirectory && !this.options.noParentFolder) {
            realTargetFolder = path.join(realTargetFolder, this.formatNamePath(this.name));
        }

        return realTargetFolder;
    },

    /**
     * main file-creation pipeline function
     * @param templateName
     */
    generateSourceAndTest: function(templateName) {
        this.templateName = templateName;
        this.curGenCfg = this.subGenerators[templateName];

        var realTargetFolder = this.defineTargetFolder(),
            filesToCreate = [];

        // create file paths
        var inAppPath = path.join(this.dirs.appModules, realTargetFolder);
        var generatorTargetPath = path.join(this.env.options.appPath, inAppPath);
        var standardFileName = (this.curGenCfg.prefix || '') + this.formatNamePath(this.name) + (this.curGenCfg.suffix || '');

        // prepare template template and data
        if (this.createTemplate) {
            this.tplUrl = path.join(inAppPath, standardFileName + this.fileExt.tpl)
                // windows fix for url path
                .replace(/\\/g, '/');
            filesToCreate.push({
                tpl: this.templateName + this.fileExt.tpl,
                targetFileName: standardFileName + this.fileExt.tpl
            });
            filesToCreate.push({
                tpl: this.stylePrefix + this.templateName + this.fileExt.style,
                targetFileName: this.stylePrefix + standardFileName + this.fileExt.style
            });
        } else {
            // needs to be set for the _s.templates to work
            this.tplUrl = false;
        }

        // run create service or factory if option is given
        if (this.createService === 'service' || this.createService === 'factory') {
            // add service to queue
            this.svcName = this.classedName;

            // add service or factory to queue
            filesToCreate.push({
                tpl: this.createService + this.fileExt.script,
                targetFileName: this.formatNamePath(this.name) + (this.subGenerators[this.createService].suffix || '') + this.fileExt.script,
                gen: this.createService
            });
            // add service test to queue
            filesToCreate.push({
                tpl: this.createService + this.testSuffix + this.fileExt.script,
                targetFileName: this.formatNamePath(this.name) + (this.subGenerators[this.createService].suffix || '') + this.testSuffix + this.fileExt.script,
                gen: this.createService
            });
        }

        if (!this.skipMainFiles) {
            // add main file to queue
            filesToCreate.push({
                tpl: templateName + this.fileExt.script,
                targetFileName: standardFileName + this.fileExt.script
            });

            // add test file to queue
            filesToCreate.push({
                tpl: templateName + this.testSuffix + this.fileExt.script,
                targetFileName: standardFileName + this.testSuffix + this.fileExt.script
            });
        }

        // create files and create a files array for further use
        for (var i = 0; i < filesToCreate.length; i++) {
            var fileToCreate = filesToCreate[i];
            var outputFile = path.join(generatorTargetPath, fileToCreate.targetFileName);
            var customYoRcTpl = this.getCustomTplFromYoRc(fileToCreate);

            // add to created files array
            this.createdFiles.push(outputFile);

            // set name suffix accordingly to template
            if (fileToCreate.gen) {
                this.nameSuffix = fileToCreate.gen.nameSuffix || '';
            } else {
                this.nameSuffix = this.curGenCfg.nameSuffix || '';
            }


            if (customYoRcTpl) {
                this.writeCustomYoRcTpl(customYoRcTpl, outputFile);
            } else {
                this.fs.copyTpl(
                    this.templatePath(fileToCreate.tpl),
                    this.destinationPath(outputFile),
                    this
                );
            }
        }
        this.afterFileCreationHook();
    },

    /**
     * checks for custom templates defined in the .yo-rc.json
     * if set they will be used instead of the default ones
     * @param fileToCreate
     * @returns {string}
     */
    getCustomTplFromYoRc: function(fileToCreate) {
        var customYoRcTpl;
        var curGenCfg = null;
        var SPEC_REG_EX = new RegExp(this.testSuffix + '\\' + this.fileExt.script + '$');
        var SCRIPTS_REG_EX = new RegExp(this.fileExt.script + '$');
        var TPL_REG_EX = new RegExp(this.fileExt.tpl + '$');
        var STYLE_REG_EX = new RegExp(this.fileExt.style + '$');

        if (fileToCreate.gen) {
            curGenCfg = this.subGenerators[fileToCreate.gen];
        } else {
            curGenCfg = this.curGenCfg;
        }

        // WHY is this necessary??
        if (curGenCfg.tpl) {
            if (fileToCreate.tpl.match(SPEC_REG_EX)) {
                customYoRcTpl = curGenCfg.tpl['spec'];
            } else if (fileToCreate.tpl.match(SCRIPTS_REG_EX)) {
                customYoRcTpl = curGenCfg.tpl['script'];
            } else if (fileToCreate.tpl.match(TPL_REG_EX)) {
                customYoRcTpl = curGenCfg.tpl['tpl'];
            } else if (fileToCreate.tpl.match(STYLE_REG_EX)) {
                customYoRcTpl = curGenCfg.tpl['style'];
            }

            if (customYoRcTpl && typeof customYoRcTpl === 'string') {
                return customYoRcTpl;
            }
        }
    },

    /**
     * helper function used to create files by using the custom
     * template string and underscores templating language
     * @param customYoRcTpl{string}
     * @param targetDir{string}
     */
    writeCustomYoRcTpl: function(customYoRcTpl, targetDir) {
        var tpl = _.template(customYoRcTpl, {})(this);
        this.fs.write(targetDir, tpl);
    },

    /**
     * things done after all files are created
     */
    afterFileCreationHook: function() {
        // run favorite ide (first to smooth the experiance)
        if (this.options.openInEditor) {
            this.spawnCommand(this.editorCommand, this.createdFiles);
        }

        // inject all files after creation
        if (!this.options.skipInject) {
            this.spawnCommand('gulp', ['injectAll']);
        }
    }
});


