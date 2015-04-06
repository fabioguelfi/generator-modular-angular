'use strict';
var path = require('path');
var yeoman = require('yeoman-generator');
var defaultSettings = require('./default-settings.js');
var helper = require('./helper.js');
var chalk = require('chalk');
var _s = require('underscore.string');

module.exports = yeoman.generators.Base.extend({
    constructor: function ()
    {
        yeoman.generators.NamedBase.apply(this, arguments);

        // global options
        this.option('useDefaults');
        this.option('openInEditor');
        this.option('noParentFolder');
        this.option('skipInject');

        this.argument('targetFolder', {
            type: String,
            required: false,
            description: 'The path of the parent module. Strips app and scripts folders'
        });


        /*************************************
         **** other global templating vars ***
         ************************************/

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
        this.appname = _s.slugify(_s.humanize(this.appname));
        this.scriptAppName = bowerJson.moduleName || _s.camelize(this.appname);

        // set all the different name versions to be used in the templates
        this.setModuleNames(this.name);

        // define app path variable
        if (typeof this.env.options.appPath === 'undefined') {
            this.env.options.appPath = this.options.appPath || bowerJson.appPath || 'app';
            this.options.appPath = this.env.options.appPath;
        }

        // set sources root (for file-templates)
        var sourceRoot = '/templates/app';
        this.sourceRoot(path.join(__dirname, sourceRoot));

        // additional variables
        this.createdFiles = [];

        // init here, although its double the trouble for now
        this.init();
    },

    init: function ()
    {
        console.log('SET PROPS');
        console.log('______________________________________');

        function extend(defaultCfg, newCfg)
        {

        }

        // get either default or from config
        for (var prop in defaultSettings) {
            if (defaultSettings.hasOwnProperty(prop)) {
                var newCfgProp = this.config.get(prop);

                if (defaultSettings[prop] !== null && typeof defaultSettings[prop] === 'object') {
                    if (newCfgProp !== null && typeof newCfgProp === 'object') {
                        if (!this[prop]) {
                            this[prop] = {};
                        }
                        for (var subProp in defaultSettings[prop]) {

                            this[prop][subProp] = this.config.get(prop) && this.config.get(prop)[subProp] || defaultSettings[prop][subProp];
                        }
                    } else if (!newCfgProp) {
                        this[prop] = defaultSettings[prop];
                        // TODO maybe save config
                    } else {
                        this[prop] = defaultSettings[prop];
                        throw('config for ' + prop + ' malformed - using defaults');
                    }
                } else {
                    // if it is really set to false or null
                    if (newCfgProp === false || newCfgProp === null) {
                        this[prop] = newCfgProp;
                    } else {
                        this[prop] = newCfgProp || defaultSettings[prop];
                    }
                }
            }
        }
    },


    // sets all the different name versions to be used in the templates
    setModuleNames: function (name)
    {
        this.cameledName = _s.camelize(name);
        this.classedName = _s.classify(name);
        this.sluggedName = _s.slugify(name);
        this.dashedName = _s.dasherize(name);
        this.humanizedName = _s.humanize(name);
    },

    cleanUpPath: function (path)
    {
        path = path
            .replace(this.dirs.appModules, '')
            .replace(this.dirs.app, '');
        return path;
    },

    formatNamePath: function (name)
    {
        var style = this.config.get('pathOutputStyle') || 'dasherize';
        return _s[style](name);
    },

    defineTargetFolder: function ()
    {
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

    generateSourceAndTest: function (templateName)
    {
        this.templateName = templateName;
        this.curGenCfg = this.subGenerators[templateName];
        this.nameSuffix = this.curGenCfg.nameSuffix || '';

        var realTargetFolder = this.defineTargetFolder(),
            filesToCreate = [];

        // create file paths
        var inAppPath = path.join(this.dirs.appModules, realTargetFolder);
        var generatorTargetPath = path.join(this.env.options.appPath, inAppPath);
        var standardFileName = (this.curGenCfg.prefix || '') + this.formatNamePath(this.name) + (this.curGenCfg.suffix || '');

        // prepare template template and data
        if (this.createTemplate) {
            this.tplUrl = path.join(inAppPath, standardFileName + this.fileExt.tpl);
            filesToCreate.push({
                'tpl': this.templateName + this.fileExt.tpl,
                'targetFileName': standardFileName + this.fileExt.tpl
            });
            filesToCreate.push({
                'tpl': this.stylePrefix + this.templateName + this.fileExt.style,
                'targetFileName': this.stylePrefix + standardFileName + this.fileExt.style
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
                'tpl': this.createService + this.fileExt.script,
                'targetFileName': this.formatNamePath(this.name) + (this.subGenerators[this.createService].suffix || '') + this.fileExt.script
            });
            // add service test to queue
            filesToCreate.push({
                'tpl': this.createService + this.testSuffix + this.fileExt.script,
                'targetFileName': this.formatNamePath(this.name) + (this.subGenerators[this.createService].suffix || '') + this.testSuffix + this.fileExt.script
            });
        }

        if (!this.skipMainFiles) {
            // add main file to queue
            filesToCreate.push({
                'tpl': templateName + this.fileExt.script,
                'targetFileName': standardFileName + this.fileExt.script
            });

            // add test file to queue
            filesToCreate.push({
                'tpl': templateName + this.testSuffix + this.fileExt.script,
                'targetFileName': standardFileName + this.testSuffix + this.fileExt.script
            });
        }

        // create files and create a files array for further use
        for (var i = 0; i < filesToCreate.length; i++) {
            var outputFile = path.join(generatorTargetPath, filesToCreate[i].targetFileName);
            this.fs.copyTpl(
                this.templatePath(filesToCreate[i].tpl),
                this.destinationPath(outputFile),
                this
            );
            this.createdFiles.push(outputFile);
        }

        this.afterFileCreationHook();
    },

    afterFileCreationHook: function ()
    {
        // run favorite ide (first to smooth the experiance)
        if (this.options.openInEditor) {
            this.spawnCommand(this.editorCommand, this.createdFiles);
        }

        // inject all files after creation
        if (!this.options.skipInject) {
            this.spawnCommand('gulp', ['inject']);
        }
    }
});


