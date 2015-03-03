'use strict';

var fs = require('fs'),
    path = require('path'),
    extend = require('extend'),
    Handlebars = require('handlebars'),
    YFM = require('yfm');

module.exports = taft;

function taft(file, data, options) {
    taft = new Taft(data, options);
    return Taft.eat(file)
}

taft.Taft = Taft;

function Taft(data, options) {
    if (typeof(options) === 'undefined') {
        options = data;
        this.data = {};
    } else {
        this.data = data || {};
    }

    Handlebars.registerHelper(options.helpers || {});
    registerPartials(options.partials || []);

    this._knownHelpers = keysToTruthy(options.helpers || {});

    if (options.layout) {
        var _layout = new Taft(data);
        var layout = _layout.template(options.layout)

        this.layout = function(content, data) {
            Handlebars.registerPartial('body', content);
            var page = layout({page: data});
            Handlebars.unregisterPartial('body');
            return page;
        };
    }
}

Taft.prototype.template = function(file) {
    var raw;
    try {
        raw = fs.readFileSync(file, {encoding: 'utf8'});
    } catch (err) {
        if (err.name == 'TypeError') raw = file;
        else throw(err)
    }

    var source = YFM(raw);

    // class data extended by current context
    var _tmpdata = extend(source.context, this.data);
    var template = Handlebars.compile(source.content.trimLeft(), {
        knownHelpers: this._knownHelpers
    });

    return function(data) {
        return template(extend(_tmpdata, data || {}));
    }
}

Taft.prototype.extend = function(data) {
    this.data = extend(this.data, data);
    return this;
}

Taft.prototype.eat = function(file, data) {
    var content = this.template(file)(data);

    if (this.layout)
        return this.layout(content, data);
    else
        return content;
}

var keysToTruthy = function(helpers) {
    var knownhelpers = Object.keys(helpers),
        output = {};
    for (var i = 0, len = knownhelpers.length; i < len; i++) {
        output[knownhelpers[i]] = true;
    };
    return output;
}

var registerPartials = function(partials) {
    if (Array.isArray(partials))
        for (var i = 0, len = partials.length, name; i < len; i++) {
            name = path.basename(items[i], path.extname(items[i]));

            try {
                Handlebars.registerPartial(name, fs.readFileSync(items[i]));
            } catch (err) {
                console.error("Could not register partial: " + name);
            }
        }

    else if (typeof(partials) === 'object')
        for (var name in partials)
            if (partials.hasOwnProperty(name))
                Handlebars.registerPartial(name, partials[name]);
};


