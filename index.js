var nutil = require('njs-util');

var cls = function () {
};

cls.extend = function (props) {

    // extended class with the new prototype
    var NewClass = function () {

        // call all constructor hooks
        if (this._initHooks) {
            this.callInitHooks();
        }

        // call the constructor
        if (this.initialize) {
            this.initialize.apply(this, arguments);
        }

    };

    // instantiate class without calling constructor
    var F = function () {
    };
    F.prototype = this.prototype;

    var proto = new F();
    proto.constructor = NewClass;

    NewClass.prototype = proto;

    //inherit parent's statics
    for (var i in this) {
        if (this.hasOwnProperty(i) && i !== 'prototype') {
            NewClass[i] = this[i];
        }
    }

    // mix static properties into the class
    if (props.statics) {
        nutil.extend(NewClass, props.statics);
        delete props.statics;
    }

    // mix includes into the prototype
    if (props.includes) {
        nutil.extend.apply(null, [proto].concat(props.includes));
        delete props.includes;
    }

    // merge options
    if (props.options && proto.options) {
        props.options = nutil.extend({}, proto.options, props.options);
    }

    props._public_method_names = nutil.extend([], proto._public_method_names);
    for (var key in props) {
        var public_method_pattern = new RegExp('^[A-Z]');
        if (key.match(public_method_pattern)) {
            if (props._public_method_names.indexOf(key) < 0 && key != 'Destroy') {
                props._public_method_names.push(key);
            }
        }
    }

    // mix given properties into the prototype
    nutil.extend(proto, props);

    proto._initHooks = [];

    var parent = this;
    // jshint camelcase: false
    NewClass.__super__ = parent.prototype;

    // add method for calling all hooks
    proto.callInitHooks = function () {

        if (this._initHooksCalled) {
            return;
        }

        if (parent.prototype.callInitHooks) {
            parent.prototype.callInitHooks.call(this);
        }

        this._initHooksCalled = true;

        for (var i = 0, len = proto._initHooks.length; i < len; i++) {
            proto._initHooks[i].call(this);
        }
    };

    return NewClass;
};


// method for adding properties to prototype
cls.include = function (props) {
    nutil.extend(this.prototype, props);
};

// merge new default options to the Class
cls.mergeOptions = function (options) {
    nutil.extend(this.prototype.options, options);
};

// add a constructor hook
cls.addInitHook = function (fn) { // (Function) || (String, args...)
    var args = Array.prototype.slice.call(arguments, 1);

    var init = typeof fn === 'function' ? fn : function () {
        this[fn].apply(this, args);
    };

    this.prototype._initHooks = this.prototype._initHooks || [];
    this.prototype._initHooks.push(init);
};

module.exports = cls;