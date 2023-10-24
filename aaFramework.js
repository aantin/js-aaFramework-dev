"use strict"; // é
(function () {

    // Private:
    const privates = new WeakMap();
    const ENV = {
        MODULE_NAME: "aaFramework",
        PRODUCTION: true,
        THEMES: ["light", "dark"],
        DEFAULT_THEME: "light"
    };

    if (aa === undefined) { throw new Error("'"+ENV.MODULE_NAME+"' needs 'aaJS' to be called first."); }
    // ----------------------------------------------------------------
    // Style:
    aa.addStyleToScript(ENV.MODULE_NAME+".js", ENV.MODULE_NAME+".css");
    aa.addStyleToScript(ENV.MODULE_NAME+".js", "vendors/css/font-awesome-4.7.0/css/font-awesome.min.css");
    aa.addStyleToScript(ENV.MODULE_NAME+".js", "vendors/css/google-iconfont/material-icons.css");
    aa.addStyleToScript(ENV.MODULE_NAME+".js", "vendors/css/google-iconfont-aa.css");
    // ----------------------------------------------------------------
    // Public:
    aa.versioning.test({
        name: ENV.MODULE_NAME,
        version: "3.9.1",
        dependencies: {
            aaJS: "^3.1"
        }
    }, null, (err) => {
        document.body.appendChild(aa.html("div.dependencyError","Invalid dependencies",{
            style: "z-index: "+aa.getMaxZIndex()
        }));
        const dialog = function () {
            aa.gui.critical({
                title:  "Invalid dependencies",
                text:   (function (err) {
                    const dom = aa.html("div");
                    err.forEach(function (o,i) {
                        if (i) {
                            dom.appendChild(aa.html("br"));
                        }
                        let fieldset = aa.html("fieldset",aa.html("legend",o.name));
                        if (o.message) {
                            fieldset.appendChild(aa.html("div.red",o.message));
                        }
                        dom.appendChild(fieldset);
                        o.forEach(function (v,k) {
                            switch (k) {
                                case "name":
                                case "message":
                                    break;
                                default:
                                    fieldset.appendChild(aa.html("div","- "+k+": <b>"+v+"</b>"));
                                    break;
                            }
                        });
                    });
                    return dom;
                })(err)
            });
        }

        aa.gui.notif("Invalid dependencies", {
            type: "critical",
            actions: [
                {
                    // callback: dialog,
                    text: aa.lang.get("action.show"),
                    name: "aav_showDependenciesError",
                    on: {
                        execute: dialog
                    },
                    addToManager: false
                },
                {
                    type: "reset",
                    text: aa.lang.get("action.close"),
                    name: "aaf_",
                    addToManager: false
                }
            ]
        });
    });
    // ----------------------------------------------------------------
    // Commons:
    const commons = (() => {
        const commons = {
            accessors: {
                verifiers: {
                    publics:        aa.isObjectOf(value => !aa.isFunction(value)),
                    privates:       aa.isObjectOf(value => !aa.isFunction(value)),
                    read:           aa.isObject,
                    execute:        aa.isObject
                }
            }
        };
        Object.defineProperties(commons.accessors, {
            defaultValue: {
                get: () => {
                    return {
                        publics: {
                        },
                        privates: {
                            listeners: {}
                        },
                        read: {},
                        execute: {},
                    };
                }
            }
        });
        return commons;
    })();
    // ----------------------------------------------------------------
    // Prototypes:
    aa.prototypes = Object.freeze({
        events:         aa.event,
        hydrate:        (function () {
            const set = function (k, v) {
                const method = "set"+k.firstToUpper();
                if (aa.isFunction(this[method])) {
                    this[method].call(this, v);
                } else {
                    warn(`Method '${method}' not found`);
                }
            };
            return function (spec /*, startWith */) {
                /**
                 * @param {object} spec={}
                 * @param {array} startWith=[]
                 *
                 * @return {void}
                 */
                spec = arguments && arguments.length > 0 && aa.isObject(arguments[0]) ? arguments[0] : {};
                const startWith = arguments && arguments.length > 1 && aa.isArray(arguments[1]) ? arguments[1] : [];


                // Do first:
                startWith.forEach((key) => {
                    if (spec.hasOwnProperty(key)) {
                        set.call(this, key, spec[key]);
                        delete spec[key];
                    }
                });

                // Then:
                spec.forEach((v, k) => {
                    set.call(this, k, v);
                });
            };
        })(),
        mapFactory:     function () {
            const privates = new WeakMap();
            return Object.freeze({
                /**
                 * @param {any} that;
                 * @param {any} key;
                 *
                 * @return {any}
                 */
                get: function (that, key) {
                    aa.prototypes.verify({ key: aa.nonEmptyString })("key", key);
                    const data = privates.get(that, "data");
                    if (!data) {
                        return undefined;
                    }
                    return data[key];
                },

                /**
                 * @param {any} that;
                 * @param {String} key;
                 * @param {any} value;
                 *
                 * @return {void}
                 */
                set: function (that, key, value) {
                    aa.prototypes.verify({ key: aa.nonEmptyString })("key", key);
                    let data = privates.get(that, "data");
                    if (!data) {
                        data = {};
                    }
                    data[key] = value;
                    privates.set(that, data);
                }
            });
        },
        getters:        function (param) {
            /**
             * @param {Array|String} param
             */
            
            // Verify argument integrity:
            aa.prototypes.verify({ param: (key) => { return (aa.nonEmptyString(key) || aa.isArrayOfStrings(key)); } })("param", param);

            if (aa.isString(param)) {
                this.getters([param.trim()]);
            } else if (aa.isArray(param)) {
                param.forEach((key) => {
                    Object.defineProperty(this, key, {get: () => { return get(this, key); }})
                });
            }
        },
        initGetters:    function (list) {
            /**
             * @param {Array} list
             */
            aa.prototypes.verify({list: (arr) => { return (aa.isArray(arr) && arr.reduce((ok, item) => { return (aa.nonEmptyString(item) ? ok : false); }, true)); }})("list", list);
            list.forEach((key) => {
                Object.defineProperty(this, key, {get: () => { return get(this, key); }});
            });
        },
        dispatcher:     function (listeners) {
            aa.arg.test(listeners, aa.isObject(listeners) && listeners.verify({
                root: aa.nonEmptyString,
                names: aa.isArrayOfStrings,
            }, true), 0);

            return (eventName, data) => {
                aa.arg.test(eventName, aa.nonEmptyString, 0);

                if (!listeners.names.has(eventName)) {
                    warn(`Event '${eventName}' not known.`);
                } else {
                    aa.events.fire(`${listeners.root}:${this.id}:${eventName}`, data);
                }
            };
        },
        listener:       function (listeners) {
            aa.arg.test(listeners, aa.isObject(listeners) && listeners.verify({
                root: aa.nonEmptyString,
                names: aa.isArrayOfStrings
            }, true), 0);

            return (eventName, callback) => {
                aa.arg.test(eventName, aa.nonEmptyString, 0);
                aa.arg.test(callback, aa.isFunction, 1);

                if (listeners.names.has(eventName)) {
                    aa.events.on(`${listeners.root}:${this.id}:${eventName}`, callback);
                }
            };
        },
        initPrivates:   function (privates, thisPrivate) {
        },
        initSetters:    function (list) {
            /**
             * @param {Array} list
             */
            aa.prototypes.verify({list: (arr) => { return (aa.isArray(arr) && arr.reduce((ok, item) => { return (aa.nonEmptyString(item) ? ok : false); }, true)); }})("list", list);
            list.forEach((key) => {
                Object.defineProperty(this, key, {set: (value) => { set(this, key, value); }});
            });
        },
        setter: key => {
            return function (value) {
                aa.arg.test(value, privates.verifiers[key], `'${key}'`);
                this[key] = value;
            };
        },
        setters:        function (param) {
            /**
             * @param {Array|String} param
             */
            
            // Verify argument integrity:
            aa.arg.test(param, key => aa.nonEmptyString(key) || aa.isArrayOfStrings(key), `'param'`);
            // aa.prototypes.verify({ param: (key) => { return (aa.nonEmptyString(key) || aa.isArrayOfStrings(key)); } })("param", param);

            if (aa.isString(param)) {
                this.setters([param.trim()]);
            } else if (aa.isArray(param)) {
                param.forEach((key) => {
                    Object.defineProperty(this, key.trim(), {set: (value) => { set(this, key, value); }});
                });
            }
        },
        toObjectMaker:  function (keys) {
            if (!aa.isArray(keys)) { throw new TypeError("Argument must be an Object."); }

            return function () {
                return Object.freeze(keys.reduce((o, key) => {
                    o[key] = this[key];
                    return o;
                }, {}));
            };
        },
        toObject:       function () {
            const o = {};
            this.__public.forEach((v,k) => {
                o[k] = v;
            });
            return o;
        },
        toString:       function () {
            
            return JSON.stringify(this.toObject());
        },
        verify:         function (o) {
            if (!aa.isObject(o)) { throw new TypeError("Argument must be an Object."); }
            return function (key, value) {
                if (!aa.nonEmptyString(key) || !o.hasOwnProperty(key)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!aa.isFunction(o[key])) { throw new TypeError("Verifier must be a Function."); }
                if (!o[key](value)) { log({o : o, key: key, value: value}); throw new TypeError("'"+key.trim()+"' argument not verified."); }
                return true;
            };
        }
    });
    // ----------------------------------------------------------------
    // Functions:
    const {get, set} = aa.mapFactory();
    aa.definePublics        = function (keyValues /*, spec */) {
        const spec = arguments && arguments.length > 1 ? arguments[1] : {};

        if (!aa.isObject(keyValues)) { throw new TypeError('First argument must be an Object.'); }
        if (!aa.isObject(spec)) { throw new TypeError("second argument must be an Object."); }

        aa.arg.test(spec, aa.verifyObject({
            getter: aa.isFunction,
            setter: aa.isFunction,
        }), `'spec'`);
        spec.sprinkle({ get, set });

        const getter = spec.getter;
        const setter = spec.setter;

        keyValues.forEach((value, key) => {
            setter(this, key, value);
            Object.defineProperty(this, key, {
                get: () => {
                    return getter(this, key);
                },
                set: (value) => {
                    const setter = 'set'+key.firstToUpper();
                    if (typeof this[setter] === 'function') {
                        this[setter].call(value);
                    } else {
                        console.warn("Setter '"+key+"' not implemented.");
                    }
                }
            });
        });
    };
    aa.definePrivates       = function (keyValues /*, spec */) {
        const spec = arguments && arguments.length > 1 ? arguments[1] : {};

        if (!aa.isObject(keyValues)) { throw new TypeError('First argument must be an Object.'); }
        if (!aa.isObject(spec)) { throw new TypeError("second argument must be an Object."); }

        spec.verify({
            getter: aa.isFunction,
            setter: aa.isFunction,
        });

        const getter = spec.getter || get;
        const setter = spec.setter || set;

        keyValues.forEach((value, key) => {
            setter(this, key, value);
        });
    };
    // ----------------------------------------------------------------

    // Classes:
    aa.Action                   = (() => {
        const {get, set} = aa.mapFactory();
        function _(that) { return aa.getAccessor.call(that, {get, set}); }

        /**
         * Usage:
            action = new aa.Action(Object);
            ---
            action = new aa.Action();
            action.hydrate({
                callback: Function,
                callbacks: [Function, ...],
                icon: String src,
                name: String,
                priority: String 'normal', // ['low','normal','high']
                shortcut: String,
                text: String,
                tooltip: String,
                type: String, // ['submit','reset']
            });
         */
        function Action () {

            // Attributes:
            const accessors = {
                publics: {
                    accessible:     false,
                    app:            null,
                    checkable:      false,
                    checked:        false,
                    description:    null,
                    disabled:       false,
                    icon:           null,
                    name:           "anonymous-"+aa.uid(),
                    priority:       null,
                    text:           null,
                    tooltip:        null,
                    type:           null,

                    // Lists:
                    callbacks: [], // aa.deprecated
                    listeners: {}
                },
                privates: {
                    addToManager: true,
                    constructing: true,
                    nodesToListen: {}
                }
            };

            // Const:
            const allowedEvents = [
                "oncheckchange",
                "ondescriptionchange",
                "ondisable",
                "ondisablechange",
                "onenable",
                "onexecute",
                "oniconchange",
                "onprioritychange",
                "onshortcutchange",
                "ontextchange"
            ];
            const priorities = ["low", "normal", "high"];
            const types = ["information", "warning", "critical", "confirm", "reset"];
            const verifiers = {
                accessible:     aa.isBool,
                addToManager:   aa.isBool,
                app:            aa.nonEmptyString,
                checked:        aa.isBool,
                callback:       aa.isFunction,
                callbacks:      aa.isArrayOfFunctions,
                description:    aa.nonEmptyString,
                evtName:        aa.nonEmptyString,
                disabled:       aa.isBool,
                icon:           aa.nonEmptyString,
                name:           aa.nonEmptyString,
                on:             aa.isObject,
                priority:       aa.nonEmptyString,
                shortcut:       aa.nonEmptyString,
                text:           aa.nonEmptyString,
                tooltip:        aa.nonEmptyString,
                type:           aa.inArray(types)
            };
            let count = 0;

            // Private:
            const construct         = function(){
                /**
                 * @param {object} spec
                 * @param {bool} addToManager=true
                 *
                 * @return {void}
                 */

                aa.defineAccessors.call(this, accessors, {getter: get, setter: set});
                const that = _(this);

                that.constructing = true;
                initGetters.call(this);
                initListeners.call(this);

                // Add to manager:
                const addToManager = (arguments && arguments.length > 1 && aa.isBool(arguments[1]) ? arguments[1] : get(this, "addToManager"));
                this.setAddToManager(addToManager);
                
                // Hydrate:
                const spec = (arguments && arguments.length > 0 && aa.isObject(arguments[0]) ? arguments[0] : undefined);
                this.hydrate(spec, ["checkable"]);

                initAnonymous.call(this);
                that.constructing = false;
                this.addToManager();
                count += 1;
            };
            const _execute          = function (/* param */) {
                /**
                 * @param {any} param (optional)
                 *
                 * @return {void}
                 */
                const param = aa.arg.optional(arguments, 0, undefined);
                const that = _(this);

                if (!that.disabled) {
                    this.fire("execute", param);
                    that.callbacks.forEach(function (callback) {
                        if (!privates.get(aa.Action, "onceExecuteDeprecated")) {
                            const onceExecuteDeprecated = true;
                            accessors.privates.set(aa.Action, onceExecuteDeprecated);
                            aa.deprecated("aa.Action.callbacks");
                        }
                        callback(param);
                    });
                }
            };
            const _enable           = function (enabled=true) {
                /**
                 * @param {boolean} enabled=true
                 * @param {boolean} fire=true
                 * return void
                 */
                aa.arg.test(enabled, aa.isBool, "'enabled'");
                const that = _(this);

                this.setDisabled(!enabled);
                return !that.disabled;
            };
            const _disable          = function (disabled=true) {
                /**
                 * @param {boolean} disabled=true
                 * return void
                 */
                aa.arg.test(disabled, aa.isBool, "'disabled'");
                const that = _(this);
                this.setDisabled(disabled);
                return that.disabled;
            };
            const dispatch          = function (evtName, param) {
                const that = _(this);
                
                // Dispatch on listened nodes:
                evtName = "on"+evtName;
                const list = that.nodesToListen;
                if (list.hasOwnProperty(evtName)) {
                    list[evtName].forEach((listener) => {
                        listener.callback(listener.node, param);
                    });
                }
            };
            const initAnonymous     = function () {
                this.execute =  _execute.bind(this);
                this.enable =   _enable.bind(this);
                this.disable =  _disable.bind(this);
            };
            const initGetters       = function () {
                Object.defineProperties(this, {
                    shortcut: {
                        get: () => Object.freeze(getShortcut.call(this)),
                        set: shortcut => {
                            verify("shortcut", shortcut);
                            set(this, "shortcut", shortcut.trim());
                        }
                    },
                    shortcuts: {
                        get: () => Object.freeze(getShortcuts.call(this))
                    },
                });
            };
            const initListeners     = function () {
                const that = _(this);
                allowedEvents.forEach(function (evtName) {
                    that.listeners[evtName] ??= [];
                },this);
            };
            const getShortcut       = function () {
                const appName = this.app;
                const app = aa.events.app(appName);
                return (app?.getShortcutOf(this) ?? undefined);
            };
            const getShortcuts      = function () {
                const appName = this.app;
                const app = aa.events.app(appName);
                return (app?.getShortcutsOf(this) ?? []);
            };

            // Methods:
            aa.deploy(aa.Action.prototype, {

                // General:
                hydrate:         aa.prototypes.hydrate,
                addToManager:    function () {
                    const that = _(this);
                    if (that.addToManager) {
                        aa.actionManager.update(this);
                    }
                },
                /**
                 * @param {string} evtName="execute" (optional)
                 * @param {any} param=undefined (optional)
                 *
                 * @return {void}
                 */
                fire:            function (evtName="execute" /*, param */) {
                    aa.arg.test(evtName, aa.nonEmptyString, "'evtName'");
                    const param = arguments && arguments.length > 1 ? arguments[1] : undefined;
                    aa.arg.test(evtName, aa.nonEmptyString, `'evtName'`);
                    const that = _(this);

                    evtName = "on"+evtName.trim();
                    const listeners = that.listeners;
                    if (listeners.hasOwnProperty(evtName) && aa.isArray(listeners[evtName])) {
                        if (!(evtName === "onexecute" && that.disabled)) {
                            listeners[evtName].forEach(function (callback) {
                                callback(param);
                            });
                        }
                    }
                    if (param !== undefined && !(evtName === "onexecute" && that.disabled)) {
                        dispatch.call(this, evtName.replace(/^on/, ''), param);
                    }
                },
                hasCallback:        function (callback) {
                    const that = _(this);
                    return that.listeners.onexecute.has(callback);
                },
                isValid:         function () {
                    const that = _(this);
                    return (that.name !== null);
                },
                /**
                 * @param {element} node
                 * @param {string} evtName
                 * @param {function} callback
                 *
                 * @return {void}
                 */
                listenNode:      function (node, evtName, callback) {
                    aa.arg.test(node, aa.isElement, "'node'");
                    aa.arg.test(evtName, aa.inArray(allowedEvents), "'evtName'");
                    aa.arg.test(callback, aa.isFunction, "'callback'");
                    const that = _(this);

                    const list = that.nodesToListen;
                    if (!list.hasOwnProperty(evtName)) {
                        list[evtName] = [];
                    }
                    
                    list[evtName].push({
                        node: node,
                        callback: callback
                    });
                },
                /**
                 * If not already added, add a callback Function to Action's events listener.
                 *
                 * @param {string} evtName
                 * @param {function} callback
                 *
                 * return {boolean} true if callback could be added, false if already existed
                 */
                on:              function (evtName, callback) {
                    aa.arg.test(evtName, aa.nonEmptyString, "'evtName'");
                    aa.arg.test(callback, aa.isFunction, "'callback'");
                    const that = _(this);
                    let res = false;
                    
                    evtName = "on"+evtName.trim();
                    const listeners = get(this, "listeners");
                    if (!listeners.hasOwnProperty(evtName)) {
                        console.warn("Action's event listener '"+evtName+"' not implemented.");
                        return false;
                    }
                    if (!res && listeners.hasOwnProperty(evtName) && !listeners[evtName].has(callback)) {
                        listeners[evtName].push(callback);
                        res = true;
                    }
                    return res;
                },

                // Setters:
                get:             aa.prototypes.get,
                set:             aa.prototypes.set,
                setAccessible:   function (accessible=true) {
                    aa.arg.test(accessible, aa.isBool, "'accessible'");
                    const that = _(this);
                    that.accessible = accessible;
                    return accessible;
                },
                setAddToManager: function (addToManager) {
                    aa.arg.test(addToManager, verifiers.addToManager, "'addToManager'");
                    const that = _(this);
                    
                    that.addToManager = addToManager;
                    return addToManager;
                },
                setApp:          function (appName) {
                    aa.arg.test(appName, verifiers.app, "'appName'");
                    const that = _(this);

                    that.app = appName.trim();
                    return true;
                },
                setCheckable:    function (checkable) {
                    aa.arg.test(checkable, aa.isBool, "'checkable'");
                    const that = _(this);
                    
                    const change = (that.checkable !== checkable);
                    that.checkable = checkable;
                    if (!that.constructing && change) {
                        this.fire("checkablechange", checkable);
                    }
                    return checkable;
                },
                setChecked:      function (checked) {
                    aa.arg.test(checked, aa.isBool, "'checked'");
                    const that = _(this);

                    if (that.checkable) {
                        const change = (that.checked !== checked);
                        that.checked = checked;
                        if (!that.constructing && change) {
                            this.fire("checkchange", checked);
                        }
                    }
                    return bool;
                },
                setDescription:  function (description) {
                    aa.arg.test(description, verifiers.description, "'description'");
                    const that = _(this);

                    const change = (that.description !== description);
                    that.description = description;
                    if (!that.constructing && change) {
                        this.fire("descriptionchange", description);
                    }
                    return true;
                },
                /**
                 * @param {boolean} disabled
                 *
                 * @return {void}
                 */
                setDisabled:     function (disabled) {
                    aa.arg.test(disabled, verifiers.disabled, "'disabled'");
                    const that = _(this);

                    const change = (that.disabled !== disabled);
                    that.disabled = disabled;
                    if (!that.constructing && change) {
                        this.fire("disablechange", disabled);
                        this.fire((disabled ? "dis" : "en")+"able", disabled);
                    }
                    return that.disabled;
                },
                setCallback:     function (callback) {
                    aa.deprecated("aa.Action.callbacks");
                    aa.arg.test(callback, verifiers.callback, "'callback'");
                    const that = _(this);

                    that.listeners["onexecute"].push(callback); // now in 'onexecute' instead of in 'callbacks'
                    return true;
                },
                setCallbacks:    function (callbacks) {
                    aa.arg.test(callbacks, verifiers.callbacks, "'callbacks'");
                    return callbacks.forEach((callback) => {
                        this.setCallback(callback);
                    });
                },
                setIcon:         function (icon) {
                    aa.arg.test(icon, verifiers.icon, "'icon'");
                    const that = _(this);

                    const previous = that.icon;
                    const change = (previous !== icon);
                    that.icon = icon.trim();
                    if (!that.constructing && change) {
                        this.fire("iconchange", {
                            new: icon,
                            previous: previous
                        });
                    }
                    return true;
                },
                setName:         function (name) {
                    aa.arg.test(name, verifiers.name, "'name'");
                    const that = _(this);

                    that.name = name.trim();
                    return true;
                },
                setOn:           function (listeners) {
                    aa.arg.test(listeners, verifiers.on, "'listeners'");

                    const verifier = {};
                    allowedEvents.forEach((evtName) => {
                        evtName = evtName.replace(/^on/, "");
                        verifier[evtName] = aa.isFunction
                    });
                    if (!listeners.verify(verifier)) { throw new TypeError("'on' argument is not compliant."); }

                    listeners.forEach((callback, evtName) => {
                        this.on(evtName, callback);
                    });
                },
                setPriority:     function (priority) {
                    aa.arg.test(priority, verifiers.priority, "'priority'");
                    const that = _(this);

                    priority = priority.trim().toLowerCase();
                    if (priorities.has(priority)) {
                        const change = (that.priority !== priority);
                        that.priority = priority;
                        if (!that.constructing && change) {
                            this.fire("prioritychange", priority);
                        }
                        return true;
                    }
                },
                setText:         function (text) {
                    aa.arg.test(text, verifiers.text, "'text'");
                    const that = _(this);

                    const change = (that.text !== text);
                    that.text = text.trim();
                    if (!that.constructing && change) {
                        this.fire("textchange", text);
                    }
                    return true;
                },
                setTooltip:      function (tooltip) {
                    aa.arg.test(tooltip, verifiers.tooltip, "'tooltip'");
                    const that = _(this);

                    that.tooltip = tooltip.trim();
                    return true;
                },
                setType:         function (type) {
                    aa.arg.test(type, verifiers.type, "'type'");
                    const that = _(this);

                    that.type = type;
                    if (!that.icon) {
                        switch (type) {
                            case "critical":
                                this.setIcon("close");
                                break;
                            case "warning":
                                this.setIcon("exclamation");
                                break;
                            case "information":
                                this.setIcon("info");
                                break;
                            case "confirm":
                                this.setIcon("question");
                                break;
                        }
                    }
                },

                // Getters:
                getDomLi:        function () {
                    const that = _(this);

                    let li = aa.html('li');
                    li.innerHTML = this.getText();
                    if (that.tooltip) {
                        li.title = that.tooltip;
                    }
                    if (that.callbacks.length > 0) {
                        that.callbacks.forEach(function (callback) {
                            li.on('click',callback);
                        });
                    }
                    return li;
                },
                getDescription:  function () {
                    const that = _(this);
                    return that.description ?? that.name ?? "Action";
                },
                getText:         function () {
                    const that = _(this);
                    return that.text ?? that.name ?? "Action";
                },
                getTitle:        function () {
                    const that = _(this);
                    return that.title ?? that.name ?? "Action";
                },
                getCallbacks:    function () {
                    const that = _(this);
                    return that.listeners.onexecute;
                },
            }, {force: true, condition: aa.Action.prototype.hydrate === undefined});

            // Init:
            construct.apply(this, arguments);
        }
        return Action;
    })();
    (function () { /* aa.Action static */
        const verifiers = {
            appName: aa.nonEmptyString
        };

        /**
         * @param {String} appName
         * @param {Object|Array} builder
         *
         * @return {void}
         *
         * How to use:
            aa.Action.build(appName, {
                app: <String>,
                name: <String>,
                description: <String>, // optional
                <shortcut>: <Function>
            });
         */
        aa.Action.build = function (appName, builder) {
            aa.arg.test(appName, verifiers.appName, "'appName'");

            if (aa.isObject(builder)) {
                const shortcuts = [];
                const spec = {
                    app: appName,
                    name: null,
                    on: {}
                };
                Object.keys(builder).forEach((k) => {
                    if (builder.hasOwnProperty(k)) {
                        const v = builder[k];
                        if (aa.isFunction(v)) {
                            // Assume to be a shortcut/callback couple:
                            k = aa.shortcut.cmdOrCtrl(k);
                            shortcuts.push(k);
                            spec.on.execute = v;
                        } else {
                            switch (k) {
                                case "shortcut":
                                    shortcuts.push(v);
                                break;
                                case "shortcuts":
                                    if (aa.isArray(v)) {
                                        v.forEach((s) => {
                                            shortcuts.push(s);
                                        });
                                    }
                                break;
                                default:
                                    spec[k] = v;
                                break;
                            }
                        }
                    }
                });
                const action = new aa.Action(spec);
                if (action.isValid()) {
                    shortcuts.forEach((shortcut) => {
                        shortcut = aa.shortcut.cmdOrCtrl(shortcut);
                        if (aa.shortcut.isValid(shortcut)) {
                            action.setAccessible(true);
                        }
                        aa.events.app(appName).on(shortcut, action, ["preventDefault"]);
                    });
                    return true;
                }
                return false;
            } else if (aa.isArray(builder)) {
                return builder.reduce((ok, spec) => {
                    if (spec.app === undefined) {
                        spec.app = appName;
                    }
                    return (!aa.Action.build(appName, spec) ? false : ok);
                }, true);
            } else { throw new TypeError("Argument must be an Object or an Array of Objects."); }
        };
    })();
    aa.ActionGroup              = function () {

        // Attributes:
        const attributes = {
            label: "myLabel",
            collection: []
        };

        // Private methods:
        const construct     = function () {
            initDefault.call(this);
            this.hydrate.apply(this, arguments);
            initGetters.call(this);
        };
        const initDefault   = function () {
            attributes.forEach((value, key) => {
                set(this, key, value);
            });
        };
        const initGetters   = function () {
            attributes.keys().forEach((key) => {
                Object.defineProperty(this, key, {
                    get: () => { return Object.freeze(get(this, key)); }
                });
            });
        };

        // Public methods:
        aa.deploy(aa.ActionGroup.prototype, {

            // General:
            hydrate:        aa.prototypes.hydrate,
            isValid:        function () {
                return (
                    !!get(this, "label")
                );
            },

            // Setters:
            addAction:      function (action) {
                if (!(action instanceof aa.Action)) { throw new TypeError("Argument must be an Action."); }
                get(this, "collection").push(action);
            },
            setCollection:  function (collection) {
                const errors = [];
                const parse = (collection) => {
                    aa.arg.test(collection, aa.isArray, "'collection'");

                    const list = [];
                    collection.forEach((item) => {
                        if (item instanceof aa.ActionGroup && item.isValid()) {
                            list.push(item);
                        } else if (item instanceof aa.Action && item.isValid()) {
                            list.push(item.name);
                        } else if (aa.nonEmptyString(item)) {
                            list.push(item.trim());
                        } else if (item === null) {
                            list.push(null);
                        } else if (item === undefined) {
                            aa.deprecated("undefined as separator");
                            list.push(null);
                        } else { throw new TypeError("Argument not valid."); }
                    });
                    return list;
                };
                const group = parse(collection);
                if (errors.length) {
                    aa.gui.notification(errors.join("<br>"), {type: "warning"});
                } else {
                    set(this, "collection", group);
                }
            },
            setLabel:       function (str) {
                if (!aa.nonEmptyString(str)) { throw new TypeError("Argument must be a non-empty String."); }
                set(this, "label", str.trim());
            },

            // Getters:
        }, {force: true, condition: aa.ActionGroup.prototype.hydrate === undefined});

        // Instanciate:
        construct.apply(this, arguments);
    };
    aa.Collection               = (() => {
        const {get, set} = aa.mapFactory();
        function _ (that) { return aa.getAccessor.call(that, {get, set}); }

        /**
         * Usage:
         * new aa.Collection({
         *    authenticate: <function>, // a function that returns a boolean, used to verify each item integrity with the collection
         *    on: {
         *        added:          <function>, // a callback function that will be called after an item is added to the collection
         *        clear-before:   <function>, // a callback function that will be called before clearing the collection
         *        clear:          <function>, // a callback function that will be called after clearing the collection
         *        datamodified:   <function>, // a callback function that will be called after the collection is modified
         *        removed:        <function>  // a callback function that will be called after an item is removed from the collection
         *    },
         *    parent: <any>
         * });
         * 
         * @param {object} spec (optional)
         * 
         * @return {void}
         */
        function Collection (/* spec */) {
            aa.defineAccessors.call(this, {
                publics: {
                    authenticate:   null
                },
                privates: {
                    data: [],
                    listeners: {},
                },
                read: {
                    parent: null
                },
                execute: {
                    first:  () => get(this, "data").first,
                    last:   () => get(this, "data").last,
                    length: () => get(this, "data").length
                }
            }, { getter: get, setter: set });
            privates.construct.apply(this, arguments);
        }

        // Privates:
        const privates = {
            // Attributes:
            verifiers: {
                authenticate: aa.isFunction,
                on: aa.verifyObject({
                    added:    aa.isFunction,
                    clear:    aa.isFunction,
                    removed:  aa.isFunction
                }),
                parent: () => true
            },
            
            // Methods:
            construct:          function (/* spec */) {
                const spec = aa.arg.optional(arguments, 0, {}, aa.isObject);

                spec.sprinkle({ authenticate: aa.any });

                const that = _(this);
                let data = null;
                if (spec.hasOwnProperty('data')) {
                    // aa.throwErrorIf(!aa.isArrayLike(spec.data), "'data' attribute must be an Array-like.");
                    data = spec.data;
                    delete spec.data;
                }

                this.hydrate(spec);

                if (data) {
                    this.push(...data);
                }
            },
            emit:               aa.prototypes.events.getEmitter({get, set}, "listeners"),
        };

        // Publics:
        function methodFactory (methodName) {
            const func = function (callback /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = arguments.length > 1 ? arguments[1] : undefined;

                const that = _(this);
                return that.data[methodName]((item, i, list) => {
                    const isVerified = callback.call(thisArg, item, i, this);
                    if (aa.inEnum(
                        'every',
                        'filter',
                        'find',
                        'findIndex',
                        'findLastIndex',
                        'findReverse',
                        'includes',
                        'some',
                    )(methodName) && !aa.isBool(isVerified)) {
                        throw new TypeError(`Callback Function must return a Boolean.`);
                    }
                    return isVerified;
                }, thisArg);
            };
            Object.defineProperty(func, 'name', {
                get: () => methodName
            });
            return func;
        };
        function fromArrayPrototype (methodName) {
            const func = function () {
                const that = _(this);
                return that.data[methodName](arguments);
            };
            Object.defineProperty(func, 'name', {
                get: () => methodName
            });
            const obj = {};
            obj[methodName] = func;
            return obj;
        }
        aa.deploy(Collection.prototype, {
            forEach:            methodFactory('forEach'),
            loopThrough:        function (callback /*, spec */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const spec = aa.arg.optional(arguments, 1, {});
                
                const that = _(this);
                spec.sprinkle({context: undefined});
                
                return that.data.loopThrough((item, i, list) => {
                    return callback.call(spec.context, item, i, this);
                }, spec);
            },
            filter:             function (callback /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = arguments.length > 1 ? arguments[1] : undefined;

                const that = _(this);
                const spec = {};
                if (this.authenticate) {
                    spec.authenticate = this.authenticate;
                }
                const collection = new aa.Collection(spec);
                that.data.forEach((item, i) => {
                    const isVerified = callback.call(thisArg, item, i, this);
                    aa.throwErrorIf(!aa.isBool(isVerified), `Callback function must return a boolean.`);
                    if (isVerified) {
                        collection.push(item);
                    }
                });
                set(collection, `listeners`, get(this, `listeners`));
                return collection;
            },
            find:               methodFactory('find'),
            findIndex:          methodFactory('findIndex'),
            findLastIndex:      methodFactory('findLastIndex'),
            includes:           methodFactory('includes'),
            map:                methodFactory('map'),
            ...fromArrayPrototype('pop'),
            reduce:             function (callback, accumulator /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = aa.arg.optional(arguments, 2, undefined);

                const that = _(this);
                return that.data.reduce((accumulator, item, i, list) => {
                    return callback.call(thisArg, accumulator, item, i, this);
                }, accumulator, thisArg);
            },
            some:               methodFactory('some'),
            ...fromArrayPrototype('shift'),
            ...fromArrayPrototype('splice'),
            ...fromArrayPrototype('unshift'),

            // General:
            clear:              function () {
                // get(this, `data`).clear();
                const data = get(this, `data`);
                const items = this.toArray();
                privates.emit.call(this, `clear-before`, items);
                while (data.length > 0) {
                    data.remove(data[data.length - 1]);
                }
                privates.emit.call(this, `clear`, items);
                items.forEach(item => {
                    privates.emit.call(this, `removed`, item);
                });
                privates.emit.call(this, `datamodified`, this);
                return items;
            },
            copy:               function () {
                const that = _(this);
                return aa.Collection.fromArray(that.data, {
                    authenticate: that.authenticate
                });
            },
            has:                function (value) {
                const that = _(this);
                return (that.data.indexOf(value) > -1);
            },
            hydrate:            function (spec) {
                aa.arg.test(spec, aa.verifyObject(privates.verifiers), `'spec'`);
                aa.prototypes.hydrate.call(this, spec);
            },
            indexOf:            function (/* item, from */) {
                /**
                 * @param <any> item: The item to look for
                 * @param <int> from (optional): If given, zero-based index at which to start searching
                 * 
                 * @return <int>
                 */
                const that = _(this);
                return Array.prototype.indexOf.apply(that.data, arguments);
            },
            insertAt:           function (position, ...items) {
                /**
                 * @param <int> position
                 * @param <any> ...items: The items to add to the collection from 'position' parameter.
                 */
                const that = _(this);

                aa.arg.test(position, aa.isInt, "'position'");
                
                if (position < 0) {
                    position += that.data.length;
                }
                const args = [position, 0];
                items.forEach(item => {
                    aa.throwErrorIf(
                        (this.authenticate && !this.authenticate(item)),
                        "Invalid collection item."
                    );
                    args.push(item);
                });
                that.data.splice.apply(that.data, args);
                items.forEach(item => {
                    privates.emit.call(this, `added`, item);
                });
                privates.emit.call(this, `datamodified`, this);
            },
            join:               function () {
                return (
                    get(this, `data`).join.apply(this, arguments)
                );
            },
            on:                 aa.prototypes.events.getListener(get, "listeners"),
            push:               function (...items) {
                const that = _(this);

                items.forEach(item => {
                    aa.throwErrorIf(
                        (this.authenticate && !this.authenticate(item)),
                        "Invalid collection item."
                    );
                    that.data.push(item);
                    
                    const index = that.data.length - 1;
                    if (!this.hasOwnProperty(index)) {
                        Object.defineProperty(this, index, {
                            configurable:   true,
                            enumerable:     true,
                            get:            () => {
                                if (index >= that.data.length) { throw new Error(`Index is out of range.`); }
                                return that.data[index];
                            }
                        });
                    }
                    const attributes = {
                        nextItem: () => {
                            const index = this.indexOf(item);
                            return index === this.length - 1 ? undefined : this[index + 1];
                        },
                        previousItem: () => {
                            const index = this.indexOf(item);
                            return index === 0 ? undefined : this[index - 1];
                        }
                    };
                    Object.keys(attributes).forEach(key => {
                        if (aa.isObject(item) && !item.hasOwnProperty(key)) {
                            Object.defineProperty(item, key, {
                                get: attributes[key]
                            });
                        }
                    });
                    const lastIndex = that.data.length - 1;
                    if (!this.hasOwnProperty(lastIndex)) {
                        Object.defineProperty(this, lastIndex, {
                            configurable:   true,
                            enumerable:     true,
                            get:            () => that.data[lastIndex]
                        });
                    }
                    privates.emit.call(this, `added`, item);
                    privates.emit.call(this, `datamodified`, this);
                });
            },
            pushUnique:         function (...items) {
                const data = get(this, "data");
                items.forEach(item => {
                    if (data.indexOf(item) < 0) {
                        this.push(item);
                    }
                });
            },
            remove:             function (...items) {
                const removedItems = [];
                const data = get(this, "data");
                items.forEach(item => {
                    aa.throwErrorIf(
                        (this.authenticate && !this.authenticate(item)),
                        "Invalid collection item."
                    );
                    const index = data.indexOf(item);
                    if (index > -1) {
                        const removedItem = data.splice(index, 1);
                        if (removedItem.length) {
                            while (this.hasOwnProperty(this.length)) {
                                delete this[this.length]
                            }
                            privates.emit.call(this, `removed`, removedItem[0]);
                            privates.emit.call(this, `datamodified`, this);
                            removedItems.push(removedItem[0]);
                        }
                    }
                });
                if (data.length === 0) {
                    privates.emit.call(this, `clear`, []);
                }
                return removedItems;
            },
            reverse:            function () {
                const that = _(this);
                
                const spec = {};
                if (that.authenticate) { spec.authenticate = that.authenticate; }
                
                const newCollection = new aa.Collection(spec);
                that.data.forEachReverse(item => {
                    newCollection.push(item);
                });
                
                return newCollection;
            },
            sort:               function (func) {
                get(this, 'data').sort(func);
            },

            // Getters:
            toArray:            function () {
                return [...get(this, 'data')];
            },

            // Setters:
            setAuthenticate:    function (verifier) {
                aa.arg.test(verifier, aa.isFunction);
                set(this, "authenticate", value => {
                    const isVerified = verifier(value);
                    if (!aa.isBool(isVerified)) { throw new Error(`'authenticate' Function must return a Boolean.`); }
                    return isVerified;
                });
            },
            setOn:              function (listeners) {
            aa.arg.test(listeners, privates.verifiers.on, `'listeners'`);

            listeners.forEach((callback, eventName) => {
                this.on(eventName, callback);
            });
            },
            setParent:          function (parent) {

                set(this, "parent", parent);
            }
        }, {force: true});

        // Iterator:
        Collection.prototype[Symbol.iterator] = function* () {
            const that = _(this);
            for (let item of that.data) {
                yield item;
            }
        };

        // Static:
        aa.deploy(Collection, {
            fromArray: function (list /* spec */) {
                aa.arg.test(list, aa.isArray, `'list'`);
                const spec = aa.arg.optional(arguments, 1, {});

                const collection = new aa.Collection(spec);
                list.forEach(item => {
                    collection.push(item);
                });

                return collection;
            }
        }, {force: true});

        return Collection;
    })();
    aa.Event = (() => {
        /**
         * aa.Event = function (Function callback[, Array options(String)]);
         * 
         * @param {Function|aa.Action} actionOrCallback
         * @param {Array} options
         * @param {Object} spec (optional)
         */
        
        const privates = {
            construct: function (actionOrCallback /* , options, spec */) {
                const options = (arguments && arguments.length > 1 && privates.verifiers.options(arguments[1]) ? arguments[1] : undefined);
                const spec = (arguments && arguments.length > 2 ? arguments[2] : {});
                if (!aa.isObject(spec)) { throw new TypeError("Third argument must be an Object."); }

                const {app} = spec;

                if (app) {
                    this.setApp(app);
                }
                if (actionOrCallback) {
                    if (this.setActionOrCallback(actionOrCallback)) {
                        if (options) {
                            return this.setOptions(options);
                        }
                        return true;
                    }
                }
            },
            verifiers: {options: aa.isArrayOfStrings}
        };
        function Event(actionOrCallback, options /* , spec */) {
            // Attributes:
            this.action     = null;
            this.app        = null;
            this.module     = null;
            this.callback   = null;
            this.options    = {
                always:         false,  // always execute this Event on the LAST App added
                forever:        false,  // always execute this Event on EVERY Apps added
                // suspended:      false,
                preventDefault: false   // prevent default browser's execution
            };

            // static:
            let displayOnce = false;

            privates.construct.apply(this, arguments);
        }
        aa.deploy(Event.prototype, {

            // Methods:
            isValid:                function () {

                return (typeof this.callback === "function" || this.action instanceof aa.Action);
            },
            hasOption:              function (s) {
                if (!aa.nonEmptyString(s)) {
                    throw new TypeError("Argument must be a non-empty String.");
                }
                s = s.trim();
                return (this.options.hasOwnProperty(s) && this.options[s]);
            },
            run:                    function () {

                // this.suspended = false;
            },
            execute:                function () {
                if (this.isValid()) {
                    if (this.action) {
                        this.action.execute.apply(this.action, arguments);
                    } else if (this.callback) {
                        this.callback.apply(null, arguments);
                    }
                } else {
                    aa.gui.warn("Event not valid.");
                    warn("Event not valid:", this);
                }
            },
            isModule:               function (name) {
                aa.arg.test(name, aa.isNullOrNonEmptyString, `'name'`);
                if (aa.isString(name)) {
                    name = name.trim();
                }
                return (name === this.module);
            },
            
            // Setters:
            setApp:                 function (name) {
                aa.arg.test(name, aa.nonEmptyString, `'name'`);
                this.app = name.trim();
            },
            setActionOrCallback:    function (param) {
                if (aa.isFunction(param)) {
                    aa.deprecated('aa.Event.callback');
                    this.setActionOrCallback(new aa.Action({ on: {execute: param}}));
                    return true;
                } else if (param instanceof aa.Action && param.isValid) {
                    this.action = param;
                    return true;
                }
                return false;
            },
            setModule:              function (name) {
                aa.arg.test(name, aa.isNullOrNonEmptyString, `'name'`);
                if (aa.isString(name)) {
                    name = name.trim();
                }
                this.module = name;
            },
            setOptions:             function (options) {
                aa.arg.test(options, aa.isArrayOf(aa.nonEmptyString), `'options'`);

                options.forEach((option) => {
                    option = option.trim();
                    if (this.options.hasOwnProperty(option)) {
                        this.options[option] = true;
                        if (option === "forever") {
                            this.options.always = true;
                        }
                    }
                });
                return true;
            },
        }, {force: true});
        return Event;
    })();
    aa.EventApp = (() => {
        const {get, set} = aa.mapFactory();
        function _(that) { return aa.getAccessor.call(that, {get, set}); }

        const privates = {
            construct: function (app) {
                // aa.prototypes.initGetters.call(this, ['events']);
                return this.setApp(app);
            },
            verifiers: {
                appName: aa.nonEmptyString,
                callback: aa.isFunction,
                associableParam: (p) => { return (aa.isFunction(p) || ((p instanceof aa.Event || p instanceof aa.Action) && p.isValid()) || aa.nonEmptyString(p)); },
                callbackOrUndefined: (f) => { return (aa.isFunction(f) || f === undefined); },
                evtName: aa.nonEmptyString
            },
        };
        function EventApp (app) {
            
            // Attributes:
            aa.defineAccessors.call(this, {
                execute: {
                    name: () => get(this, 'app')
                },
                privates: {
                    app:    null,
                    module: null,
                    events: {},
                },
            }, {getter: get, setter: set});


            // Init:
            return privates.construct.apply(this, arguments);
        }

        // Public:
        aa.deploy(EventApp.prototype, {
            // Methods:
            associate:      function (evtName, param) {
                /**
                 * @param {String} evtName
                 * @param {aa.Action|Function|String} param
                 *
                 * @return {void}
                 */

                aa.arg.test(param, privates.verifiers.associableParam, "'param'");
                aa.arg.test(evtName, privates.verifiers.evtName, "'evtName'");

                const o = {};

                // Regular syntax:
                if (param instanceof aa.Event) {
                    o[evtName] = param;
                    this.listen(o);
                }
                
                // Other syntax:
                else if (aa.isFunction(param)) {
                    this.associate(evtName, new aa.Action({on: {execute: param}}));
                } else if (param instanceof aa.Action) {
                    this.associate(evtName, new aa.Event(param))
                } else if (aa.isString(param)) {
                    this.associate(evtName, aa.actionManager.get(evtName));
                }
            },
            cancel:         function (evtName, callback) {
                if (aa.isObject(evtName)) {
                    if (callback !== undefined) { console.warn("Second argument is ignored when first argument is an object."); }
                    
                    evtName.forEach((callback, name) => {
                        this.cancel(name, callback);
                    });
                    return;
                }

                aa.arg.test(evtName, privates.verifiers.evtName, "'evtName'");
                aa.arg.test(callback, privates.verifiers.callback, "'callback'");
                const that = _(this);

                const events = that.events;
                if (events.hasOwnProperty(evtName)) {
                    events[evtName].forEachReverse(event => {
                        aa.throwErrorIf(
                            !(event.action instanceof aa.Action),
                            "Event 'action' attribute must be an Action."
                        );
                        if (event.action.hasCallback(callback)) {
                            events[evtName].remove(event)
                        }
                    });
                }
            },
            dissociate:     function (evtName /*, param */) {
                /**
                 * @param {String} evtName
                 * @param {aa.Action|Function|String} param
                 *
                 * @return {void}
                 */
                aa.arg.test(evtName, privates.verifiers.evtName, "'evtName'");
                const param = aa.arg.optional(arguments, 1, undefined, privates.verifiers.associableParam);
                const that = _(this);

                const list = [];
                const events = this.getEvents(evtName);
                if (events) {
                    if (param) {
                        events.forEach((evt) => {

                            // Regular syntax:
                            if (param instanceof aa.Event) {
                                if (param !== evt) {
                                }
                            }

                            // Other syntax:
                            else if (aa.isFunction(param)) {
                                aa.deprecated("aa.Event.callback");
                                if (evt.callback === param) {
                                } else {
                                    list.push(evt);
                                }
                            } else if (param instanceof aa.Action) {
                                if (evt) {
                                    if (evt.callback === param.execute) {
                                        aa.deprecated("aa.Event.callback");
                                    } else if (evt.action === param) {
                                    } else {
                                        list.push(evt.callback);
                                    }
                                }
                            } else if (aa.isString(param)) {
                                aa.gui.todo("Dissociate with String", true);
                            }
                        });
                    }
                    that.events[evtName] = list;
                }
            },
            listen:         function (spec) {
                aa.arg.test(spec, aa.isObject, "'spec'");
                const that = _(this);

                spec.forEach((evt, evtName) => {
                    evtName = aa.shortcut.rename(evtName);
                    aa.arg.test(evtName, privates.verifiers.evtName, `'evtName'`);

                    evtName = aa.shortcut.cmdOrCtrl(evtName);
                    let pile = [];
                    if (evt instanceof aa.Event) {
                        pile.push(evt);
                    } else if(aa.isArray(evt)) {
                        aa.arg.test(evt, aa.isArrayOf(e => e instanceof aa.Event), `'evt'`);
                        evt.forEach(e => {
                            pile.push(e);
                        });
                    }
                    pile.forEach((event) => {
                        const events = that.events;

                        if (event.callback) {
                            aa.deprecated("aa.Event.callback");
                        }
                        event.setModule(that.module);
                        event.setApp(that.app);
                        if (!events.hasOwnProperty(evtName)) {
                            events[evtName] = [];
                        }
                        if (event === null) { log("this one is null"); }
                        events[evtName].push(event);
                    });
                });
                return true;
            },
            on:             function (evtName, callback, options=[]) {
                /**
                 * Usage:
                 *      // aa.EventApp.prototype.on(eventName, callback);
                 *      // aa.EventApp.prototype.on(eventName, callback, options);
                 *      // aa.EventApp.prototype.on({eventName: callback});
                 *      // aa.EventApp.prototype.on({eventName: callback}, options);
                 *
                 * @param {string} evtName (event name, aa' standard)
                 * @param {function|aa.Action} callback
                 * @param {array} options (Array of non-empty Strings)
                 *
                 * @return {object} this (=> chainable 'on' functions)
                 */

                aa.arg.test(options, aa.isArrayOfNonEmptyStrings, "'options'");
                options.pushUnique("preventDefault");

                // Recur in case of signature: aa.EventApp.prototype.on({eventName: callback} /*, options */);
                if (aa.isObject(evtName)) {
                    const listeners = evtName;
                    const options = callback ?? [];
                    listeners.forEach((func, name) => {
                        this.on(name, func, options);
                    });
                    return this;
                }

                aa.arg.test(evtName, privates.verifiers.evtName, "'evtName'");
                const that = _(this);

                const spec = {};
                evtName = aa.shortcut.cmdOrCtrl(evtName);
                if (aa.isFunction(callback)) {
                    spec[evtName] = new aa.Event((new aa.Action({
                        on: {execute: callback},
                        ...((() => (that.app?.name ? {app: that.app.name} : {}))()),
                    })), options);
                } else if (callback instanceof aa.Action) {
                    const action = callback;
                    spec[evtName] = new aa.Event(action, options);
                } else { throw new TypeError("Second argument must be a Function or an instance of <aa.Action>."); }
                this.listen(spec);
                return this;
            },
            forEachEvent:   function (callback) {
                aa.arg.test(callback, privates.verifiers.callback, "'callback'");
                const that = _(this);

                that.events.forEach(callback);
            },
            module:         function (mod) {
                aa.arg.test(mod, aa.isNullOrNonEmptyString, "'mod'");
                const that = _(this);

                if (aa.isString(mod)) {
                    that.module = mod.trim();
                }
                return this;
            },
            pop:            function (evt) {
                aa.arg.test(evt, privates.verifiers.evtName, "'evt'");
                const that = _(this);
                const events = that.events;
                events[evt]?.pop();
            },
            run:            function (evt) {},
            suspend:        function (param) {
                aa.arg.test(param, arg => aa.isArrayOfNonEmptyStrings(arg) || aa.nonEmptyString(arg), 'param');

                const toSuspend = [];
                if (aa.isString(param)) {
                    param = param.trim();
                    toSuspend.push(param);
                } else if(aa.isArray(param)) {
                    param.forEach((s) => {
                        toSuspend.push(s);
                    });
                }
                toSuspend.forEach((evtName) => {
                    evtName = aa.shortcut.cmdOrCtrl(evtName);
                    let o = {};
                    o[evtName] = new aa.Event(new aa.Action({on: {execute: function () {}}}),["preventDefault"]);
                    this.listen(o);
                });
                return this;
            },

            // Setters:
            setApp:         function (name) {
                aa.arg.test(name, privates.verifiers.appName, "'name'");
                const that = _(this);
                that.app = name.trim();
                that.module = null;
                return this;
            },

            // Getters:
            getEvents:      function (evtName) {
                if (evtName !== undefined && !privates.verifiers.evtName(evtName)) { throw new TypeError("Argument must be undefined or a non-empty String."); }

                const that = _(this);
                const events = that.events;

                if (aa.isString(evtName)) {
                    evtName = evtName.trim();
                    return events[evtName] ?? undefined;
                } else {
                    return events;
                }
            },
            getShortcutOf:  function (obj) {
                return this.getShortcutsOf(obj).first;
            },
            getShortcutsOf: function (obj) {
                const that = _(this);
                const db = new aa.Storage("custom");
                const shortcuts = [];

                // action's shortcut saved in DB:
                if (that.app === obj.app) {
                    db.load();
                    const data = db.select("shortcuts");
                    if (data) {
                        const app = data.find((list, name)=> name === that.app);
                        if (app && obj instanceof aa.Action) {
                            if (app[obj.name] && aa.isArray(app[obj.name])) {
                                return app[obj.name];
                            }
                        }
                    }
                }

                // else:
                that.events.forEach((events, evtName) => {
                    if (aa.shortcut.isValid(evtName)) {
                        events.forEach((evt) => {
                            if (obj instanceof aa.Event) {
                                if (evt === obj) {
                                    shortcuts.push(evtName);
                                }
                            } else if (obj instanceof aa.Action) {
                                if (evt.action === obj) {
                                    shortcuts.push(evtName);
                                }
                            }
                        });
                    }
                });
                return shortcuts;
            },

            // Aliases:
            resume:         EventApp.prototype.run,
            pause:          EventApp.prototype.suspend,
        }, {force: true});

        // Statics:
        aa.deploy(EventApp, {
            getCurrent: function () {
                return aa.events.app(aa.events.appNames.last);
            },
        }, {force: true});

        return EventApp;
    })();
    aa.EventResponse            = (() => {
        function EventResponse (/* type */) {
            privates.construct.apply(this, arguments);
        }
        const privates = {
            construct: function (/* type */) {
                const type = aa.arg.optional(arguments, 0, undefined, privates.verifiers.type);

                aa.defineAccessors.call(this, {
                    publics: {
                        type: null
                    },
                    privates: {
                        isPreventDefault: false,
                        isStopPropagation: false,
                    },
                }, {getter: get, setter: set});

                this.type = type;
            },
            verifiers: {
                type: aa.isNullOrNonEmptyString
            }
        };
        aa.deploy(EventResponse.prototype, {
            // Methods:
            preventDefault:     function (prevent=true) {
                aa.arg.test(prevent, aa.isBool);
                set(this, "isPreventDefault", prevent);
            },
            isPreventDefault:   function () {
                return get(this, "isPreventDefault");
            },
            stopPropagation:    function (stop=true) {
                aa.arg.test(stop, aa.isBool);
                set(this, "isStopPropagation", true);
            },
            isStopPropagation:   function () {
                return get(this, "isStopPropagation");
            },

            // Setters:
            setType:   function (type) {
                aa.arg.test(type, privates.verifiers.type, `'type'`);
                set(this, "type", type ? type.trim() : null);
            },
        }, {force: true});

        return EventResponse;
    })();
    aa.Parser                   = function () {
        this.content = null;

        if (typeof aa.Parser.replace === 'undefined') {
            // Methods:
            aa.Parser.prototype.replace     = function (mask,value) {
                if (this.content !== null) {
                    let regex = new RegExp('\\{\\{\\{\\s*'+mask+'\\s*\\}\\}\\}','g');
                    
                    this.content = this.content.split('{{{'+mask+'}}}').join(value);
                    this.content = this.content.split('{{{ '+mask+'}}}').join(value);
                    this.content = this.content.split('{{{'+mask+' }}}').join(value);
                    this.content = this.content.split('{{{ '+mask+' }}}').join(value);
                    // this.content = this.content.replace(regex,value);
                    return this;
                }
            };
            // Setters:
            aa.Parser.prototype.setContent  = function (content) {
                if (aa.isString(content)) {
                    this.content = content;
                }
                return this;
            };
            // Getters:
            aa.Parser.prototype.getContent  = function (content) {

                return this.content;
            };
        }

        // Magic:
        if (arguments && arguments.length) {
            this.setContent(arguments[0]);
        }
        // return this;
    };
    aa.Storage                  = function (table) {

        // Attributes:
        this.data = {};
        set(this, "table", null);

        // Magic:
        const construct     = function (table) {
            /**
             * @param {string} table
             *
             * @return {void}
             */
            setTable.call(this, table);
        };
        const getStorage    = function () {
            if (!this.isValid()) { throw new TypeError("Invalid DB."); }

            const str = localStorage.getItem("aa_DB_"+get(this, "table"));
            if (str) {
                return JSON.parse(str);
            }
            localStorage.setItem("aa_DB_"+get(this, "table"), JSON.stringify(this.data));
            return undefined;
        };
        const register      = function () {
            if (!this.isValid()) { throw new TypeError("Invalid DB."); }
            localStorage.setItem("aa_DB_"+get(this, "table"), JSON.stringify(this.data));
        };
        const reset         = function () {
            this.data = {};
            set(this, "table", null);
        };
        const setTable      = function (table) {
            if (!aa.nonEmptyString(table)) { throw new TypeError("Argument must be a non-empty String.");}
            set(this, "table", table.trim());
        };

        // Methods:
        aa.deploy(aa.Storage.prototype, {

            // General:
            clear:        function () {
                this.data = {};
                register.call(this);
            },
            destroy:      function () {
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }

                const name = "aa_DB_"+get(this, "table");
                reset.apply(this);
                if (localStorage.getItem(name)) {
                    localStorage.removeItem(name);
                }
            },
            insert:       function (key, value) {
                if (!aa.nonEmptyString(key)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }
                
                key = key.trim();
                this.data[key] = value;
                register.call(this);
            },
            isValid:      function () {

                return (get(this, "table") !== null);
            },
            load:         function () {
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }

                const data = getStorage.apply(this);
                if (data) {
                    this.data = data;
                }
            },
            remove:       function (key) {
                if (!aa.nonEmptyString(key)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }

                key = key.trim();
                if (this.data.hasOwnProperty(key)) {
                    delete this.data[key];
                    register.call(this);
                }
            },
            select:       function (key) {
                if (!aa.nonEmptyString(key)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }

                key = key.trim();
                return (
                    this.data.hasOwnProperty(key)
                    ? this.data[key]
                    : undefined
                );
            },
        }, {force: true, condition: aa.Storage.prototype.hydrate === undefined});

        // Instanciate:
        construct.apply(this, arguments);
    };

    // Variables:
    aa.zIndexMax = 0;
    aa.defaultLang = 'en';
    aa.jsFolder = null;
    aa.regex = new (function () {
        // Private:
        let __self = {
            email: new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
            url: /* by @diegoperini (https://gist.github.com/dperini/729294) */ new RegExp(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}) {3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}) {2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}) {2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])) {2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i)
        };

        // Magic:
        this.init = function () {
            this.getters();
        };

        // Getters:
        this.getters = function () {
            __self.forEach(function (v,k) {
                Object.defineProperty(this,k,{get: function () { return __self[k]; }});
            },this);
        };

        // Init:
        this.init.apply(this,arguments);
    })();

    const Builder               = Object.freeze(function () {

        // Attributes:
        const collection = {};
        
        // Magic:
        const construct   = function () {
            if (arguments && arguments.length) {
                this.hydrate(arguments[0]);
            }
        };
        Builder.prototype.hydrate     = aa.prototypes.hydrate;

        // Methods:
        if (Builder.prototype.set === undefined) {

            // General:
            Builder.prototype.set         = function (name, myClass) {
                if (!aa.nonEmptyString(name)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!aa.isFunction(myClass)) { throw new TypeError("Second argument must be a Class."); }

                name = name.trim();
                collection[name] = myClass;
                Object.defineProperty(this, name,{
                    get: () => {
                        return function () {
                            if (arguments && arguments.length) {
                                return new (collection[name])(arguments[0]);
                            } else {
                                return new (collection[name])();
                            }
                        };
                    }
                })
            };
        }

        // Instanciate:
        construct.apply(this, arguments);
    });
    aa.build                    = new Builder();

    // Modules:
    aa.actions = Object.freeze({
        disable:    function (actionName) {
            /**
             * @param <string|string[]> actionName: Name or list of names of action to disable
             */
            if (aa.isArray(actionName)) {
                actionName.forEach(name => {
                    aa.actions.disable(name);
                });
                return;
            }

            aa.action(actionName, action => {
                action.disabled = true;
            });
        },
        enable:     function (actionName) {
            /**
             * @param <string|string[]> actionName: Name or list of names of action to enable
             */
            if (aa.isArray(actionName)) {
                actionName.forEach(name => {
                    aa.actions.enable(name);
                });
                return;
            }

            aa.action(actionName, action => {
                action.disabled = false;
            });
        },
    });
    aa.actionManager            = new (function () {

        // Variables:
        let actions = {}; // collection
        let appName = 'aaFramework';
        const verifier = {
            action: (a) => { return (a instanceof aa.Action && a.isValid()); },
            actionName: aa.nonEmptyString,
            appName: aa.nonEmptyString,
            add: (a) => { return (verifier.action(a) || verifier.arrayOfActions(a)); },
            arrayOfActions: (arr) => { return (aa.isArray(arr) && arr.reduce((ok, a) => { return (!verifier.action(a) ? false : ok); }, true)); },
            remove: (p) => { return (verifier.actionName(p) || verifier.action(p)); },
            spec: aa.isObject
        };
        const verify = aa.prototypes.verify(verifier);

        // Functions:
        this.add    = function (a) {
            /**
             * @param {Action | array} a - can also be an Array of 'Action's
             */
            verify('add', a);
            if (a instanceof aa.Action) {
                if (a.isValid()) {
                    actions[a.name] = a;
                    return true;
                }
                return false;
            } else if(aa.isArray(a)) {
                let res = true;
                a.forEach(function (action) {
                    if (!this.add(action)) {
                        res = false;
                    }
                },this);
                return res;
            }
        };
        this.build  = function (specs, seasoning={}) {
            /**
             * @param <object>  specs: An object of objects for each spec to build as many Actions. The given object keys will be used as Action names.
             * @param <object>  seasoning: Attributes that will extend each spec.
             *      Default values:
             *      @key <bool>     accessible: true by default
             *      @key <string[]> options:    ['always']
             * 
             * @return <void>
             * 
             * Usage:
             * aa.actionManager({
             *      'my-action-name': {
             *          shortcut: 'ctrl+alt <Del>',
             *          on: {execute: () => {}}
             *      }
             * }, {
             *      app: 'myAppName',
             *      accessible: true, // true by default
             *      options: ['always']
             * });
             */
            aa.arg.test(specs, aa.isObjectOfObjects, "'specs'");
            aa.arg.test(seasoning, aa.isObject, "'seasoning'");

            const defaultValues = {
                accessible: true,
                options:    ['always']
            };

            specs.forEach((spec, name) => {
                let shortcut = null;
                let options = [];

                spec.name = name;
                spec.sprinkle(seasoning);
                spec.sprinkle(defaultValues);

                if (spec.shortcut) {
                    aa.arg.test(spec.shortcut, aa.nonEmptyString, "'shortcut'");
                    shortcut = spec.shortcut;
                    delete spec.shortcut;
                }
                if (spec.options) {
                    aa.arg.test(spec.options, aa.isArrayOfNonEmptyStrings, "'options'");
                    options = spec.options;
                    delete spec.options;
                }
                const action = new aa.Action(spec);
                if (shortcut) {
                    aa.events.app(appName).on(shortcut, action, options);
                }
            });
        };
        this.remove = function (p) {
            verify('remove', p);

            if (aa.isString(p)) {
                p = p.trim();
            } else if(p instanceof aa.Action) {
                p = p.name;
            }

            if (p && actions.hasOwnProperty(p)) {
                return delete actions[p];
            }
            return false;
        };
        this.update = function (a) {
            verify('action', a);

            this.remove(a);
            this.add(a);
        };

        // Getters:
        this.get    = function (p) {
            verify('actionName', p);

            p = p.trim();
            if (actions.hasOwnProperty(p)) {
                return actions[p];
            } else {
                return undefined;
            }
        };
        this.getFrom = function (spec) {
            verify('spec', spec);

            return actions.filter((action) => {
                return spec.reduce((ok, v, k) => {
                    return (action[k] === undefined || action[k] !== v ? false : ok);
                }, true);
            });
        };
        Object.defineProperty(this, 'actions', {
            get: () => { return ({}).sprinkle(actions); }
        });
    })();
    aa.blob                     = Object.freeze({   
        build: function (data) {
            /**
             * @param {any} data
             * @param {string} mimetype (optional)
             */
            let mimetype = (
                arguments && arguments.length>1
                ? arguments[1]
                : "text/plain;charset=utf-8" // default value
            );
            let i;
            let buf = new ArrayBuffer(data.length);
            let ia = new Uint8Array(buf);
            for (i=0; i<data.length; i++) {
                ia[i] = data.charCodeAt(i);
            }
            let blob = new Blob([ buf ], { type: mimetype });
            return blob;
        }
    });
    aa.browser                  = new (function () {

        // Attributes:
        const that = {
            cmd:    null,
            height: null,
            name:   null,
            os:     null,
            width:  null
        };

        const construct = function () {
            instance.getOS();
            instance.setCtrlKey();
            instance.onResize();

            [
                "Opera",
                "Konqueror",
                "Safari",
                "Firefox",
                "Netscape",
                "MSIE",
                "Chrome"
            ].forEach((name) => {
                if (navigator.userAgent.match(new RegExp(name))) {
                    that.name = name.toLowerCase();
                }
            });
            that.name = (that.name === "msie" ?
                "ie"
                : (that.name ?
                    that.name
                    : "unknown"
                )
            );
        };

        const fade = function (isFadeIn) {
            
            // Attributes:
            const delay = 10; // ms
            const delta = 0.1; // opacity (0~1)
            const timers = {};
            
            return function (node /*, resolve, reject */) {
                if (!aa.isNode(node)) { throw new TypeError("First argument must be a Node."); }
                const resolve = (arguments && arguments.length > 1 && aa.isFunction(arguments[1]) ? arguments[1] : undefined);
                const reject = (arguments && arguments.length > 2 && aa.isFunction(arguments[2]) ? arguments[2] : undefined);

                const id = node.dataset.aafadeid || node.id || aa.uid();
                node.dataset.aafadeid = id;
                
                let opacity = (isFadeIn ? 0 : 1);
                if (timers.hasOwnProperty(id) && timers[id]) {
                    window.clearInterval(timers[id]);
                }
                timers[id] = window.setInterval(() => {
                    if ((isFadeIn && opacity <= 1) || (!isFadeIn && opacity >= 0)) {
                        aa.browser.setOpacity(node, opacity);
                    } else {
                        opacity = (isFadeIn ? 1 : 0);
                        aa.browser.setOpacity(node, opacity);
                        if (isFadeIn) {
                            aa.browser.setOpacity(node, 1);
                            delete node.style.opacity;
                        }
                        window.clearInterval(timers[id]);
                        timers[id] = null;

                        if (resolve) {
                            resolve();
                        }
                    }
                    opacity += (delta*(isFadeIn ? 1 : -1));
                }, delay);
            }
        };
        const instance = {
            // Methods:
            is: function (s) {
                if (!aa.nonEmptyString(s)) { throw new TypeError("Argument must be a non-empty String."); }
                return (that.os === s);
            },
            fadeIn: fade(true),
            fadeOut: fade(false),

            // Setters:
            setCtrlKey: function () {
                switch (that.os) {
                    case "mac":
                        that.cmd = "cmd";
                        break;
                    default:
                        that.cmd = "ctrl";
                        break;
                }
            },
            setOpacity: function (node, value) {
                /**
                 * @param DOMElement node
                 * @param Number value (0~1)
                 */
                if (!aa.isNode(node)) { throw new TypeError("First argument must be a Node."); }
                if (!aa.isNumber(value)) { throw new TypeError("Second argument must be a Number."); }

                if (instance.is("ie")) {
                    node.style.filter = "alpha(opacity="+parseInt(value*100)+')';
                }
                else {
                    node.style.opacity = value;
                }
            },

            // Getters:
            getHeight:  function () {
                let height = 0;

                if (instance.is("firefox")) {
                    height = document.documentElement.scrollHeight;

                    // now IE 7 + Opera with "min window"
                    if (document.documentElement.clientHeight > height ) {
                        height  = document.documentElement.clientHeight;
                    }

                    // last for safari
                    if (document.body.scrollHeight > height) {
                        height = document.body.scrollHeight;
                    }
                }
                else {
                    if (aa.isNumber(window.innerHeight)) {
                        height = window.innerHeight;
                    }
                    else if( document.documentElement && document.documentElement.clientHeight ) {
                        height = document.documentElement.clientHeight;
                    }
                    else {
                        height = document.documentElement.scrollHeight-4;
                    }
                }

                return height;
            },
            getWidth:   function () {
                let width = 0;

                if (instance.is("firefox")) {
                    width = document.documentElement.scrollWidth;

                    // now IE 7 + Opera with "min window"
                    if (document.documentElement.clientWidth > width ) {
                        width  = document.documentElement.clientWidth;
                    }

                    // last for safari
                    if (document.body.scrollWidth > width) {
                        width = document.body.scrollWidth;
                    }
                }
                else {
                    if (aa.isNumber(window.innerWidth)) {
                        width = window.innerWidth;
                    }
                    else if( document.documentElement && document.documentElement.clientWidth ) {
                        width = document.documentElement.clientWidth;
                    }
                    else {
                        width = -4+document.documentElement.scrollWidth;
                    }
                }

                return width;
            },
            getOpacity: function (node) {
                if (node) {
                    try{
                        let test = node.innerHTML;
                    }
                    catch(e) {
                        throw new Error("- browser error : element introuvable.");
                        return false;
                    }
                    return (instance.is("ie") ?
                        parseInt(node.filters.alpha.opacity / 100)
                        : node.style.opacity
                    );
                }
                return undefined;
            },
            getOS:      function () {
                if (!that.os) {
                    let sys,
                        _os = window.navigator.appVersion.match(/^[^\(\)]+\((.+)$/),
                        systems = {
                            mac: ["mac"],
                            windows: ["win"],
                            linux: ["linux","x11"],
                            sun: ["sun"],
                            qnx: ["qnx"],
                            openbsd: ["openbsd"],
                            beos: ["beos"],
                            os2: ["os 2"],
                            search: ["nuhk","googlebot","yammybot","openbot","slurp","msnbot","ask jeeves","ia_archiver"],
                            mac: ["mac"]
                        };
                    if (_os && _os.length) {
                        _os = _os[1].toLowerCase();
                        systems.forEach((list, sys) => {
                            list.forEach((element) => {
                                let re = new RegExp('^'+element);
                                if (_os.match(re)) {
                                    that.os = sys;
                                }
                            });
                        });
                    }
                }
                return that.os;
            },

            // Events:
            onResize:   function () {
                let d = document;
                let root = d.documentElement;
                let body = d.body;
                
                // that.width  = window.innerWidth || root.clientWidth || body.clientWidth;
                // that.height = window.innerHeight || root.clientHeight || body.clientHeight;
                that.width = instance.getWidth();
                that.height = instance.getHeight();
            }
        };
        that.keys().forEach((key) => {
            Object.defineProperty(instance, key, {get: () => {
                if (that.hasOwnProperty(key) && that[key] !== null) {
                    return that[key];
                }
                const method = 'get'+key.firstToUpper();
                return instance[method]();
            }})
        });
        construct();

        return Object.freeze(instance);
    })();
    aa.events                   = new (function () {
            
        // Attributes:
        let timerShow = null;
        let timerFade = null;
        const db = new aa.Storage("custom");

        // Lists:
        this.appNames       = [];
        this.apps           = {};

        // Modules:
        this.custom = {
            click:      function (e) {
                let result = null;
                let chaine = [];
                e = window.event || e;
                
                chaine[1] = "click.Left";
                chaine[3] = "click.Right";

                if ([1, 3].has(e.which)) {
                    result = aa.events.execute(chaine[e.which], e);
                }
                
                if (result && result.isPreventDefault()) {
                    e.preventDefault();
                }
            },
            keyboard:   function (e) {
                let combinaison         = null;
                let touche              = '';
                let touches             = [];
                const allowLog          = true;
                const allowKeyCodeLog   = false;
                let result = new aa.EventResponse("keyboard");

                e = window.event || e;

                this.which          = e.which;
                this.intKeyCode     = e.keyCode;
                this.intAltKey      = e.altKey;
                this.intCtrlKey     = e.ctrlKey;
                this.intShiftKey    = e.shiftKey;
                this.intCmdKey      = e.metaKey;

                // Methods:
                // --------------------------
                this.log        = function (p) {
                    if (allowLog) {
                        log("keyboardEvent."+p);
                    }
                };
                this.logKeyCode = function () {
                    let txt = '';
                    
                    if (allowKeyCodeLog) {
                        if (this.intCmdKey) {
                            switch (aa.browser.os) {
                                case "mac":
                                    txt = '⌘'+txt;
                                    break;
                                default:
                                    txt += "<cmd> ";
                                    break;
                            }
                        }
                        if (this.intCtrlKey) {
                            switch (aa.browser.os) {
                                case "mac":
                                    txt = '^'+txt;
                                    break;
                                default:
                                    txt += "<ctrl> ";
                                    break;
                            }
                        }
                        if (this.intAltKey) {
                            switch (aa.browser.os) {
                                case "mac":
                                    txt = '⌥'+txt;
                                    break;
                                default:
                                    txt += "<alt> ";
                                    break;
                            }
                        }
                        if (this.intShiftKey) {
                            switch (aa.browser.os) {
                                case "mac":
                                    txt = '⇧'+txt;
                                    break;
                                default:
                                    txt += '<shift> ';
                                    break;
                            }
                        }
                        if (aa.inbetween(this.intKeyCode,65,90)) {
                            switch (aa.browser.os) {
                                case "mac":
                                    txt += String.fromCharCode(this.intKeyCode);
                                    break;
                                default:
                                    txt += '<'+String.fromCharCode(this.intKeyCode)+'>';
                                    break;
                            }
                        }
                        else {
                            txt += '#'+this.intKeyCode;
                        }
                        txt = "key: "+txt;
                        this.log(txt);
                    }
                };
                
                // Main :
                // --------------------------
                combinaison = aa.shortcut.get(e);

                if (combinaison) {
                    this.logKeyCode();
                    ((show) => {
                        if (show) {
                            clearTimeout(timerShow);
                            clearInterval(timerFade);
                            timerShow = null;
                            timerFade = null;

                            let div = el("aaFramework_eventLog");
                            if (div) {
                                div.removeNode();
                            }
                            div = aa.html("div#aaFramework_eventLog",{
                                style: "position: fixed; bottom: 0; right: 0; margin: 2px; padding: 4px 8px; background: #222; color: #0f8; border-radius: 4px;"
                            });
                            document.body.appendChild(div);
                            div.innerHTML = aa.shortcut.format(combinaison, ["htmlEncode", "simple"])
                                // .replace(/\</g,"&lt;")
                                // .replace(/\>/g,"&gt;")
                            ;
                            timerShow = setTimeout(() => {
                                timerFade = setInterval((() => {
                                    let i = 0;
                                    return () => {
                                        const div = el("aaFramework_eventLog");
                                        if (i<20) {
                                            if (div) {
                                                aa.browser.setOpacity(div, 1-(i/10));
                                            }
                                        } else {
                                            if (div) {
                                                div.removeNode();
                                            }
                                            clearTimeout(timerShow);
                                            clearInterval(timerFade);
                                            timerShow = null;
                                            timerFade = null;
                                        }
                                        i++;
                                    };
                                })(), 50);
                            }, 1000);
                        }
                    })(allowLog);
                    result = aa.events.execute(combinaison, e);
                }
                if (result && result.isPreventDefault()) {
                    e.preventDefault();
                }
            },
            mousewheel: function (e) {
                let result = null;
                let mouseWheel = e.wheelDelta || -e.detail;
                e = window.event || e;
                
                if (mouseWheel && mouseWheel>0) {
                    result = aa.events.execute("mousewheel.Up", e);
                }
                if (mouseWheel && mouseWheel<0) {            
                    result = aa.events.execute("mousewheel.Down", e);
                }
                
                if (result && result.isPreventDefault()) {
                    e.preventDefault();
                }
            }
        };
        const storage = {
            privates: {
                // Attributes:
                shortcuts: {
                    default: {}
                },

                // Methods:
                loadOnce: function () {
                    db.load();
                    delete storage.privates.loadOnce;

                    this.apps.forEach((app, appName) => {
                        app.forEachEvent((events, evtName) => {
                            events.forEach(event => {
                                const action = event.action;
                                if (action && action.isValid() && action.accessible) {
                                    storage.privates.shortcuts.default[appName] ??= {};
                                    storage.privates.shortcuts.default[appName][action.name] ??= [];
                                    storage.privates.shortcuts.default[appName][action.name].pushUnique(evtName);
                                }
                            });
                        });
                    });
                    let data = db.select("shortcuts");
                    if (data) {
                        data.forEach((actions, appName) => {
                            actions.forEach((shortcuts, actionName) => {
                                const action = aa.actionManager.get(actionName);
                                if (action && action.isValid() && action.accessible) {
                                    storage.privates.shortcuts.default[appName][action.name].forEach((shortcut) => {
                                        aa.events.app(appName).dissociate(shortcut, action);
                                    });

                                    shortcuts.forEach((shortcut) => {
                                        if (aa.shortcut.isValid(shortcut)) {
                                            aa.events.app(appName).on(shortcut, action);
                                        }
                                    });
                                }
                            });
                        });
                    }
                }
            },
            publics: {
                update: function (appName, action, oldShortcut, newShortcut) {
                    const apps = db.select("shortcuts") || {};
                    if (action instanceof aa.Action && action.isValid() && action.accessible) {
                        if (!apps.hasOwnProperty(appName)) {
                            apps[appName] = {};
                        }
                        const app = apps[appName];
                        if (!app.hasOwnProperty(action.name)) {
                            app[action.name] = storage.privates.shortcuts.default[appName][action.name];
                        }
                        if (app[action.name]) {
                            if (oldShortcut) {
                                app[action.name].remove(oldShortcut);
                            }
                            if (newShortcut && !app[action.name].has(newShortcut)) {
                                app[action.name].push(newShortcut);
                            }
                        }
                    }
                    db.insert("shortcuts", apps);
                }
            }
        };
        storage.publics.forEach((callback, key) => {
            if (this.storage === undefined) {
                this.storage = {};
            }
            this.storage[key] = (function (that) { return function () { callback.apply(that, arguments); }; })(this);
        });

        // Methods:
        this.fire               = function (eventName /*, *args */) {
            const args = arguments.reduce((args, arg, i) => {
                if (i > 0) {
                    args.push(arg);
                }
                return args;
            }, []);
            if (!aa.nonEmptyString(eventName)) { throw new TypeError("First argument must be a non-empty String."); }

            eventName = eventName.trim();
            const event = new CustomEvent(eventName, {detail: args});
            document.dispatchEvent(event);
        };
        this.on                 = function (eventName, callback) {
            if (aa.isObject(eventName)) {
                eventName.forEach((callback, evtName) => {
                    this.on(evtName, callback);
                });
                return this;
            }
            if (!aa.nonEmptyString(eventName)) { throw new TypeError("First argument must be a non-empty String."); }
            if (!aa.isFunction(callback)) { throw new TypeError("Second argument must be a Function."); }

            document.on(eventName.trim(), function (e) {
                const args = e.detail || undefined;
                callback.apply(null, e.detail);
            });
            return this;
        };
        this.app                = function () {

            let app = "";
            if (arguments && arguments.length) {
                if (aa.nonEmptyString(arguments[0])) {
                    app = arguments[0].trim();
                }
            }
            if (!this.appNames.has(app)) {
                this.appNames.push(app);
            }
            if (!this.apps.hasOwnProperty(app)) {
                this.apps[app] = new aa.EventApp(app);
            }
            return this.apps[app];
        };
        this.cancel             = function (shortcut /*, callback */) {
        };
        this.execute            = function (evtName /*, e */) {
            /**
             * @param {String} evtName
             * @param {aa.Event} e=undefined (optional)
             */
            if (!aa.nonEmptyString(evtName)) { throw new TypeError("First argument must be a non-empty String."); }
            const e = arguments && arguments.length>1 && arguments[1] instanceof Event ? arguments[1] : undefined;

            let app, evts;
            let response = new aa.EventResponse(e ? e.type : null);
            let returnValues = null;

            evtName = aa.shortcut.cmdOrCtrl(evtName);

            if (this.appNames.length) {

                // Execute 'forever' events:
                this.appNames.forEach((appName, i) => {
                    if (i < this.appNames.length-1) {
                        let app = this.apps[appName];
                        if (app instanceof aa.EventApp) {
                            evts = app.getEvents(evtName);
                            if (evts) {
                                evts.forEach((evt) => {
                                    if (evt instanceof aa.Event && evt.isValid() && evt.hasOption("forever")) {
                                        returnValues = evt.execute(response, e);
                                        if (evt.hasOption("preventDefault")) {
                                            response.preventDefault();
                                        }
                                    }
                                });
                            }
                        }
                    }
                });

                // Execute current app events:
                app = this.apps[this.appNames.getLast()];
                if (app instanceof aa.EventApp) {
                    evts = app.getEvents(evtName);
                    if (evts) {
                        let getReturnValues = function (evt, e) {
                            returnValues = evt.execute(response, e);
                            if (evt.hasOption("preventDefault")) {
                                response.preventDefault();
                            }
                        };

                        // Execute every 'always' event:
                        evts.filter((evt, i) => i < evts.length-1)
                            .forEach(evt => {
                                if (evt instanceof aa.Event && evt.isValid() && evt.hasOption("always")) {
                                    getReturnValues(evt, e);
                                }
                            });

                        // Then execute top event:
                        let evt = evts.last;
                        if (evt instanceof aa.Event && evt.isValid()) {
                            getReturnValues(evt, e);
                        }
                    }
                }
            }

            switch (evtName) {
                case "bodyload":
                    storage.privates.loadOnce?.apply(this);
                    break;
                
                case "windowunload":
                case "beforeunload":
                    // undefined will close without warning
                    // any other value will popup a warning before closing:
                    return returnValues;
                    break;
                
                default:
                    break;
            }

            return response;
        };
        this.removeApp          = function (app) {
            aa.arg.test(app, aa.nonEmptyString, "'app'")

            app = app.trim();
            // console.group('aa.events.remove('+app+')');
            if (this.appNames.has(app) && typeof this.apps[app] !== 'undefined') {
                this.appNames.remove(app);
                delete this.apps[app];
            }
            // console.groupEnd();
            return true;
        };
        this.restoreShortcuts   = function (appName) {
            const data = db.select("shortcuts");
            if (data) {
                if (data[appName]) {
                    const actions = data[appName];
                    actions.forEach((shortcuts, actionName) => {
                        const action = aa.actionManager.get(actionName);
                        if (action && action.isValid() && action.accessible) {
                            shortcuts.forEach((shortcut) => {
                                if (aa.shortcut.isValid(shortcut)) {
                                    aa.events.app(appName).dissociate(shortcut, action);
                                }
                            });
                            storage.privates.shortcuts.default[appName][actionName].forEach((shortcut) => {
                                if (aa.shortcut.isValid(shortcut)) {
                                    aa.events.app(appName).on(shortcut, action);
                                }
                            });
                        }
                    });
                    delete(data[appName]);
                }
            }
            db.insert("shortcuts", data);
        };

        // Getters
        this.getShortcut        = function (e) { // abstract
            aa.deprecated("aa.events.getShortcut");
            return aa.shortcut.get(e);
        };
        this.shortcutToString   = function (s) { // abstract 
            aa.deprecated("aa.events.shortcutToString");
            return aa.shortcut.format(s);
        };
    })();
    aa.file                     = Object.freeze(new (function () {
        const verifier = {
            content:        p => (aa.isObject(p) || aa.isString(p)),
            lastModified:   p => aa.isInt(p),
            name:           p => aa.isString(p),
            size:           p => aa.isInt(p),
            type:           p => aa.isString(p)
        };
        this.isValid    = function (file) {
            if (!aa.isObject(file)) { throw new TypeError("Argument must be an Object."); }
            const valid = (!file.find((v, k) => {
                return (
                    !verifier.hasOwnProperty(k)
                    || !verifier[k](v)
                );
            }));
            return (valid
                && (
                    (file.type === "application/json" && aa.isObject(file.content))
                    || aa.isString(file.content)
                )
            );
        };
        this.open       = function (/* resolve, reject, options */) {
            /**
             * How to use:
             * function (resolve) {}
             * function (resolve, options) {}
             * function (resolve, reject) {}
             * function (resolve, reject, options) {}
             * function (options, resolve, reject) {}
             * function (resolve, options, reject) {}
             *
             * First given function will be called as 'resolve'
             * Second given function will be called as 'reject'
             *
             * @param {function} resolve:
             *      @param {object} anonymous: {content, lastModified, name, size, type}
             *
             *      @return void
             * @param {function} reject (optional):
             *      @param {FileReader} anonymous
             *
             *      @return void
             * @param {object} options (optional: {base64, json, multiple})
             *
             * @return
             */

            if (!arguments || arguments.length < 1 || arguments.length > 3) {
                throw new Error("Function needs between 1 and 3 arguments.");
            }
            let i;
            let options = undefined;
            const functions = [];
            for (i=0; i<arguments.length; i++) {
                let arg = arguments[i];
                if (aa.isFunction(arg)) {
                    if (functions.length < 2) {
                        functions.push(arg);
                    } else {
                        throw new TypeError("Reject callback argument has already been given.");
                    }
                } else if(aa.isObject(arg)) {
                    if (options === undefined) {
                        options = arg;
                    } else {
                        throw new TypeError("Options argument has already been given.");
                    }
                }
            }
            if (functions.length === 0) {
                throw new TypeError("At least one function is needed as 'Resolve' callback.");
            }

            let resolve = functions[0];
            let reject = (
                functions && functions.length > 1
                ? functions[1]
                : function (r) {
                    console.warn("Rejected aa.file.open:", r);
                }
            );
            options = {
                base64: ((aa.isObject(options)
                    && options.base64 !== undefined
                    && aa.isBool(options.base64)
                ) ?
                    options.base64
                    : false
                ),
                json: ((aa.isObject(options)
                    && options.json !== undefined
                    && aa.isBool(options.json)
                ) ?
                    options.json
                    : false
                ),
                multiple: ((aa.isObject(options)
                    && options.multiple !== undefined
                    && aa.isBool(options.multiple)
                ) ?
                    options.multiple
                    : false
                )
            }
            let input = aa.html("file" ,{style: "display: none;", multiple: options.multiple});
            input.on("input", (function (options) {
                return function (event) {
                    if (event.target !== undefined && event.target.files !== undefined && event.target.files.length) {
                        // let i, file, reader;
                        const collection = [];
                        event.target.files.forEach((file) => {
                            collection.push(file);
                        });
                        const progress = new aa.gui.Progress({title: "Files loading..."});
                        progress.show();
                        collection.forEach((file) => {
                            if (file) {
                                progress.add(file.name);
                                const reader = new FileReader();
                                if (!reader) {
                                    reject(reader);
                                }
                                reader.on('load', (e) => {
                                    let content = e.target.result;
                                    progress.complete(file.name);
                                    if (content) {
                                        if (options.base64) {
                                            if(content.match(/^data\:text\/plain\;base64\,/)){
                                                content = content
                                                    .replace(/^data\:text\/plain\;base64\,/, '')
                                                    .replace('\n', '')
                                                    .base64Decode()
                                                ;
                                            }
                                        }
                                        if (options.json) {
                                            try{
                                                content = JSON.parse(content);
                                            }
                                            catch(e) {
                                                reject(reader);
                                                aa.gui.dialog("warning", {text: "Invalid JSON file."});
                                                throw new Error("Invalid JSON file.");
                                            }
                                        }
                                        resolve({
                                            content: content,
                                            lastModified: file.lastModified,
                                            name: file.name,
                                            path: file.path,
                                            size: file.size,
                                            type: file.type
                                        });
                                    }
                                    else {
                                        reject(reader);
                                    }
                                });
                                reader.on('progress', (e) => {
                                    progress.move(file.name, e.loaded/e.total);
                                });
                                reader.readAsText(file);
                            }
                        });
                        const doOnce = () => {
                            return;
                            if (collection.length) {
                                file = collection.shift();
                                if (file) {
                                    reader = new FileReader();
                                    if (!reader) {
                                        reject(reader);
                                    }
                                    reader.on('load', (e) => {
                                        let content = e.target.result;
                                        progress.complete();
                                        if (content) {
                                            if (options.base64) {
                                                if(content.match(/^data\:text\/plain\;base64\,/)){
                                                    content = content
                                                        .replace(/^data\:text\/plain\;base64\,/, '')
                                                        .replace('\n', '')
                                                        .base64Decode()
                                                    ;
                                                }
                                            }
                                            if (options.json) {
                                                try{
                                                    content = JSON.parse(content);
                                                }
                                                catch(e) {
                                                    reject(reader);
                                                    aa.gui.dialog("warning", {text: "Invalid JSON file."});
                                                    throw new Error("Invalid JSON file.");
                                                }
                                            }
                                            resolve({
                                                content: content,
                                                lastModified: file.lastModified,
                                                name: file.name,
                                                path: file.path,
                                                size: file.size,
                                                type: file.type
                                            });
                                        }
                                        else {
                                            reject(reader);
                                        }
                                        doOnce();
                                    });
                                    reader.on('progress', (e) => {
                                        progress.value = e.loaded/e.total;
                                    });
                                    reader.readAsText(file);
                                } else { 
                                    console.error("Failed to load file");
                                }
                            }
                        };
                        doOnce();
                        return;
                    }
                };
            })(options));
            input.click();
        };
        this.read       = function (file, resolve /*, reject */) {
            /**
             * @param {file} file
             * @param {function} resolve
             * @param {function} reject (optional)
             * 
             * @return {void}
             */
            aa.arg.test(file, file instanceof File, `'file'`);
            aa.arg.test(resolve, aa.isFunction, `'resolve'`);
            const reject = aa.arg.optional(arguments, 2, undefined, aa.isFunction);

            const task = () => {
                const reader = new FileReader();
                if (!reader && reject) {
                    reject();
                }
                reader.on('load', (e) => {
                    const content = e.target.result;
                    resolve(content);
                });
                reader.on('progress', (e) => {
                });
                try {
                    reader.readAsText(file);
                } catch(err) {
                    if (reject) {
                        reject(err);
                    }
                }
            };

            if (aa.gui && aa.gui.loading) {
                aa.gui.loading(task);
            } else {
                task();
            }
        }
        this.saveAs     = function (fileName, content /*, options */) {
            /**
             * @param {string} fileName
             * @param {string} content
             * @param {object} options {<bool> base64, <bool> utf8}
             *
             * @return {void}
             */

            aa.arg.test(fileName, aa.nonEmptyString, `'fileName'`);
            aa.arg.test(content, aa.isString, `'content'`);
            const options = aa.arg.optional(arguments, 2, {}, aa.verifyObject({
                base64: aa.isBool,
                mimetype: value => aa.isString(value) && !!value.match(/^[a-z0-9\-]+\/[a-z0-9\-]+$/i),
                utf8: aa.isBool
            }));
            options.sprinkle({
                mimetype: `text/plain`
            });

            if (options.base64) {
                const len = 64;
                let i,
                    j=0,
                    str = content.base64Encode();
                content = '';
                str = "data:text/plain;base64,"+str;
                for (i=0; i<str.length; i++) {
                    let c = str[i];
                    if(j >= len){
                        j = 0;
                        content += '\n';
                    }
                    content += c;
                    j++;
                }
            }

            const url = window.URL.createObjectURL(
                options.utf8 ?
                new Blob([content], {type: options.mimetype})
                : aa.blob.build(content)
            );
            const a = aa.html(`a`, {
                href: url,
                download: fileName
            });

            // Trigger 'click' Event:
            if (a.click) {
                a.click();
            } else if (MouseEvent) {
                let event = new MouseEvent("click", {});
                a.dispatchEvent(event);
            } else if (document.createEvent) {
                let event = document.createEvent("MouseEvents");
                event.initEvent("click", true, true); // aa.deprecated
                a.dispatchEvent(event);
            } else {
                // Don't know...
            }

            // Revoke URL Object:
            window.URL.revokeObjectURL(url);

            return;
        };
    })());
    aa.manufacture              = Object.freeze(function (Instancer, blueprint /*, accessors */) {
        /**
         * Build a constructor with publics, privates, static, etc properties.
         * 
         * Calling the 'construct' private method will call the following sequence:
         *      - define accessors
         *      - construct
         *      - hydrate
         *      : emit event 'hydrated'
         * 
         * Usage:
            const XXX = (() => {
                const {get, set} = aa.mapfactory();
                function XXX () { get(XXX, 'construct').apply(this, arguments); }
                function getAccessor (thisArg) { return aa.getAccessor.call(thisArg, {get, set}); }
                const blueprint = {
                    accessors: {
                        publics: {
                        },
                        privates: {
                        },
                    },
                    construct: function () {
                        const that = getAccessor(this);
                    },
                    methods: {
                        publics: {
                        },
                        setters: {
                        }
                    },
                    on: {
                        hydrated: function () {},
                    },
                    statics: {
                    },
                    verifiers: {
                    }
                };
                aa.manufacture(XXX, blueprint, {get, set});
                return XXX;
            })();
         */
        aa.arg.test(blueprint, aa.verifyObject({
            accessors:          aa.verifyObject(commons.accessors.verifiers),
            construct:          aa.isFunction,
            startHydratingWith: aa.isArrayOf(key => blueprint.accessors && blueprint.accessors.publics.hasOwnProperty(key)),
            methods:            aa.verifyObject({
                privates:       aa.isObjectOfFunctions,
                publics:        aa.isObjectOfFunctions,
                setters:        aa.isObjectOfFunctions
            }),
            on:                 aa.verifyObject({
                hydrated:       aa.isFunction
            }),
            statics:            aa.isObject,
            verifiers:          aa.isObject,
        }), `'blueprint'`);
        blueprint.sprinkle({
            accessors: commons.accessors.defaultValue,
            startHydratingWith: [],
            methods: {
                privates: {},
                publics:{},
                setters: {}
            },
            statics: {},
            verifiers: {}
        });

        // Verify property name duplications between attributes and methods:
        Object.keys(blueprint.methods)
        ?.filter(visibility => visibility !== 'setters')
        ?.forEach(methodVisibility => {
            blueprint.methods?.[methodVisibility]
            ?.forEach((callback, methodName) => {
                Object.keys(blueprint.accessors)
                ?.forEach(attributeVisibility => {
                    aa.throwErrorIf(
                        blueprint.accessors?.[attributeVisibility]?.hasOwnProperty(methodName),
                        `Property '${methodName}' must not be declared in both attributes and methods.`
                    );
                });
            });
        });

        const accessors = aa.arg.optional(arguments, 2, {}, aa.verifyObject({
            get: aa.isFunction,
            set: aa.isFunction,
        }));

        const getter = accessors.get ?? get;
        const setter = accessors.set ?? set;

        const emit = aa.event.getEmitter({get: getter, set: setter});

        // Define setters:
        Object.keys(blueprint.accessors.publics)
        .forEach(key => {
            if (blueprint.accessors.publics.hasOwnProperty(key)) {
                const methodName = `set${key.firstToUpper()}`;
                function method (value) {
                    // Verify value integrity:
                    aa.arg.test(
                        value,
                        value =>
                            !blueprint.verifiers
                            || !(blueprint.verifiers.hasOwnProperty(key))
                            || blueprint.verifiers[key].call(this, value),
                        `'${key}' setter`
                    );

                    // Emit onchange event:
                    const isDifferent = (value !== getter(this, key));
                    if (isDifferent) { emit.call(this, `${key.toLowerCase()}change`, value); }

                    // Set value:
                    if (blueprint?.methods?.setters.hasOwnProperty(key)) {
                        blueprint.methods.setters[key].call(this, value);
                    } else {
                        setter(this, key, value);
                    }

                    // Emit onchanged event:
                    if (isDifferent) { emit.call(this, `${key.toLowerCase()}changed`, value); }
                }

                // setter(this, methodName, method);
                Instancer.prototype[methodName] ??= method;
            }
        });

        // Constructor:
        setter(Instancer, `construct`, function (/* spec */) {
            const spec = aa.arg.optional(arguments, 0, {});

            aa.defineAccessors.call(this, blueprint.accessors, { getter, setter, verifiers: blueprint.verifiers });
            aa.definePrivateMethods.call(this, blueprint.methods?.privates, {get: getter, set: setter});

            blueprint.construct?.apply(this, arguments);
            
            this.hydrate(spec, blueprint.startHydratingWith);
        });

        function hydrator (key, value) {
            const methodName = `set${key.firstToUpper()}`;
            const method = getter(this, methodName) ?? this[methodName];
            if (aa.isFunction(method)) {
                method.call(this, value);
            }
        };

        // Public:
        const methods = Object.assign({
            hydrate:    function (/* spec, order */) {
                const spec = aa.arg.optional(arguments, 0, {}, aa.verifyObject(blueprint.verifiers));
                const order = aa.arg.optional(arguments, 1, [], list => aa.isArray(list) && list.every(key => Object.keys(blueprint.verifiers).has(key)));

                // First assign with starting keys:
                order
                .forEach((key) => { hydrator.call(this, key, spec[key]); });

                // Then assign remaining keys:
                Object.keys(spec)
                .filter(key => !order.has(key))
                .forEach(key => { hydrator.call(this, key, spec[key]); });

                // Emit event 'hydrated':
                emit.call(this, 'hydrated');
            },
            on:         aa.event.getListener({get: getter, set: setter})
        }, blueprint.methods.publics);
        aa.deploy(Instancer.prototype, methods, {force: true});

        // Static:
        aa.deploy(Instancer, blueprint.statics, {force: true});

        return Object.freeze({
            emitter: emit
        });
    });
    aa.gui                      = Object.freeze(new (function () {
        const {get, set} = aa.mapFactory();
        function _(that) { return aa.getAccessor.call(that, {get, set}); }
    
        // Attributes:
        const dialogs = []; // liste des <aa.gui.Dialog> ouvertes
        const dialogTypes   = Object.freeze(["information", "warning", "critical", "confirm", "prompt", "win", "loading", "shortcut"]);
        const reminders     = {};
        const transitionDuration = .2; // (s)
        const verify        = aa.prototypes.verify({
            appName: aa.nonEmptyString,
            boolean: aa.isBool,
            dialogType: (type) => { return (aa.nonEmptyString(type) && dialogTypes.has(type.trim().toLowerCase())); },
            message: aa.nonEmptyString,
            spec: aa.isObject
        });

        /**
         * Usage:
         *      // Initialzing the reminder messages:
         *      aa.gui.reminders.app('my-app-name').add('reminder-id', 'A message to display as a checkbox label');
         * 
         *      // Call a confirm modal window:
         *      aa.gui.confirm({
         *          text: 'The confirmation message',
         *          reminder: 'reminder-key',
         *          on: {submit: data => {}}
         *      });
         * 
         *      // GUI to edit the registered reminders:
         *      aa.reminders.edit();
         */
        const Reminders = function () {

            // Private attributes:
            const privates = {
                app: "undefined"
            }
            const db = new aa.Storage("aaDialog");

            // Methods:
            aa.deploy(Reminders.prototype, {
                add:    function (id, message) {
                    if (!aa.nonEmptyString(id)) { throw new TypeError("First argument must be a non-empty String."); }
                    if (!aa.nonEmptyString(message)) { throw new TypeError("Second argument must be a non-empty String."); }

                    this.app(privates.app);
                    reminders[privates.app][id] = message;
                    return this;
                },
                app:    function (app) {
                    if (!aa.nonEmptyString(app)) { throw new TypeError("Argument must be a non-empty String."); }

                    app = app.trim();
                    privates.app = app;
                    if (!reminders.hasOwnProperty(app)) {
                        reminders[app] = {};
                    }
                    return this;
                },
                edit:   function () {
                    const apps = reminders.keys();
                    apps.sortNatural();
                    const content = $$("div");
                    db.load();
                    const remindersInDB = db.select("reminders") || [];

                    apps.forEach(app => {
                        const fieldset = $$("fieldset", {
                            legend: app
                        });
                        content.appendChild(fieldset);
                        fieldset.appendChild($$("div", "Ask for my confirmation before:"));
                        const list = reminders[app].reduce((list, message, id) => {
                            list.push({id, message});
                            return list;
                        }, []);
                        list.sort((a, b) => {
                            a = a.message.toLowerCase();
                            b = b.message.toLowerCase();

                            return (a > b ?
                                1
                                : (a < b ?
                                    -1
                                    : 0
                                )
                            );
                        });
                        list.forEach(entry => {
                            const hidden = $$("checkbox.hidden", {
                                checked: remindersInDB.has(entry.id),
                                name: "doNotRemind[]",
                                value: entry.id
                            });
                            fieldset.appendChild(hidden);
                            fieldset.appendChild($$('div', aa.cook("checkbox", {
                                checked: !remindersInDB.has(entry.id),
                                label: entry.message,
                                name: "remind[]",
                                value: entry.id,
                                on: {input: (e) => {
                                    hidden.checked = !e.target.checked;
                                }}
                            })));
                        });
                        return;
                        const descriptions = [];
                        reminders[app].forEach((desc, id) => {
                            descriptions.push(desc);
                        });
                        descriptions.sortNatural();
                        descriptions.forEach((desc) => {
                            const id = reminders[app].reduce((acc, txt, id) => { return txt === desc ? id : acc; }, null);
                            if (id) {
                                const hidden = $$("checkbox.hidden", {
                                    checked: remindersInDB.has(id),
                                    name: "doNotRemind[]",
                                    value: id
                                });
                                fieldset.appendChild(hidden);
                                fieldset.appendChild(aa.cook("checkbox", {
                                    checked: !remindersInDB.has(id),
                                    label: desc,
                                    name: "remind[]",
                                    value: id,
                                    on: {input: (e) => {
                                        hidden.checked = !e.target.checked;
                                    }}
                                }));
                            }
                        });
                    });

                    aa.gui.win({
                        title: "User confirmation",
                        text: content,
                        buttons: false,
                        on: {submit: (data) => {
                            data.doNotRemind = data.doNotRemind || [];
                            db.insert("reminders", data.doNotRemind);
                        }}
                    });
                }
            });
        };
        Object.defineProperty(this, "reminders", {
            get: function () {
                return new Reminders();
            }
        });

        // Private methods:
        const shortcutMaker = function (appName) {
            const shortcuts = {};
            if (appName) {
                aa.events.app(appName).getEvents().forEach((events, evtName) => {
                    events.forEach((event) => {
                        const action = event.action;
                        if (action.accessible) {
                            shortcuts[action.name] = aa.shortcut.format(evtName, ["simple"]);
                        }
                    });
                });
            }
            return function (action) {
                if (!(action instanceof aa.Action)) { throw new TypeError("Argument must be an 'aaAction'."); }
                return (shortcuts.hasOwnProperty(action.name) ?
                    shortcuts[action.name]
                    : undefined
                );
            };
        };
        const parse = function (arr, shortcut /*, callback */) {
            aa.arg.test(arr, aa.isArray, 0);
            aa.arg.test(shortcut, aa.isFunction, 1);
            const callback = aa.arg.optional(arguments, 2, undefined);

            if (callback !== undefined && !aa.isFunction(callback)) { throw new TypeError("Third argument must be a Function."); }

            let tops = [];

            const explore = function (arr, shortcut, callback, top) {
                const menu = $$("ul");
                let index = (top === true ? undefined : top);
                arr.forEach((entry, i) => {
                    if (entry instanceof aa.ActionGroup && entry.isValid()) {
                        const button = $$("button", '<span class="icon fa fa-fw"></span> '+entry.label);
                        const item = $$("li", button);
                        item.classList.add("expand");
                        item.classList.add("shortcut");
                        item.on('mouseover', e => { button.focus(); });
                        menu.appendChild(item);
                        if (top === true) {
                            tops[i] = item;
                            index = i;
                        }
                        if (entry.collection.length) {
                            item.appendChild(explore(entry.collection, shortcut, callback, index));
                        } else {
                            item.classList.add("disabled");
                        }
                    } else if (aa.nonEmptyString(entry) || entry instanceof aa.Action) {
                        const action = (aa.nonEmptyString(entry) ?
                            aa.action(entry)
                            : entry
                        );
                        if (action instanceof aa.Action && action.isValid()) {
                            if (index !== null) {
                                action.on("execute", () => {
                                    const top = tops[index];
                                    if (top) {
                                        top.classList.add("flash");
                                        setTimeout(() => {
                                            top.classList.remove("flash");
                                        }, 100);
                                    }
                                });
                            }
                            const item = $$("li");
                            if (shortcut(action)) {
                                item.dataset.shortcut = shortcut(action);
                                item.classList.add("shortcut");
                            }
                            item.classList[(action.disabled || !action.listeners.onexecute.length ? "add" : "remove")]("disabled");
                            const icon = (action.checkable ?
                                (action.checked ?
                                    ".fa-check.checked"
                                    : ''
                                )
                                : (action.icon ?
                                    ".fa-"+action.icon
                                    : ''
                                )
                            );
                            const type = (action.type ?
                                '.'+action.type
                                : ''
                            );
                            if (action.callbacks.length > 0) {
                                aa.deprecated("action.callbacks");
                            }
                            const span = $$("span"+".icon.fa.fa-fw"+icon+type);
                            const btn = $$("button", span, {
                                disabled: action.disabled
                            });
                            btn.innerHTML += ' '+(action.text ? action.text : action.name);
                            btn.on("click", (e) => {
                                if (callback) {
                                    callback();
                                }
                                if (!action.disabled) {
                                    action.listeners.onexecute.forEach((func) => {
                                        func(e);
                                    });
                                }
                            });
                            btn.on('mouseover', e => { btn.focus(); });
                            action.on('disablechange', disabled => { btn.disabled = action.disabled; });
                            
                            item.appendChild(btn);
                            menu.appendChild(item);

                            if (action.checkable) {
                                action.listenNode(btn, "oncheckchange", (node, checked) => {
                                    node.firstChild.classList[checked ? "add" : "remove"]("fa-check");
                                    node.firstChild.classList[checked ? "add" : "remove"]("checked");
                                });
                            } else {
                                action.listenNode(btn, "oniconchange", (node, icon) => {
                                    const span = node.firstChild;
                                    span.classList.remove("fa-"+icon.previous);
                                    span.classList.add("fa-"+icon.new);
                                });
                            }
                            action.listenNode(item, "ondisablechange", ((action) => {
                                return (node, disabled) => {
                                    node.classList[(disabled || !action.listeners.onexecute.length ? "add" : "remove")]("disabled");
                                };
                            })(action));
                        } else {
                            console.warn(`Invalid Action${aa.nonEmptyString(entry) ? ` '${entry}'` : ''}.`);
                        }
                    } else if (entry === null) {
                        menu.appendChild($$("hr"));
                    }
                });
                return menu;
            };
            return explore(arr, shortcut, callback, true);
        };

        // Classes:
        this.Menu           = (function () {

            // Private variables:
            const emit = aa.prototypes.events.getEmitter({get, set});
            const construct = function () {
                this.setTheme(aa.settings.theme);
                aa.events.on('themechange', (theme) => {
                    this.setTheme(theme);
                });
                if (arguments && arguments.length) {
                    this.hydrate(arguments[0]);
                }
            };
            const Menu      = function () {

                // Attributes:
                aa.defineAccessors.call(this, {
                    publics: {
                        appName: null,
                        items:  [],
                        theme:  null
                    },
                    privates: {
                    },
                }, {getter: get, setter: set});

                // Instanciate:
                construct.apply(this, arguments);
            };

            // Public:
            aa.deploy(Menu.prototype, {
                hydrate:    aa.prototypes.hydrate,
                on:         aa.prototypes.events.getListener({get, set}),

                // Setters:
                addActions: function (list) {
                    if (!aa.isArray(list)) { throw new TypeError("Argument must be a collection of actions."); }

                    return list.forEach(function (a) {
                        return this.addAction(a);
                    }, this);
                },
                addAction:  function (p) {
                    if (aa.nonEmptyString(p)) {
                        p = p.trim();
                        if (p.match(/^[a-zA-Z0-9\_\.\s\-\(\)]+$/)) {
                            get(this, "items").push(p);
                        }
                    } else if (p instanceof aa.ActionGroup) {
                        get(this, "items").push(p);
                    } else if (p instanceof aa.Action && p.isValid()) {
                        get(this, "items").push(p.name);
                    } else if (p === null || p === undefined) {
                        this.addSep();
                    } else {
                        throw new TypeError("Invalid Action argument.");
                    }
                },
                addSep:     function () {
                    get(this, "items").push(null);
                },
                reset:      function () {
                    set(this, "items", []);
                },
                setAction:  function (a) {
                    this.reset();
                    this.addAction(a);
                },
                setActions: function (list) {
                    this.reset();
                    this.addActions(list);
                },
                setAppName: function (str) {
                    verify("appName", str);
                    set(this, "appName", str.trim());
                },
                setOn:      function (eventName, callback) {
                    /**
                     * Usage:
                     * (new ContextMenu()).on(<string> eventName, <function callback>);
                     * (new ContextMenu()).on({
                        * <string> eventName: <function callback>
                     * });
                     * 
                     * @param {string|object} eventName
                     * @param {function} callback
                     * 
                     * @return {void}
                     */
                    aa.throwErrorIf(
                        aa.isObject(eventName) && callback !== undefined,
                        `Invalid call syntax.`,
                        TypeError
                    )

                    // Call for each entry:
                    if (aa.isObject(eventName)) {
                        const listeners = eventName;
                        listeners.forEach((callback, evtName) => {
                            this.on(evtName, callback);
                        });
                        return;
                    }

                    // Call on single entry:
                    this.on.apply(this, arguments);
                },
                setTheme:   function (p) {
                    if (!aa.nonEmptyString(p)) { throw new TypeError("Argument must be a non-empty String."); }

                    p = p.trim();
                    if (ENV.THEMES.has(p)) {
                        set(this, "theme", p);
                    }
                },

                // Getters:
                getNode:    function () {
                    const shortcut = shortcutMaker(get(this, "appName"));

                    const menu = $$("div.aaMenu", parse(get(this, "items"), shortcut, this.hide));
                    
                    // Theme:
                    menu.classList.add(get(this, "theme"));
                    aa.events.on('themechange', (theme, previous) => {
                        menu.classList.remove(previous);
                        menu.classList.add(theme);
                    });

                    menu.children.forEach((ul) => {
                        ul.children.forEach((li) => {
                            li.children.forEach((btn) => {
                                btn.children.forEach((span) => {
                                    if (span.classList.contains("icon")) {
                                        // span.classList.remove("fa");
                                        // span.classList.remove("fa-fw");
                                        span.removeNode();
                                    }
                                });
                            });
                        });
                    });
                    return menu;
                },
                toObject:   function () {
                    const o = ["appName", "theme", "items"].reduce((o, key) => {
                        o[key] = get(this, key);
                        return o;
                    }, {});
                    // o.actions = get(this, "items");
                    return Object.freeze(o);
                },
            }, {force: true});

            return Object.freeze(Menu);
        })();
        this.ContextMenu    = (function () {
            const {get, set} = aa.mapFactory();
            function _(that) { return aa.getAccessor.call(that, {get, set}); }

            // Closure private methods:
            const view = {
            };
            const privates = {
                construct: function (/* spec */) {
                    const spec = aa.arg.optional(arguments, 0, {});

                    const that = _(this);

                    set(this, "theme", aa.settings.theme);
                    aa.events.on('themechange', (theme) => {
                        set(this, "theme", theme);
                    });
                    if (aa.isObject(spec)) {
                        if (spec.hasOwnProperty("on")) {
                            this.setOn(spec.on);
                            delete spec.on;
                        }
                        if (spec.hasOwnProperty("top")) {
                            this.setTop(spec.top);
                            delete spec.top;
                        }
                        if (spec.hasOwnProperty("left")) {
                            this.setLeft(spec.left);
                            delete spec.left;
                        }
                    }
                    set(this, "menu", new aa.gui.Menu(spec));
                    aa.prototypes.initGetters.call(this, ["theme", "appName", "items"]);

                    that.view = view.bind(this);
                },
                emit: aa.prototypes.events.getEmitter({get, set}),
            };
            const ContextMenu   = function () {

                // Attributes:
                aa.defineAccessors.call(this, {
                    publics: {
                        top:    null,
                        left:   null,
                    },
                    privates: {
                        activeElement:  null,
                        onclickout:     null,
                        menu:           null,
                        node:           null,
                        theme:          null,
                        view:           null
                    },
                }, {getter: get, setter: set});

                // Instanciate:
                privates.construct.apply(this, arguments);
            };
            Object.defineProperties(privates, {
                currentContextMenu: {
                    get: () => get(privates, 'currentContextMenu'),
                    set: instance => {
                        aa.arg.test(instance, aa.instanceof(ContextMenu), "'instance'");
                        set(privates, 'currentContextMenu', instance);
                    }
                }
            });

            // Public:
            aa.deploy(ContextMenu.prototype, {
                on:     aa.prototypes.events.getListener({get, set}),

                hide:   function () {
                    const that = _(this);
                    if (that.node) {
                        aa.events.removeApp("aaContextMenu");
                        that.node.removeNode();
                        that.node = null;
                        document.body.classList.remove('aaContextMenuFreeze');
                        if (that.onclickout) {
                            document.body.cancel(`click`, that.onclickout);
                        }
                        that.activeElement?.focus();
                        privates.emit.call(this, `hide`);
                    }
                },
                show:   function () {
                    const that = _(this);

                    privates.currentContextMenu?.hide();
                    privates.currentContextMenu = this;

                    that.activeElement = document.activeElement;
                    that.activeElement?.blur();

                    that.onclickout = e => {
                        if (!aa.isOver(e, "#aaContextMenu")) {
                            // e.stopPropagation();
                            this.hide();
                        }
                    };
                    document.body.on('click', that.onclickout);
                    document.body.on('contextmenu', that.onclickout);
                    
                    this.hide();

                    aa.wait(10, () => {
                        const menu = get(this, "menu");
                        const shortcut = shortcutMaker(get(this, "appName"));

                        // const dom = $$("div#aaContextMenuBG.aa.bg");
                        that.node = $$("div#aaContextMenu", parse(menu.items, shortcut, this.hide.bind(this)));

                        // Theme:
                        const theme = get(this, 'theme');
                        that.node.classList.add(theme);
                        aa.events.on('themechange', (theme, previous) => {
                            that.node.classList.remove(previous);
                            that.node.classList.add(theme);
                        });

                        that.top ??= aa.mouse.y;
                        that.left ??= aa.mouse.x;

                        that.node.style.display = "block";
                        that.node.style.top = `${that.top}px`;
                        that.node.style.left = `${that.left+4}px`;
                        that.node.style.zIndex = aa.getMaxZIndex();
                        document.body.appendChild(that.node);
                        document.body.classList.add('aaContextMenuFreeze');
                        
                        const escape = new aa.Action({
                            app: 'aaContextMenu',
                            accessible: true,
                            on: {execute: () => {
                                this.hide();
                            }}
                        });
                        const tab = (forward=true) => {
                            aa.arg.test(forward, aa.isBool, "'forward' must be a Boolean");

                            const enabledButtons = [...that.node.getElementsByTagName('button')]
                            .filter(button => !button.disabled);
                            const active = document.activeElement;
                            let toActivate = null;

                            active.blur();
                            if (enabledButtons.length) {
                                let index = enabledButtons.indexOf(active);
                                if (index < 0) {
                                    toActivate = enabledButtons[0];
                                } else {
                                    index += forward ? 1 : -1;
                                    if (index > enabledButtons.length - 1) { index = 0; }
                                    if (index < 0) { index = enabledButtons.length - 1; }
                                    toActivate = enabledButtons[index];
                                }
                                toActivate.focus();
                            }
                        };
                        
                        // Set focus on first menu element:
                        tab();
                        
                        aa.events.app('aaContextMenu').on({
                            '<Esc>': escape,
                            '<Tab>': e => { tab(); },
                            '<Down>': e => { tab(); },
                            'shift <Tab>': e => { tab(false); },
                            '<Up>': e => { tab(false); },
                        }, ['preventDefault', 'forever']);
                        
                        aa.events.app("aaContextMenu").suspend([
                            "<Down>",
                            "<Up>",
                            "<Home>",
                            "<End>",
                            // "moletteBas",
                            // "moletteHaut",
                            // "mousewheel.Up",
                            // "mousewheel.Down",
                            "<Tab>",
                            "shift <Tab>",
                        ]);

                        if (that.top + that.node.offsetHeight > aa.browser.height) {
                            if (that.node.offsetHeight <= (aa.browser.height-2)) {
                                that.node.style.top = (aa.browser.height - that.node.offsetHeight-2)+"px";
                            } else {
                                that.node.style.top = "2px";
                            }
                        }
                        if (that.left + that.node.offsetWidth > aa.browser.width) {
                            if (that.node.offsetWidth <= (aa.browser.width-2)) {
                                that.node.style.left = (aa.browser.width-that.node.offsetWidth-2)+"px";
                            } else {
                                that.node.style.left = "2px";
                            }
                        }
                        const ul = that.node.firstChild;
                        if (ul) {
                            const style = getComputedStyle(ul);
                            const ulWidth = ul.offsetWidth || parseFloat(style.width);
                            const ulHeight = ul.offsetHeight || parseFloat(style.height);

                            const left = Math.min(that.left + 4, Math.max(aa.browser.width - ulWidth - 4, 4));
                            const top = Math.min(that.top, Math.max(aa.browser.height - ulHeight, 4));
                            that.node.style.left = `${left}px`;
                            that.node.style.top = `${top}px`;
                        }
                        
                        privates.emit.call(this, `show`);
                    });
                },

                // Setters:
                setOn:      function (eventName, callback) {
                    /**
                     * Usage:
                     * (new ContextMenu()).on(<string> eventName, <function callback>);
                     * (new ContextMenu()).on({
                        * <string> eventName: <function callback>
                     * });
                     * 
                     * @param {string|object} eventName
                     * @param {function} callback
                     * 
                     * @return {void}
                     */
                    aa.throwErrorIf(
                        aa.isObject(eventName) && callback !== undefined,
                        `Invalid call syntax.`,
                        TypeError
                    )

                    // Call for each entry:
                    if (aa.isObject(eventName)) {
                        const listeners = eventName;
                        listeners.forEach((callback, evtName) => {
                            this.on(evtName, callback);
                        });
                        return;
                    }

                    // Call on single entry:
                    this.on.apply(this, arguments);
                },
                setTop:     function (top) {
                    aa.arg.test(top, aa.isPositiveInt, "'top'");
                    const that = _(this);
                    that.top = top;
                },
                setLeft:    function (left) {
                    aa.arg.test(left, aa.isPositiveInt, "'left'");
                    const that = _(this);
                    that.left = left;
                },
            }, {force: true});
            return Object.freeze(ContextMenu);
        })();
        this.Dialog         = (function () {
            const db = new aa.Storage("aaDialog");
            const dialogCollection = {}; // liste des <aa.gui.Dialog> ouvertes

            function getAccessor (thisArg) { return aa.getAccessor.call(thisArg, {get, set}); }

            const Dialog = function (type /* , spec */) {
                /**
                 * @param {String} type
                 * @param {Object} spec (optional)
                 *
                 * @return {aa.gui.Dialog}
                 */
                
                // Public attributes:

                // Private attributes:
                aa.defineAccessors.call(this, {
                    publics: {
                        id:             aa.uid(),
                        defaultValue:   null,
                        details:        null,
                        escape:         true,
                        fullscreen:     false,
                        height:         null,
                        maxWidth:       null,
                        maxHeight:      null,
                        placeholder:    null,
                        text:           null,
                        theme:          null,
                        title:          null,
                        type:           null,
                        // validation:     null,
                        width:          null,
                    },
                    privates: {
                        appName:        null,
                        active:         null,
                        buttons:        true,
                        "btn-cancel":   null,
                        "btn-submit":   null,
                        icon:           null,
                        lastFocus:      null,
                        listeners: {
                            cancel: [],
                            hide:   [],
                            resize: [],
                            show:   [],
                            submit: []
                        },
                        node:               null,
                        reminder:           null,
                        suspendedModules:   [],
                        toolbar:            [],
                        validation:         null,
                    }
                }, {getter: get, setter: set});

                // Construct:
                construct.apply(this, arguments);
            };
            aa.deploy(Dialog.prototype, {

                // Methods:
                checkValidation:  function () {
                    const that = _(this);
                    let form = undefined;
                    let isValid = true;
                    el("aaDialog-"+this.getID(), node => {
                        const forms = node.getElementsByTagName("form");
                        if (forms.length === 1) {
                            form = forms[0];
                            const validation = that.validation ?? aa.any;
                            const checkElements = () => {
                                return form.elements.reduce((bool, elt) => {
                                    const validation = get(elt, "validation");
                                    if (aa.isFunction(validation)) {
                                        const result = !!validation(elt);
                                        elt.classList[(result ? "remove" : "add")]("invalid");
                                        return (!result ?
                                            false
                                            : bool
                                        );
                                    }
                                    if (elt.classList) {
                                        elt.classList.remove("invalid");
                                    }
                                    return bool;
                                }, true);
                            };
                            const checkPatterns = () => {
                                return form.elements
                                    .filter(elt => ["input", "textarea"].has(elt.nodeName?.toLowerCase()))
                                    .reduce((bool, elt) => {
                                        const pattern = elt.pattern || elt.dataset.pattern;
                                        return (pattern && !elt.value.match(new RegExp(pattern)) ?
                                            false
                                            : bool
                                        );
                                    }, true)
                                ;
                            };
                            const checkrequired = () => {
                                return form.elements
                                    .filter(elt => ["input", "textarea"].has(elt.nodeName?.toLowerCase()))
                                    .reduce((bool, elt) => {
                                        const required = !!elt.required;
                                        return (required && !elt.value ?
                                            false
                                            : bool
                                        );
                                    }, true)
                                ;
                            };
                            isValid = (validation(getPOST.call(this)) && checkPatterns() && checkrequired() && checkElements());
                        }
                    });
                    const btn = that["btn-submit"];
                    if (btn) btn.disabled = !isValid;
                    return isValid;
                },
                hydrate:            aa.prototypes.hydrate,
                hide:               function () {
                    const that = _(this);

                    el("aaDialogBG-"+this.id, (dom) => {
                        dom.classList.remove("fade");
                        dom.classList.add("fadeOut");
                    });
                    fire.call(this, "hide");
                    pop.call(this);
                    that.active?.focus();
                    setTimeout(() => {
                        // return;
                        el("aaDialogBG-"+this.id, (dom) => {
                            View.unblur.call(this);
                            dom.parentNode.removeChild(dom);
                            set(this, "node", null);
                        });
                        aa.events.removeApp("aaDialog-"+this.getID());
                        
                        bgOpacity.call(this);

                        if (dialogs.length === 0) {
                            document.body.classList.remove("aaFrameworkFreeze");
                        }
                    }, transitionDuration*1000);
                },
                isValid:            function () {
                    const that = _(this);
                    return (
                        that.text !== null
                        || that.type === "loading"
                        || that.type === "shortcut"
                    );
                },
                on:                 function (spec) {
                    const that = _(this);
                    const verify = aa.prototypes.verify({
                        spec: aa.isObject,
                        listener: (name) => { return that.listeners.keys().has(name); }
                    });
                    verify("spec", spec);

                    let ok = undefined;
                    // "on.ok" is aa.deprecated. Use "submit" instead:
                    if (spec.hasOwnProperty("ok")) {
                        aa.deprecated("aa.gui.Dialog::on.ok");
                        ok = spec.ok;
                        delete(spec.ok);
                    }
                    spec.forEach((callback, evtName) => {
                        verify("listener", evtName);
                        if (!aa.isFunction(callback)) { throw new TypeError("Callback argument must be a Function."); }

                        if (that.listeners.evtName === undefined) {
                            that.listeners[evtName] = [];
                        }
                        that.listeners[evtName].push(callback);
                        delete(spec[evtName]);
                    });
                    if (ok) {
                        spec.submit = ok;
                        this.setOn(spec);
                    }
                },
                resize:             function () {
                    switch (this.type) {
                        case "win":{
                            let menu, form, buttons;
                            const getPixels = function (elt, dimension) {
                                if (!["height", "width"].has(dimension)) { throw new TypeError("Invalid dimension."); }
                                if (!aa.isNode(elt)) { throw new TypeError("Invalid node."); }

                                const v = window.getComputedStyle(elt)[dimension];
                                if (aa.isString(v)) {
                                    return parseInt(v.replace(/px/,''));
                                }
                                return undefined;
                            };

                            el("aaDialog-"+this.id, (node) => {
                                node.diveTheDOM(function (n) {
                                    if (!form && n.tagName.toLowerCase() === "form") {
                                        form = n;
                                    }
                                    if (!menu && n.classList.contains("menu")) {
                                        menu = n;
                                    }
                                    if (!buttons && n.classList.contains("buttons")) {
                                        buttons = n;
                                    }
                                });
                                if (this.fullscreen && form && getPixels(form, "height") > aa.browser.getHeight()) {
                                    form.style.background = "#49f;";
                                    form.style.paddingTop = getPixels(menu, "height")+"px";
                                    form.style.paddingBottom = getPixels(buttons, "height")+"px";
                                }
                            }, () => {
                                log("not found");
                            });
                            break;
                        }
                    }
                },
                show:               function () {
                    if (this.isValid()) {
                        // Directly do stuff if no need to confirm:
                        if (doNotConfirm.call(this)) {
                            fire.call(this, "submit");
                            return;
                        }

                        const that = _(this);
                        that.active = document.activeElement;

                        View.onresize.call(this);
                        View.freezeBody.call(this);
                        View.blur.call(this);
                        pushToList.call(this);

                        if (this.type === "loading") {
                            showLoading.call(this);
                        } else if (this.type === "shortcut") {
                            showShortcut.call(this);
                        } else {
                            const {dom, grid, cell, modal, menu, form, message, buttons} = View.getFromLayout.call(this);
                        
                            switch (this.type) {
                                case "confirm":
                                    View.addReminderTo.call(this, message);
                                    View.addSubmitButtonTo.call(this, buttons);
                                    View.addCancelButtonTo.call(this, buttons);

                                    const events = {
                                        submit: () => {
                                            const reminder = that.reminder;
                                            if (reminder) {
                                                const data = getPOST.call(this);
                                                data.doNotRemind = data.doNotRemind === "true" || data.doNotRemind === true;
                                                doNotRemind.call(this, data.doNotRemind);
                                            }
                                        }
                                    };
                                    events.forEach((callback, evtName) => {
                                        form.on(evtName, callback);
                                    });
                                break;
                                case "prompt":
                                    // Input:
                                    View.addInputTo.call(this, message);

                                    // Buttons:
                                    View.addSubmitButtonTo.call(this, buttons);
                                    View.addCancelButtonTo.call(this, buttons);
                                break;
                                case "win":
                                    View.setWidthTo.call(this, modal);
                                    View.addToolbarTo.call(this, menu);

                                    // Buttons:
                                    if (that.buttons) {
                                        View.addSubmitButtonTo.call(this, buttons);
                                        View.addCancelButtonTo.call(this, buttons);

                                        if (this.validation) {
                                            that["btn-submit"].disabled = true;
                                        } else {
                                            that["btn-submit"].focus();
                                        }
                                    } else {
                                        that["btn-submit"] = null;
                                        that["btn-cancel"] = null;
                                    }

                                    // Full screen:
                                    if (this.fullscreen) {
                                        modal.classList.add("fullscreen");
                                        menu.classList.add("fullscreen");
                                        buttons.classList.add("fullscreen");
                                        this.resize();
                                    }
                                break;
                                default:
                                    View.addSubmitButtonTo.call(this, buttons);
                                break;
                            }

                            View.setShortcuts.call(this);
                            View.followFocus.call(this, form);
                            View.invalidCSS.call(this, form);
                            View.listenValidation.call( this, form);

                            // Focus:
                            View.focus.call(this);
                        }
                        fire.call(this, "show");
                    }
                    bgOpacity.call(this);
                    this.resize();
                    return this;
                },
                
                // Setters:
                addYes:             function (p) {
                    aa.deprecated("aa.gui.Dialog::yes");
                    const that = _(this);

                    switch (this.type) {
                        case "information":
                        case "warning":
                        case "critical":

                        case "confirm":
                        case "prompt":
                        case "win":
                        case "shortcut":
                            // Action alias:
                            if (aa.isString(p) && p.trim()) {
                                p = p.trim();
                                let a = aa.actionManager.get(p);
                                if (a instanceof aa.Action && a.isValid()) {
                                    that.listeners.submit.push(p);
                                    return true;
                                } else {
                                    if (aa.settings.production) {
                                        console.warn("Action not found.");
                                    } else {
                                        console.warn("Action '"+p+"' not found or not valid.");
                                    }
                                }
                            }

                            // Action:
                            else if(p instanceof aa.Action && p.isValid()) {
                                that.listeners.submit.push(p);
                                return true;
                            }

                            // Function:
                            else if(aa.isFunction(p)) {
                                that.listeners.submit.push(p);
                                return true;
                            }

                            throw new TypeError("Action argument not valid.");
                        break;
                        default:
                        break;
                    }
                    return false;
                },
                addNo:              function (p) {
                    aa.deprecated("aa.gui.Dialog::no");
                    const that = _(this);

                    switch (this.type) {
                        case "confirm":
                        case "prompt":
                        case "win":
                        case "shortcut":
                            // Action alias:
                            if (aa.isString(p) && p.trim()) {
                                p = p.trim();
                                let a = aa.actionManager.get(p);
                                if (a instanceof aa.Action && a.isValid()) {
                                    that.listeners.cancel.push(p);
                                    return true;
                                }
                            }
                            // Action:
                            else if(p instanceof aa.Action && p.isValid()) {
                                that.listeners.cancel.push(p);
                                return true;
                            }
                            // Function:
                            else if(aa.isFunction(p)) {
                                that.listeners.cancel.push(p);
                                return true;
                            }
                            throw new TypeError("Action argument not valid.");
                            break;
                    }
                    return false;
                },
                setApp:             function (app) {
                    aa.arg.test(app, aa.any, "'app'");
                    // aa.deprecated("aa.gui.Dialog::app");
                    verify("appName", app);
                    const that = _(this);

                    that.appName = app.trim();
                },
                setButtons:         function (b) {
                    if (!aa.isBool(b)) { throw new TypeError("Argument must be a Boolean."); }
                    const that = _(this);
                    that.buttons = b;
                },
                setCallback:        function (f) {

                    aa.deprecated("aa.gui.Dialog::callback");
                },
                setDefaultValue:    function (txt) {
                    aa.arg.test(txt, aa.nonEmptyString, "'txt'");
                    const that = _(this);
                    that.defaultValue = txt.trim();
                    return (!!this.defaultValue);
                },
                setDetails:         function (p) {
                    aa.deprecated("gui.dialog.details");
                    const that = _(this);

                    if (aa.isElement(p)) {
                        that.details = p;
                        return true;
                    } else if(!aa.nonEmptyString(p)) {
                        throw new TypeError("Dialog details must be a non-empty String.");
                        return false;
                    }
                    that.details = p.trim();
                    return (!!that.details);
                },
                setEscape:          function (escape) {
                    aa.arg.test(escape, aa.isBool, `'escape'`);
                    const that = getAccessor(this);
                    that.escape = escape;
                },
                setFullscreen:      function (b) {
                    const that = _(this);
                    that.fullscreen = (b === true);
                },
                setIcon:            function (icon) {
                    aa.arg.test(icon, aa.nonEmptyString, "'icon'");
                    const that = _(this);
                    that.icon = icon.trim();
                },
                setId:              function (id) {
                    const that = _(this);
                    if (aa.isString(id) && id.trim()) {
                        that.id = id;
                    }
                },
                setMaxWidth:        function (n) {
                    const that = _(this);
                    if (aa.isInt(n) && n > 0) {
                        n += '';
                    }
                    if (aa.isString(n)) {
                        if (n.match(/^[0-9]+$/)) {
                            n += 'px';
                        }
                        if (n.match(/^[0-9]+(px|\%)$/)) {
                            that.maxWidth = n;
                        }
                    }
                },
                setMaxHeight:       function (n) {
                    const that = _(this);
                    if (aa.isInt(n) && n > 0) {
                        n += '';
                    }
                    if (aa.isString(n)) {
                        if (n.match(/^[0-9]+$/)) {
                            n += 'px';
                        }
                        if (n.match(/^[0-9]+(px|\%)$/)) {
                            that.maxHeight = n;
                        }
                    }
                },
                setMessage:         function (s) {
                    return this.setText(s);
                },
                setNo:              function (p) {
                    if (aa.isArray(p) && p.length) {
                        p.forEach(function (n) {
                            this.addNo(n);
                        },this);
                    } else {
                        this.addNo(p);
                    }
                },
                setOn:              function (spec) {

                    this.on(spec);
                },
                setPlaceholder:     function (s) {
                    if (!aa.nonEmptyString(s)) {
                        throw new TypeError("Dialog text must be a non-empty String.");
                        return false;
                    }
                    const that = _(this);

                    that.placeholder = s.trim();
                    return (!!this.placeholder);
                },
                setReminder:        function (reminder) {
                    if (aa.nonEmptyString(reminder)) {
                        const that = _(this);
                        that.reminder = reminder.trim();
                    }
                },
                setSuspend:         function (s) {
                    aa.deprecated("aa.gui.Dialog::suspend");

                    if (!aa.nonEmptyString(s)) { throw new TypeError("Argument must be a non-empty String."); }

                    // s = s.trim();
                    // if (this.suspendedModules.has(s)) {
                    //     return true;
                    // } else {
                    //     return this.suspendedModules.push(s);
                    // }
                },
                setText:            function (p) {
                    const that = _(this);
                    if (aa.isElement(p) || p instanceof DocumentFragment) {
                        that.text = p;
                    } else if(aa.nonEmptyString(p)) {
                        that.text = p.trim();
                    } else if (aa.isArray(p)) {
                        const isOk = p.reduce((bool, elt) => {
                            return (!aa.nonEmptyString(elt) && !aa.isElement(elt) ?
                                false
                                : bool
                            );
                        }, true);
                        if (isOk) {
                            that.text = p;
                        }
                    }
                    return (!!this.text);
                },
                setTheme:           function (theme) {
                    aa.arg.test(theme, aa.nonEmptyString, "'theme'");
                    const that = _(this);

                    theme = theme.trim();
                    if (ENV.THEMES.has(theme)) {
                        that.theme = theme;
                        return true;
                    }
                    return false;
                },
                setTitle:           function (title) {
                    aa.arg.test(title, arg => aa.nonEmptyString(arg) || aa.isNode(arg), "'title'");
                    const that = _(this);

                    that.title = aa.isString(title) ? title.trim() : title;
                    return !!that.title;
                },
                setType:            function (type) {
                    verify("dialogType", type);
                    const that = _(this);

                    that.type = type.trim().toLowerCase();
                    return !!that.type;
                },
                setToolbar:         function (item) {
                    const that = _(this);

                    if (aa.isArray(item)) {
                        item.forEach((a) => {
                            that.setToolbar(a);
                        });
                    } else {
                        if (aa.isDom(item) || (item instanceof aa.Action && item.isValid()) || aa.nonEmptyString(item)) {
                            that.toolbar.push(item);
                        }
                    }
                },
                setValidate:        function (callback) {
                    aa.arg.test(callback, aa.isFunction, "'callback'");
                    const that = _(this);
                    that.validation = callback;
                    return !!that.validation;
                },
                setWidth:           function (n) {
                    const that = _(this);
                    if (aa.isInt(n) && n>0) {
                        n += '';
                    }
                    if (aa.isString(n)) {
                        if (n.match(/^[0-9]+$/)) {
                            n += 'px';
                        }
                        if (n.match(/^[0-9]+(px|\%)$/)) {
                            that.width = n;
                        }
                    }
                },
                setYes:             function (p) {
                    if (aa.isArray(p) && p.length) {
                        p.forEach(function (a) {
                            this.addYes(a);
                        },this);
                    } else {
                        this.addYes(p);
                    }
                },

                // Getters:
                getID:              function () {
                    const that = _(this);
                    if (!this.id) {
                        that.id = aa.newID();
                    }
                    return this.id;
                },
                getNode:            function (/* resolve, reject */) {
                    /**
                     * @param {function} resolve (optional)
                     * @param {function} reject (optional)
                     */
                    const resolve = (arguments && arguments.length > 0 && aa.isFunction(arguments[0]) ? arguments[0] : undefined);
                    const reject = (arguments && arguments.length > 1 && aa.isFunction(arguments[1]) ? arguments[1] : undefined);

                    const that = _(this);
                    const node = that.node;
                    if (node) {
                        if (resolve) {
                            resolve(node);
                        }
                    } else {
                        if (reject) {
                            reject();
                        }
                    }
                    return (node ?
                        node
                        : undefined
                    );
                },
                getAppName:         function () {
                    const that = _(this);
                    if (!this.id) {
                        that.id = aa.newID();
                    }
                    return "aaDialog-"+this.getID();
                }
            }, {force: true });
            aa.deploy(Dialog.prototype, {
                setDefault:       Dialog.prototype.setDefaultValue,
                setValue:         Dialog.prototype.setDefaultValue,
            }, {force: true});
            /**
             * How to use:
                let d = new aa.Dialog(String type);
                let d = new aa.Dialog(String type, Object {
                    id: {string} id,
                    buttons: {boolean},
                    default: {string} defaultValue, // default value for 'prompt' dialog (alias: 'default','defaultValue','value')
                    height: {number}, // values in pixels only
                    height: {string} height='100%',
                    no: {string} ActionAlias | Array (String ActionAlias | Function callbacks) | Function callback, // (aa.deprecated)
                    on: {object} of functions (submit, cancel),
                    placeholder: {string} placeholder, // for 'prompt' dialog
                    text: {string} message,
                    theme: {string} theme,
                    title: {string} title,
                    type: {string} type ("information", "warning", "critical", "confirm", "prompt", "win", "shortcut"),
                    validation: {function},
                    width: {number}, // values in pixels only
                    width: {string} width='100%',
                    yes: {string} ActionAlias | Array (String ActionAlias | Function callbacks) | Function callback, // (aa.deprecated)
                });
                d.hydrate({
                    id: String id,
                    title: String title,
                    text: String message,
                    default: String defaultValue, // default value for 'prompt' dialog
                    type: String type ("information" | "warning" | "critical" | "confirm"),
                    yes: String ActionAlias | Array (String ActionAlias | Function callbacks),
                    no: String ActionAlias | Array (String ActionAlias | Function callbacks),
                    theme: String theme
                });
                d.show();
             */

            // Closure private methods:
            const bgOpacity         = function () {
                dialogs.forEach((dialog) => {
                    el("aaDialogBG-"+dialog.id, (bg) => {
                        bg.classList.add("transparent");
                    });
                });
                const last = dialogs.last;
                if (last) {
                    el("aaDialogBG-"+last.id, (bg) => {
                        bg.classList.remove("transparent");
                    });
                }
            };
            const construct         = function () {

                // Default type:
                this.setType(dialogTypes[0]);
                this.setTheme(aa.settings.theme);
                aa.events.on('themechange', (theme, previous) => {
                    this.setTheme(theme);
                });
                
                if (arguments && arguments.length) {
                    // Type:
                    this.setType(arguments[0]);

                    // Spec:
                    if (arguments.length > 1) {
                        const spec = arguments[1];
                        verify("spec", spec);
                        this.hydrate(spec, ["type", "on"]);
                    }
                }
                dialogCollection[this.id] = this;
            };
            const initRemindersDB   = function () {
                db.load();
                if (!db.select("reminders")) {
                    db.insert("reminders", []);
                }
            };
            const doNotConfirm      = function () {
                const that = _(this);
                const reminder = that.reminder;

                if (this.type === "confirm") {
                    if (reminder) {
                        initRemindersDB.call(this);
                        const reminders = db.select("reminders");
                        return aa.isArray(reminders) && reminders.has(reminder);
                    }
                } else {
                    that.reminder = null;
                }
                return false;
            };
            const doNotRemind       = function (checked) {
                if (!aa.isBool(checked)) { throw new TypeError("Argument must be a Boolean."); }
                const that = _(this);

                const reminder = that.reminder;
                if (this.type === "confirm" && reminder) {
                    initRemindersDB.call(this);
                    const reminders = db.select("reminders");
                    if (checked) {
                        reminders.pushUnique(reminder);
                    } else {
                        if (reminders.has(reminder)) {
                            reminders.splice(reminders.indexOf(reminder), 1);
                        }
                    }
                    db.insert("reminders", reminders);
                }
            };
            const fire              = function (str) {
                const that = _(this);
                aa.prototypes.verify({str: (str) => { return that.listeners.keys().has(str); }})("str", str);
                
                that.listeners[str].forEach((item) => {
                    const data = str === "submit" ?
                        getPOST.call(this)
                        : undefined
                    ;

                    // String:
                    if (aa.isString(item)) {
                        aa.action(item, (action) => {
                            action.execute(data);
                        })
                    }

                    // Action:
                    else if (item instanceof aa.Action && item.isValid()) {
                        item.execute(data);
                    }

                    // Function:
                    else if (aa.isFunction(item)) {
                        item(data);
                    }
                });
            };
            const pop               = function () {
                const spec = dialogs.pop();
                if (spec) {
                    delete(dialogCollection[spec.id]);
                }
                const last = dialogs.last;
                if (last) {
                    if (last.type === "prompt") {
                        el("aaDialog-"+last.id+"DialogInput", (node) => {
                            node.focus();
                        });
                    } else {
                        const dialog = dialogCollection[last.id];
                        if (dialog) {
                            const node = get(dialog, "lastFocus");
                            if (node) {
                                node.focus();
                            }
                        }
                    }
                }
            };
            const pushToList        = function () {
                dialogs.push({
                    id: this.id,
                    type: this.type
                });
            };
            const showLoading       = function (callback) {
                const dom = $$("div.aa.bg.shade.fade.loading#aaDialogBG-"+this.id);
                dom.style.zIndex = 1+aa.getMaxZIndex();
                dom.on("contextmenu", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                document.body.appendChild(dom);
                
                dom.appendChild($$("div.aaTable.fullscreen",
                    $$("div.td",
                        $$("div#aaDialog-"+this.id, $$("span.icon.fa.fa-circle-o-notch.fa-spin")),
                    )
                ));
            };
            const showShortcut      = function (callback) {
                /**
                 * @param Function callback
                 * @param String defaultValue (optional)
                 */

                const that = this;
                if (el("aaDialogShortcut")) {
                    console.warn("Shortcut Dialog already exists.");
                    return;
                }
                const o = {
                    dom: $$("div.aa.bg.shortcut.fade#aaDialogBG-"+this.id)
                };
                o.dom.style.zIndex = 1+aa.getMaxZIndex();
                o.dom.on("contextmenu", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                document.body.appendChild(o.dom);
                
                let table = $$("div.aaTable.fullscreen");
                o.dom.appendChild(table);
                
                let td = $$("div.td");
                table.appendChild(td);

                let div = $$("div#aaDialog-"+this.id, 'Enter a new key combination<div id="aaHotkey" class="hotkey placeholder">'+(this.defaultValue ? aa.shortcut.format(this.defaultValue, ["css"]) : "···")+"</div>");
                td.appendChild(div);

                const keydown = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!["alt", "control", "meta", "shift"].has(e.key.toLowerCase())) {
                        const shortcut = aa.shortcut.get(e);
                        if (shortcut.match(/\#[0-9]+$/)) {
                            return;
                        }
                        el("aaHotkey", (node) => {
                            node.innerHTML = '';
                            node.classList.remove("placeholder");
                            node.innerHTML = aa.shortcut.format(shortcut, ["simple"]);
                        });
                        get(that, "listeners").submit.forEach((callback) => {
                            callback(shortcut);
                        });
                        hide(shortcut, true);
                    }
                };
                const hide = function (/* shortcut, delay=true */) {
                    /**
                     * @param {String} shortcut
                     * @param {Boolean} delay=true (optional)
                     */
                    const shortcut = (arguments && arguments.length ? arguments[0] : undefined);
                    const delay = ((arguments && arguments.length>1 && aa.isBool(arguments[1]) ? arguments[1] : false) ? 500 : 0);

                    btnClear.disabled = true;
                    btnCancel.disabled = true;

                    let opacity=100;
                    setTimeout(() => {
                        const timer = setInterval(() => {
                            opacity -= 2;
                            opacity -= 200;
                            aa.browser.setOpacity(o.dom, (opacity/100));
                            if (opacity <= 0) {
                                clearInterval(timer);
                                if (o.dom) {
                                    o.dom.removeNode();
                                    delete(o.dom);
                                }
                                aa.events.removeApp("aaDialog-"+that.getID());
                                get(that, "listeners").hide.forEach((callback) => {
                                    callback();
                                });
                                pop();
                                bgOpacity.call(that);
                            }
                        }, 2);
                    }, delay);
                    document.cancel("keydown", keydown);
                };

                // Clear button:
                const btnClear  = aa.html("button", {
                    disabled: (!this.defaultValue),
                    value: "Remove shortcut",
                    on: {
                        click: function () {
                            el("aaHotkey", (node) => {
                                node.innerHTML = "···";
                                get(that, "listeners").submit.forEach((callback) => {
                                    callback(null);
                                });
                                hide(null, true);
                            });
                        }
                    }
                });
                
                // Cancel button:
                const btnCancel = aa.html("button", {
                    value: "Cancel",
                    on: {click: () => {
                        get(that, "listeners").cancel.forEach((callback) => {
                            callback(undefined);
                        });
                        hide(this, false);
                    }}
                });

                // Inject in HTML:
                div.appendChild(aa.html("div",
                    {style: "margin-top: 16px;"},
                    btnClear,
                    btnCancel
                ));

                document.on("keydown", keydown);
            };
            const switchTab         = function (forward=true) {
                let activeElt;
                let actions = [];
                let focusIndex = 0;
                let dialog = document.getElementById("aaDialog-"+this.id);

                if (forward !== false) {
                    forward = true;
                }

                dialog.diveTheDOM(function (node) {
                    switch (node.nodeName.toLowerCase()) {
                        case "a":
                        case "button":
                        case "input":
                        case "textarea":
                        case "select":
                            let show = true;
                            node.riseTheDOM(function (nodeAlias) {
                                if (nodeAlias.disabled
                                    || window.getComputedStyle(nodeAlias,null).display === "none"
                                    || window.getComputedStyle(nodeAlias,null).visibility !== "visible"
                                    || (nodeAlias.style && (
                                        (nodeAlias.style.display && nodeAlias.style.display === "none")
                                        || (nodeAlias.style.visibility && nodeAlias.style.visibility !== "visible")
                                    ))
                                ) {
                                    show = false;
                                }
                            });
                            if (show) {
                                actions.push(node);
                            }
                            break;
                        default:
                            break;
                    }
                });
                if (actions.length > 0) {
                    activeElt = actions.find(function (action,i) {
                        return (document.activeElement === action);
                    });
                    if (!forward) {
                        if (activeElt) {
                            focusIndex = actions.indexOf(activeElt)-1;
                        }
                        if (focusIndex < 0) {
                            focusIndex = actions.length-1;
                        }
                    } else {
                        if (activeElt) {
                            focusIndex = 1+actions.indexOf(activeElt);
                        }
                        if (focusIndex >= actions.length) {
                            focusIndex = 0;
                        }
                    }
                    actions[focusIndex].focus();
                }
                return false;
            };
            const getPOST           = function () {
                let form;
                let name;
                let post = undefined;
                if (aa.isDom(el("aaDialog-"+this.id))) {
                    if (this.type.toLowerCase() === "prompt") {
                        el("aaDialog-"+this.id+"DialogInput", (input) => {
                            post = (input.value.trim() ?
                                input.value.trim()
                                : null
                            );
                        });
                    } else {
                        post = {};
                        form = el("aaDialog-"+this.id).diveTheDOM(function (dom) {
                            name = dom.getAttribute("name");
                            if (name && !dom.disabled) {
                                switch (dom.nodeName.toLowerCase()) {
                                    case "select":
                                        if (dom.multiple) {
                                            post[name] = [];
                                            dom.diveTheDOM(function (elt) {
                                                if (elt.nodeName.toLowerCase() === "option" && elt.selected) {
                                                    post[name].push(elt.value);
                                                }
                                            });
                                        } else {
                                            post[name] = dom.value;
                                        }
                                        break;
                                    case "input":
                                        switch (dom.type) {
                                            case "number":
                                                if (dom.value) {
                                                    dom.value = dom.value.replace(/\,/g,'.');
                                                    post[name] = parseFloat(dom.value);
                                                } else {
                                                    post[name] = null;
                                                }
                                                // post[name] = dom.value ? parseFloat(dom.value) : null;
                                                break;
                                            case "checkbox":
                                                const regex = /\[\]$/;
                                                if (name.match(regex)) {
                                                    name = name.replace(regex, '');
                                                    if (!post.hasOwnProperty(name)) {
                                                        post[name] = [];
                                                    }
                                                    if (dom.checked) {
                                                        post[name].push(dom.value);
                                                    }
                                                } else {
                                                    if (dom.checked) {
                                                        post[name] = dom.value;
                                                    }
                                                }
                                                break;
                                            case "file":
                                                post[name] = (typeof dom.files !== 'undefined' ? dom.files : undefined);
                                                break;
                                            case "radio":
                                                if (dom.checked) {
                                                    post[name] = dom.value;
                                                }
                                                break;
                                            default:
                                                post[name] = dom.value ? dom.value : null;
                                                break;
                                        }
                                        break;
                                    default:
                                        post[name] = dom.value ? dom.value : null;
                                        break;
                                }
                            }
                        });
                    }
                }
                return post;
            };
            const View = {
                addIconTo:          function (node) {
                    const that = _(this);
                    switch (this.type) {
                        case "information":
                        case "warning":
                        case "critical":
                        case "confirm":
                        case "prompt":
                            const icon = that.icon;
                            if (icon && icon.match(/^url\([^\(\)]+\)/)) {
                                node.appendChild($$('div.fa-icon.with-custom-icon',
                                    $$('div.aaDialogIcon', {style: `background-image: ${icon.replace(/;+$/, '')};`})
                                ));
                            } else {
                                const icon = (this.type === "prompt" ? "confirm" : this.type);
                                node.appendChild($$("div.fa-icon", $$("span.icon."+icon+".fa.fa-"+
                                    ({
                                        information: "info-circle",
                                        warning: "warning",
                                        critical: "remove",
                                        confirm: "question-circle"
                                    })[icon]
                                +".fa-3x")));
                            }
                            break;
                    }
                },
                addCancelButtonTo:  function (node) {
                    const that = _(this);

                    const button = $$("input#aaDialog-"+this.getID()+"-cancelButton.reset", {
                        type: "reset",
                        on: {click: (e) => {
                                fire.call(this, "cancel");
                                this.hide();
                        }}
                    });
                    const texts = {
                        confirm: 'no'
                    };
                    button.value = aa.lang.get(`action.${texts[this.type] ?? 'cancel'}`);
                    
                    that["btn-cancel"] = button;
                    node.appendChild(button);
                },
                addInputTo:         function (node) {
                    const input = $$("input#aaDialog-"+this.getID()+"DialogInput", {
                        type: "text"
                    });
                    if (this.defaultValue !== null)
                        input.value = this.defaultValue;
                    if (this.placeholder !== null)
                        input.placeholder = this.placeholder;
                    const that = _(this);
                    that.listeners.forEach((list, evtName) => {
                        list.forEach((callback) => {
                            input.on(evtName, callback);
                        });
                    });
                    node.appendChild(input);
                },
                addReminderTo:      function (node) {
                    const that = _(this);
                    const reminder = that.reminder;
                    if (reminder) {
                        node.appendChild($$("br"));
                        node.appendChild(aa.cook("checkbox", {
                            label: "Don't show similar messages again",
                            name: "doNotRemind",
                            value: true
                        }));
                    }
                },
                addSubmitButtonTo:  function (node) {
                    const that = _(this);

                    const button = $$("input#aaDialog-"+this.getID()+"-submitButton", {
                        type: "submit",
                        on: {click: (e) => {
                            fire.call(this, "submit");
                            this.hide();
                        }}
                    });
                    const texts = {
                        confirm:        'yes',
                        prompt:         'submit',
                    };
                    button.value = aa.lang.get(`action.${texts[this.type] ?? 'ok'}`);
                    
                    that["btn-submit"] = button;
                    node.appendChild(button);
                    button.focus();
                },
                addThemeTo:         function (node) {
                    if (this.theme) {
                        node.classList.add(this.theme);
                        aa.events.on('themechange', (theme, previous) => {
                            node.classList.remove(previous);
                            node.classList.add(theme);
                        });
                    }
                },
                addTextTo:           function (node) {
                    if (aa.isArray(this.text)) {
                        this.text.forEach((txt) => {
                            if (aa.isString(txt)) {
                                node.appendChild($$("div", txt));
                            } else if (aa.isElement(txt)) {
                                node.appendChild(txt);
                            }
                        });
                    } else if (aa.isString(this.text)) {
                        node.appendChild($$("div", this.text));
                    } else if (aa.isElement(this.text) || this.text instanceof DocumentFragment) {
                        node.appendChild(this.text);
                    }
                },
                addTitleTo:         function (node) {
                    if (this.title) {
                        node.appendChild($$("h2.title", this.title));
                    }
                },
                addToolbarTo:       function (node) {
                    const that = _(this);
                    if (that.toolbar.length) {
                        that.toolbar.forEach((item) => {
                            let tool = null;
                            if (aa.isDom(item)) {
                                tool = item;
                            } else if (aa.isString(item)) {
                                item = aa.actionManager.get(item);
                            }
                            if (item instanceof aa.Action && item.isValid()) {
                                const a = item;
                                tool = $$("button"+(a.icon ? ".icon" : ''),
                                    $$("span"+(a.icon ? '.fa.fa-'+a.icon : ''), {
                                        text: (a.icon ? '' : a.getText())
                                    }),
                                    { on: {
                                        click: () => { a.execute(); }
                                    }}
                                );
                            }
                            if (tool) {
                                node.appendChild(tool);
                            }
                        });
                    }
                },
                blur:               function () {
                    // return true;
                    aa.walkChildrenElements(document.body, function (node) {
                        node.classList.add("aaBlur");
                    }, {except: ["script", "style"]});
                    return true;
                },
                freezeBody:         function () {

                    document.body.classList.add("aaFrameworkFreeze");
                },
                focus:              function () {
                    const that = _(this);
                    aa.wait(100, () => {
                        if (this.type.toLowerCase() === "prompt") {
                            el("aaDialog-"+this.id+"DialogInput", input => {
                                input.select();
                            });
                        } else {
                            const btn = that["btn-submit"];
                            if (btn) {
                                btn.focus();
                            }
                        }
                    });
                },
                followFocus:        function (form) {
                    const that = _(this);
                    form.elements.forEach((elt) => {
                        elt.on("focus", () => {
                            that.lastFocus = elt;
                        });
                    });
                },
                invalidCSS:         function (form) {
                    form.elements.forEach((elt) => {
                        if (elt.nodeName) {
                            switch (elt.nodeName.toLowerCase()) {
                                case "input":
                                    break;
                                
                                case "textarea":
                                    if (elt.dataset && elt.dataset.pattern) {
                                        try {
                                            const regex = new RegExp(elt.dataset.pattern);
                                            elt.classList[(elt.value.match(regex) ?
                                                "remove"
                                                : "add"
                                            )]("invalid");
                                        } catch (e) {
                                        }
                                    }
                                    break;
                            }
                        } else if (elt instanceof RadioNodeList) {
                            aa.gui.todo("RadioNodeList...");
                        }
                    });
                },
                getButtons:         function () {
                    return $$("div.buttons");
                },
                getCell:            function () {
                    return $$("div.td");
                },
                getDom:             function () {
                    const that = _(this);

                    const dom = $$("div#aaDialogBG-"+this.getID()+".aa.bg.shade.fade");
                    dom.style.zIndex = 1+aa.getMaxZIndex();
                    dom.on("contextmenu", function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });

                    // Click outside:
                    let outside;
                    const isOutside = (e) => {
                        return e.composedPath().reduce((outside, node) => {
                            return (node.classList && node.classList.contains("aaDialog") ?
                                false
                                : outside
                            );
                        }, true);
                    };
                    dom.on("mousedown", (e) => {
                        outside = isOutside(e);
                        return true;
                    });
                    dom.on("mouseup", (e) => {
                        if (outside && isOutside(e)) {
                            fire.call(this, "cancel");
                            this.hide();
                            return false;
                        }
                        return true;
                    });
                    that.node = dom;
                    return dom;
                },
                getGrid:            function () {
                    return $$("div.aaTable.fullscreen");
                },
                getFromLayout:      function () {
                    const dom = View.getDom.call(this);
                    document.body.appendChild(dom);

                    // Grid:
                    const grid = View.getGrid.call(this);
                    dom.appendChild(grid);

                    // Cell:
                    const cell = View.getCell.call(this);
                    grid.appendChild(cell);

                    // Modal:
                    const modal = View.getModal.call(this);
                    cell.appendChild(modal);

                    // Menu:
                    const menu = View.getMenu.call(this);
                    modal.appendChild(menu);

                    // Icon:
                    View.addIconTo.call(this, menu);
                    
                    // Form:
                    const form = View.getForm.call(this);
                    modal.appendChild(form);

                    View.addTitleTo.call(this, form);
                    // Message:
                    const message = View.getMessage.call(this);
                    form.appendChild(message);

                    // View.addTitleTo.call(this, message);
                    View.addTextTo.call(this, message);

                    // Buttons:
                    const buttons = View.getButtons.call(this);
                    form.appendChild(buttons);
                    
                    // Details:
                    // View.showDetails.call(this, form);

                    return {
                        dom: dom,
                        grid: grid,
                        cell: cell,
                        modal: modal,
                        menu: menu,
                        form: form,
                        message: message,
                        buttons: buttons,
                    };
                },
                getForm:            function () {
                    const that = _(this);
                    const form = $$("form", {
                        method: "POST",
                        action: "javascript:;",
                        on: {
                            submit: (e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const btn = that["btn-submit"];
                            }
                        }
                    });
                    return form;
                },
                getMenu:            function () {
                    return $$("div.menu");
                },
                getModal:           function () {
                    const modal = $$("div#aaDialog-"+this.getID()+".aaDialog");
                    View.addThemeTo.call(this, modal);
                    return modal;
                },
                getMenuIcon:        function () {
                },
                getMessage:         function () {
                    return $$("div.message");
                },
                onresize:           function () {
                    const that = _(this);
                    aa.events.app("aaDialog-"+this.getID()).on("windowresize", (e) => {
                        this.resize();
                        that.listeners.resize.forEach((callback) => { callback(e); });
                    }, ["preventDefault", "always"]);
                },
                setShortcuts:       function () {
                    const that = _(this);
                    ({
                        "<Esc>": () => {
                            switch (this.type) {
                                case "information":
                                case "warning":
                                case "critical":
                                    {
                                        const button = that["btn-submit"];
                                        if (button) {
                                            button.click();
                                        } else if (this.escape) {
                                            this.hide();
                                        }
                                    }
                                    break;
                                case "confirm":
                                case "prompt":
                                case "win":
                                    {
                                        const button = that["btn-cancel"];
                                        if (button) {
                                            button.click();
                                        } else if (this.escape) {
                                            this.hide();
                                        }
                                    }
                                    break;
                                default:
                                    break;
                            }
                        },
                        "<Tab>": () => {
                            switchTab.call(this);
                        },
                        "shift <Tab>": () => {
                            switchTab.call(this, false);
                        }
                    }).forEach((callback, evtName) => {
                        aa.events.app("aaDialog-"+this.getID()).on(evtName, (new aa.Action({on: {execute: callback}})), ["preventDefault", "always"]);
                    });

                    aa.events.app("aaDialog-"+this.getID())
                        .suspend([
                            "ctrl <S>",
                            "ctrlOrCmd <S>",
                            "ctrlOrCmd <O>",
                            "ctrlOrCmd <N>",
                            "<Home>",
                            "<End>"
                        ])
                    ;
                },
                setWidthTo:         function (node) {
                    if (this.width && !this.fullscreen) {
                        node.style.width = this.width;
                    }
                },
                showDetails:        function (form, message, buttons) {
                    if (this.details) {
                        form.appendChild($$("div.details", this.details));
                        form.classList.add("with-details");
                        message.classList.add("with-details");
                        buttons.classList.add("with-details");
                    }
                },
                unblur:             function () {
                    if (dialogs.length) {
                        View.blur.call(this);
                        const dialog = dialogCollection[dialogs.last.id];
                        if (dialog && dialog.getNode()) {
                            dialog.getNode().classList.remove("aaBlur");
                        }
                        return false;
                    } else {
                        // return true;
                        aa.walkChildrenElements(document.body,function (node) {
                            node.classList.remove("aaBlur");
                        },{except: ["script","style"]});
                    }
                    return true;
                },
                listenValidation:   function (form) {
                    const verify = () => {
                        this.checkValidation();
                    };
                    form.on('change', verify);
                    form.elements.forEach((node) => {
                        if (node.nodeName) {
                            switch (node.nodeName.toLowerCase()) {
                                case "input":
                                    switch (node.type.toLowerCase()) {
                                        case "button":
                                        case "submit":
                                        case "reset":
                                            break;
                                        case "checkbox":
                                        case "radio":
                                            node.on("change", verify);
                                            break;
                                        default:
                                            node.on("input", verify);
                                            break;
                                    }
                                    break;
                                case "select":
                                case "textarea":
                                    node.on("input", verify);
                                    break;
                                default:
                                    break;
                            }
                        }
                    });
                    verify();
                },
            };

            // The actual <Dialog> Function:
            return Object.freeze(Dialog);
        })();
        this.Notification = (() => {
            const {get, set} = aa.mapFactory();
            function _(that) { return aa.getAccessor.call(that, {get, set}); }

            /**
             * Display a notification in the bottom-right corner of the window.
             * 
             * @param 
             * 
             * Usage:
                notif = new aa.gui.Notification('Play / Pause');
                notif = new aa.gui.Notification('Play / Pause',{
                    title: 'myTitle',
                    message: 'bla bla bla',
                    type: 'information' // ['information','warning','critical','confirm']
                });
                ---
                notif.addAction({
                    text: 'Ok',
                    // name: 'action_name',
                    callback: function () {},
                    callbacks: [
                        function () {},
                        function () {}
                    ]
                });
                notif.push();
             */
            function Notification () { get(Notification, 'construct').apply(this, arguments); }
            const privates = {
                notifsLength: 0,
                types: ["information", "warning", "critical", "confirm"] // First item will be used by default
            };
            const blueprint = {
                accessors: {
                    publics: {
                        actions:    null,
                        id:         null,
                        text:       null,
                        title:      null,
                        type:       null,
                    }
                },
                construct: function (text, options={}) {
                    aa.arg.test(text, blueprint.verifiers.text, "'text'");
                    aa.arg.test(options, aa.verifyObject(blueprint.verifiers), "'options'");

                    const that = _(this);

                    that.actions = new aa.Collection({ authenticate: aa.instanceof(aa.Action) });
                    that.type = privates.types[0];

                    options.sprinkle({
                        id: `${privates.notifsLength}`,
                        text
                    });
                    privates.notifsLength++;
                    options.forEach((value, key) => {
                        blueprint.methods.setters[key]?.call(this, value);
                    });
                    el("aaNotifs", (node) => {
                        node.classList.add(aa.settings.theme);
                    }, () => {
                        const node = $$("div#aaNotifs.aa"+aa.settings.theme);
                        document.body.appendChild(node);
                        aa.events.on('themechange', (theme, previous) => {
                            node.classList.remove(previous);
                            node.classList.add(theme);
                        });
                    });
                },
                methods: {
                    publics: {

                        // Methods:
                        isValid:    function () {
                            return (this.text !== null);
                        },
                        push:       function () {
                            els('#aaNotifs', container => {
                                container.style.zIndex = 1+aa.getMaxZIndex();
                                let node = this.getHTML();
                                if (node) {
                                    container.insertAdjacentElement('afterbegin', node);
                                }
                            });
                        },
                        remove:     function (id) {
                            let dom = document.getElementById('aaNotif_'+id);
                            if (dom) {
                                dom.classList.add('fadeOut');
                                dom.on('animationend',(function (dom) {return function () {
                                    dom.style.display = 'none';
                                    dom.removeNode();
                                };})(dom));
                            }
                        },

                        // Setters:
                        addAction:  function (action) {
                            if (!(action instanceof aa.Action) && aa.isObject(action)) {
                                action = new aa.Action(action);
                            }
                            aa.arg.test(action, aa.instanceof(aa.Action), "'action'");

                            const that = _(this);
                            if (action.isValid()) {
                                that.actions.push(action);
                                return true;
                            }
                            return false;
                        },

                        // Getters:
                        getHTML:    function () {
                            const that = _(this);

                            const node = aa.html("div.notif."+that.type+"#aaNotif_"+that.id);

                            if (that.type !== null) {
                                let icon = aa.html("div.icon");
                                node.appendChild(icon);
                                icon.classList.add(that.type);
                                const icons = {
                                    information: 'info-circle',
                                    warning: 'warning',
                                    critical: 'remove',
                                    confirm: 'question-circle',
                                };
                                icon.append(aa.html(`span.fa.fa-2x.fa-${icons[that.type]}`));
                            }

                            const message = $$('div.message', `${that.title ? `<h2>${that.title}</h2>` : ''}${that.text}`);
                            node.appendChild(message);

                            if (that.actions.length > 0) {
                                const remove = () => { this.remove(that.id); };
                                let buttons = document.createElement("div");
                                buttons.classList.add("buttons");
                                
                                that.actions.forEach(function (action) {
                                    const btn = $$(`button.${action.type}`, action.text ?? "Ok");
                                    if (action.callbacks.length > 0) {
                                        action.callbacks.forEach(callback => {
                                            aa.deprecated("action.callback");
                                            btn.on("click", callback);
                                        });
                                    }
                                    btn.on("click", () => { action.execute(); });
                                    btn.on("click", remove);
                                    buttons.appendChild(btn);
                                    switch (action.type) {
                                        case "reset":
                                            btn.classList.add("reset");
                                            break;
                                        default:
                                            break;
                                    }
                                    return true;
                                });
                                message.appendChild(buttons);
                            }
                            else {
                                node.classList.add("waitAndFadeOut");
                                node.on("animationend",(function (node) {return function () {
                                    node.style.display = "none";
                                    node.removeNode();
                                };})(node));
                            }
                            
                            return node;
                        }
                    },
                    setters: {
                        action:    function (action) {
                            aa.arg.test([action], blueprint.verifiers.actions, "'action'");
                            const that = _(this);
                            this.addAction(action);
                        },
                        actions:    function (actions) {
                            aa.arg.test(actions, blueprint.verifiers.actions, "'actions'");
                            const that = _(this);
                            actions.forEach(action => {
                                this.addAction(action);
                            });
                        },
                        id:         function (id) {
                            aa.arg.test(id, blueprint.verifiers.id, "'id'");
                            const that = _(this);
                            that.id = id;
                        },
                        message:    function (message) {
                            aa.deprecated('<Notification.message>');
                            const that = _(this);
                            that.text = message;
                        },
                        text:       function (text) {
                            aa.arg.test(text, blueprint.verifiers.text, "'text'");
                            const that = _(this);
                            that.text = text;
                        },
                        title:      function (title) {
                            aa.arg.test(title, blueprint.verifiers.title, "'title'");
                            const that = _(this);
                            that.title = title;
                        },
                        type:       function (type) {
                            aa.arg.test(type, blueprint.verifiers.type, "'type'");
                            const that = _(this);
                            that.type = type;
                        },
                    }
                },
                verifiers: {
                    actions:    aa.isArrayOf(arg => arg instanceof aa.Action || aa.isObject(arg)),
                    id:         aa.nonEmptyString,
                    text:       aa.nonEmptyString,
                    message:    aa.nonEmptyString,
                    title:      aa.nonEmptyString,
                    type:       aa.inArray(privates.types)
                }
            };
            aa.manufacture(Notification, blueprint, {get, set});
            return Notification;
        })();
        this.Progress       = (function () {
            const collection = {};
            const uid = () => {
                let id;
                do {
                    id = aa.uid();
                } while (collection.hasOwnProperty(id));
                return id;
            };
            const construct = function () {
                const id = get(this, 'id');
                collection[id] = this;
                this.hydrate.apply(this, arguments);
            };
            const view = {
                percent: function (index, value) {
                    if (!aa.nonEmptyString(index)) { throw new TypeError("Argument must be a non-empty String."); }
                    const that = aa.getAccessor.call(this, {get, set});

                    index = index.trim();
                    const nodes = that.nodes.collection;
                    if (nodes.hasOwnProperty(index)) {
                        nodes[index].percent.innerHTML = value*100;
                    }
                }
            };
            const addNode   = function (index) {
                if (!aa.nonEmptyString(index)) { throw new TypeError("Argument must be a non-empty String."); }
                const that = aa.getAccessor.call(this, {get, set});

                index = index.trim();
                const container = that.nodes.container;
                if (container) {
                    const nodes = that.nodes.collection;
                    if (!nodes.hasOwnProperty(index)) {
                        nodes[index] = {
                            label: $$('div', index.getFilename()),
                            range: $$('range', {
                                min: 0,
                                max: 100,
                                step: 1,
                                disabled: true,
                                value: that.indexes[index]+''
                            }),
                            percent: $$('span', )
                        };
                        nodes[index].container = $$('div.item',
                            $$('div'),
                            $$('div', nodes[index].range),
                            $$('div.percent',
                                nodes[index].percent
                            ),
                            // $$('label',
                            //     $$('div',
                            //         nodes[index].label
                            //     )
                            // )
                        );
                        container.appendChild(nodes[index].container);
                    }
                    view.percent.call(this, index, 0);
                }
            };
            const moveRange = function (index, value) {
                if (!aa.nonEmptyString(index)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!aa.isNumber(value) || !value.between(0, 1)) { throw new TypeError("Second argument must be a Number between 0 and 1."); }
                const that = aa.getAccessor.call(this, {get, set});

                const nodes = that.nodes;
                if (nodes.collection[index]) {
                    nodes.collection[index].range.value = value*100;
                    nodes.collection[index].percent.innerHTML = Math.floor(value*100);
                }
            };
            const Progress = function () {

                // Attributes:
                aa.defineAccessors.call(this, {
                    publics: {
                        title: null,
                        visible: true
                    },
                    write: {
                    },
                    privates: {
                        indexes: {},
                        id: uid(),
                        nodes: {
                            container: null,
                            collection: {}
                        },
                        tasks: 0
                    }
                }, {getter: get, setter: set});

                construct.apply(this, arguments);
            };

            aa.deploy(Progress.prototype, {
                
                // Methods:
                hydrate: aa.prototypes.hydrate,
                add:        function (index) {
                    if (!aa.nonEmptyString(index)) { throw new TypeError("Argument must be a non-empty String."); }
                    const that = aa.getAccessor.call(this, {get, set});

                    index = index.trim();
                    that.tasks += 1;
                    that.indexes[index] = 0;
                    addNode.call(this, index);
                },
                complete:   function (index) {
                    if (!aa.nonEmptyString(index)) { throw new TypeError("Argument must be a non-empty String."); }
                    const that = aa.getAccessor.call(this, {get, set});

                    index = index.trim();
                    const indexes = that.indexes;
                    const nodes = that.nodes.collection;
                    if (indexes.hasOwnProperty(index)) {
                        delete indexes[index];
                    }
                    if (nodes.hasOwnProperty(index)) {
                        nodes[index].range.value = 100;
                        nodes[index].range.classList.add('complete');
                        nodes[index].container.removeNode();
                        delete nodes[index];
                    }
                    if (indexes.keys().length <= 0) {
                        this.hide();
                    }
                },
                hide:       function () {
                    const that = aa.getAccessor.call(this, {get, set});
                    el('aaProgress-'+that.id, node => {
                        node.removeNode();
                    });
                    delete collection[this.id];
                },
                show:       function () {
                    const that = aa.getAccessor.call(this, {get, set});
                    el('aaProgress', () => {}, () => {
                        const nodes = that.nodes;
                        nodes.container = $$('div.message');
                        if (this.title) {
                            nodes.container.appendChild($$('h2.title', this.title));
                        }
                        const dialog = $$('div.aaDialog.progress.'+aa.settings.theme,
                            nodes.container
                        );
                        const node = $$('div#aaProgress-'+that.id+'.aa.bg.shade'+(this.visible ? '' : '.hidden'),
                            $$('div.aaTable.fullscreen',
                                $$('div.td',
                                    dialog
                                )
                            )
                        );
                        document.body.appendChild(node);
                        node.style.zIndex = aa.getMaxZIndex()+1;
                        aa.events.on('themechange', (theme, previous) => {
                            dialog.classList.remove(previous);
                            dialog.classList.add(theme);
                        });

                        that.indexes.forEach((value, index) => {
                            addNode.call(this, index);
                        });
                    });
                },

                // Getters:
                // Setters:
                move:       function (index, value) {
                    if (!aa.nonEmptyString(index)) { throw new TypeError("First argument must be a non-empty String."); }
                    if (!aa.isNumber(value) || !value.between(0, 1)) { throw new TypeError("Second argument must be a Number between 0 and 1."); }
                    const that = aa.getAccessor.call(this, {get, set});

                    index = index.trim();
                    if (that.indexes.hasOwnProperty(index)) {
                        that.indexes[index] = value;
                    }
                    moveRange.call(this, index, value);
                },
                setTitle:   function (title) {
                    if (!aa.nonEmptyString(title)) { throw new TypeError("First argument must be a non-empty String."); }
                    const that = aa.getAccessor.call(this, {get, set});

                    that.title = title.trim();
                },
                setVisible: function (visible) {
                    if (!aa.isBool(visible)) { throw new TypeError("Argument must be a Boolean."); }
                    const that = aa.getAccessor.call(this, {get, set});

                    that.visible = visible;
                    el('aaProgress-'+that.id, (node) => {
                        node.classList[visible ? 'remove' : 'add']('hidden');
                    })
                }
            }, {force: true});
            return Object.freeze(Progress);
        })();

        // Simplified aliases:
        this.contextmenu    = function (/* spec */) {
            const spec = arguments && arguments.length ? arguments[0] : {};
            const cm = new aa.gui.ContextMenu(spec);
            cm.show();
            return cm;
        };
        this.dialog         = function (type, spec) {

            return (new aa.gui.Dialog(type, spec)).show();
        };
        this.loading        = function (callback /*, resolve, reject, spec */) {
            /**
             * @param Function callback
             * @param Function resolve (optional)
             * @param Function reject (optional)
             * @param Function spec (optional)
             *
             * @return void
             */
            if (!aa.isFunction(callback)) { throw new TypeError("First argument must be a Function."); }

            const resolve = arguments && arguments.length > 1 && aa.isFunction(arguments[1]) ? arguments[1] : undefined;
            const reject = arguments && arguments.length > 2 && aa.isFunction(arguments[2]) ? arguments[2] : undefined;
            const spec = arguments && arguments.length && aa.isObject(arguments.last) ? arguments.last : {};

            const gui = new aa.gui.Dialog("loading", spec);
            gui.show();
            setTimeout(() => {
                let ok = true;
                try {
                    callback();
                } catch (e) {
                    ok = false;
                    warn(e);
                    if (reject) {
                        reject();
                    }
                }
                gui.hide();
                if (resolve && ok) {
                    resolve();
                }
            }, transitionDuration*1000);
            return gui;
        };
        this.notification   = function (message, spec={}) {
            /**
             * @param {string} type ('information','warning','critical','confirm')
             * @param {object} spec (optional)
             *
             * @return void

                // ----------------------------
                aa.gui.notification('message à afficher', {
                    type:   'confirm', // optional ('information','warning','critical','confirm')
                    action: { // action builder...
                        text:   'Oui',
                        name:   'action1_name',
                        // callback: function(){}, // aa.deprecated
                        on: {
                            execute: () => {}
                        }
                    },
                    actions: [ // action builders...
                        {
                            text:   'Non',
                            name:   'action2_name',
                            type:   'reset', // optional
                            // callback: function(){}, // aa.deprecated
                            on: {
                                execute: () => {}
                            }
                        },
                        {
                            text:   'Annuler',
                            name:   'action3_name',
                            type:   'reset', // optional
                            // callback: function(){}, // aa.deprecated
                            on: {
                                execute: () => {}
                            }
                        }
                    ]
                });
                // ----------------------------
             */
            
            aa.arg.test(spec, aa.isObject, "'spec'");
            spec.sprinkle({
                actions: []
            });
            if (spec.action !== undefined) {
                spec.actions.push(spec.action);
                delete spec.action;
            }
            let notif = new aa.gui.Notification(message, spec);
            notif.push();
            return notif;
        };
        this.todo           = function (message /*, show */) {
            /**
             * Usage:
             *      todo("message")
             *      todo("message", true)
             * @param {String} message
             * @param {Boolean} show=false (Display button if true)
             *
             * @return {void}
             */
            verify('message', message);
            const show = (arguments && arguments.length>1 && verify("boolean", arguments[1]) ? arguments[1] : false);

            if (!aa.settings.production) {
                const spec = {
                    title: 'Todo:',
                    type: 'warning'
                };
                if (show) {
                    spec.action = {name: aa.uid()};
                }
                this.notif(message, spec);
            }
        };

        // Aliases:
        dialogTypes.filter((type) => { return (type !== "loading"); }).forEach((type) => {
            this[type] = (spec) => {
                return this.dialog(type, spec);
            };
        });
        this.info   = this.information;
        this.warn   = this.warning;
        this.window = this.win;
        this.notif  = this.notification;
    })());
    aa.icon                     = (() => {
        function FontAwesome4 () {
            this.data = [
                "glass",
                "music",
                "search",
                "envelope-o",
                "heart",
                "star",
                "star-o",
                "user",
                "film",
                "th-large",
                "th",
                "th-list",
                "check",
                "remove",
                "close",
                "times",
                "search-plus",
                "search-minus",
                "power-off",
                "signal",
                "gear",
                "cog",
                "trash-o",
                "home",
                "file-o",
                "clock-o",
                "road",
                "download",
                "arrow-circle-o-down",
                "arrow-circle-o-up",
                "inbox",
                "play-circle-o",
                "rotate-right",
                "repeat",
                "refresh",
                "list-alt",
                "lock",
                "flag",
                "headphones",
                "volume-off",
                "volume-down",
                "volume-up",
                "qrcode",
                "barcode",
                "tag",
                "tags",
                "book",
                "bookmark",
                "print",
                "camera",
                "font",
                "bold",
                "italic",
                "text-height",
                "text-width",
                "align-left",
                "align-center",
                "align-right",
                "align-justify",
                "list",
                "dedent",
                "outdent",
                "indent",
                "video-camera",
                "photo",
                "image",
                "picture-o",
                "pencil",
                "map-marker",
                "adjust",
                "tint",
                "edit",
                "pencil-square-o",
                "share-square-o",
                "check-square-o",
                "arrows",
                "step-backward",
                "fast-backward",
                "backward",
                "play",
                "pause",
                "stop",
                "forward",
                "fast-forward",
                "step-forward",
                "eject",
                "chevron-left",
                "chevron-right",
                "plus-circle",
                "minus-circle",
                "times-circle",
                "check-circle",
                "question-circle",
                "info-circle",
                "crosshairs",
                "times-circle-o",
                "check-circle-o",
                "ban",
                "arrow-left",
                "arrow-right",
                "arrow-up",
                "arrow-down",
                "mail-forward",
                "share",
                "expand",
                "compress",
                "plus",
                "minus",
                "asterisk",
                "exclamation-circle",
                "gift",
                "leaf",
                "fire",
                "eye",
                "eye-slash",
                "warning",
                "exclamation-triangle",
                "plane",
                "calendar",
                "random",
                "comment",
                "magnet",
                "chevron-up",
                "chevron-down",
                "retweet",
                "shopping-cart",
                "folder",
                "folder-open",
                "arrows-v",
                "arrows-h",
                "bar-chart-o",
                "bar-chart",
                "twitter-square",
                "facebook-square",
                "camera-retro",
                "key",
                "gears",
                "cogs",
                "comments",
                "thumbs-o-up",
                "thumbs-o-down",
                "star-half",
                "heart-o",
                "sign-out",
                "linkedin-square",
                "thumb-tack",
                "external-link",
                "sign-in",
                "trophy",
                "github-square",
                "upload",
                "lemon-o",
                "phone",
                "square-o",
                "bookmark-o",
                "phone-square",
                "twitter",
                "facebook-f",
                "facebook",
                "github",
                "unlock",
                "credit-card",
                "feed",
                "rss",
                "hdd-o",
                "bullhorn",
                "bell",
                "certificate",
                "hand-o-right",
                "hand-o-left",
                "hand-o-up",
                "hand-o-down",
                "arrow-circle-left",
                "arrow-circle-right",
                "arrow-circle-up",
                "arrow-circle-down",
                "globe",
                "wrench",
                "tasks",
                "filter",
                "briefcase",
                "arrows-alt",
                "group",
                "users",
                "chain",
                "link",
                "cloud",
                "flask",
                "cut",
                "scissors",
                "copy",
                "files-o",
                "paperclip",
                "save",
                "floppy-o",
                "square",
                "navicon",
                "reorder",
                "bars",
                "list-ul",
                "list-ol",
                "strikethrough",
                "underline",
                "table",
                "magic",
                "truck",
                "pinterest",
                "pinterest-square",
                "google-plus-square",
                "google-plus",
                "money",
                "caret-down",
                "caret-up",
                "caret-left",
                "caret-right",
                "columns",
                "unsorted",
                "sort",
                "sort-down",
                "sort-desc",
                "sort-up",
                "sort-asc",
                "envelope",
                "linkedin",
                "rotate-left",
                "undo",
                "legal",
                "gavel",
                "dashboard",
                "tachometer",
                "comment-o",
                "comments-o",
                "flash",
                "bolt",
                "sitemap",
                "umbrella",
                "paste",
                "clipboard",
                "lightbulb-o",
                "exchange",
                "cloud-download",
                "cloud-upload",
                "user-md",
                "stethoscope",
                "suitcase",
                "bell-o",
                "coffee",
                "cutlery",
                "file-text-o",
                "building-o",
                "hospital-o",
                "ambulance",
                "medkit",
                "fighter-jet",
                "beer",
                "h-square",
                "plus-square",
                "angle-double-left",
                "angle-double-right",
                "angle-double-up",
                "angle-double-down",
                "angle-left",
                "angle-right",
                "angle-up",
                "angle-down",
                "desktop",
                "laptop",
                "tablet",
                "mobile-phone",
                "mobile",
                "circle-o",
                "quote-left",
                "quote-right",
                "spinner",
                "circle",
                "mail-reply",
                "reply",
                "github-alt",
                "folder-o",
                "folder-open-o",
                "smile-o",
                "frown-o",
                "meh-o",
                "gamepad",
                "keyboard-o",
                "flag-o",
                "flag-checkered",
                "terminal",
                "code",
                "mail-reply-all",
                "reply-all",
                "star-half-empty",
                "star-half-full",
                "star-half-o",
                "location-arrow",
                "crop",
                "code-fork",
                "unlink",
                "chain-broken",
                "question",
                "info",
                "exclamation",
                "superscript",
                "subscript",
                "eraser",
                "puzzle-piece",
                "microphone",
                "microphone-slash",
                "shield",
                "calendar-o",
                "fire-extinguisher",
                "rocket",
                "maxcdn",
                "chevron-circle-left",
                "chevron-circle-right",
                "chevron-circle-up",
                "chevron-circle-down",
                "html5",
                "css3",
                "anchor",
                "unlock-alt",
                "bullseye",
                "ellipsis-h",
                "ellipsis-v",
                "rss-square",
                "play-circle",
                "ticket",
                "minus-square",
                "minus-square-o",
                "level-up",
                "level-down",
                "check-square",
                "pencil-square",
                "external-link-square",
                "share-square",
                "compass",
                "toggle-down",
                "caret-square-o-down",
                "toggle-up",
                "caret-square-o-up",
                "toggle-right",
                "caret-square-o-right",
                "euro",
                "eur",
                "gbp",
                "dollar",
                "usd",
                "rupee",
                "inr",
                "cny",
                "rmb",
                "yen",
                "jpy",
                "ruble",
                "rouble",
                "rub",
                "won",
                "krw",
                "bitcoin",
                "btc",
                "file",
                "file-text",
                "sort-alpha-asc",
                "sort-alpha-desc",
                "sort-amount-asc",
                "sort-amount-desc",
                "sort-numeric-asc",
                "sort-numeric-desc",
                "thumbs-up",
                "thumbs-down",
                "youtube-square",
                "youtube",
                "xing",
                "xing-square",
                "youtube-play",
                "dropbox",
                "stack-overflow",
                "instagram",
                "flickr",
                "adn",
                "bitbucket",
                "bitbucket-square",
                "tumblr",
                "tumblr-square",
                "long-arrow-down",
                "long-arrow-up",
                "long-arrow-left",
                "long-arrow-right",
                "apple",
                "windows",
                "android",
                "linux",
                "dribbble",
                "skype",
                "foursquare",
                "trello",
                "female",
                "male",
                "gittip",
                "gratipay",
                "sun-o",
                "moon-o",
                "archive",
                "bug",
                "vk",
                "weibo",
                "renren",
                "pagelines",
                "stack-exchange",
                "arrow-circle-o-right",
                "arrow-circle-o-left",
                "toggle-left",
                "caret-square-o-left",
                "dot-circle-o",
                "wheelchair",
                "vimeo-square",
                "turkish-lira",
                "try",
                "plus-square-o",
                "space-shuttle",
                "slack",
                "envelope-square",
                "wordpress",
                "openid",
                "institution",
                "bank",
                "university",
                "mortar-board",
                "graduation-cap",
                "yahoo",
                "google",
                "reddit",
                "reddit-square",
                "stumbleupon-circle",
                "stumbleupon",
                "delicious",
                "digg",
                "pied-piper-pp",
                "pied-piper-alt",
                "drupal",
                "joomla",
                "language",
                "fax",
                "building",
                "child",
                "paw",
                "spoon",
                "cube",
                "cubes",
                "behance",
                "behance-square",
                "steam",
                "steam-square",
                "recycle",
                "automobile",
                "car",
                "cab",
                "taxi",
                "tree",
                "spotify",
                "deviantart",
                "soundcloud",
                "database",
                "file-pdf-o",
                "file-word-o",
                "file-excel-o",
                "file-powerpoint-o",
                "file-photo-o",
                "file-picture-o",
                "file-image-o",
                "file-zip-o",
                "file-archive-o",
                "file-sound-o",
                "file-audio-o",
                "file-movie-o",
                "file-video-o",
                "file-code-o",
                "vine",
                "codepen",
                "jsfiddle",
                "life-bouy",
                "life-buoy",
                "life-saver",
                "support",
                "life-ring",
                "circle-o-notch",
                "ra",
                "resistance",
                "rebel",
                "ge",
                "empire",
                "git-square",
                "git",
                "y-combinator-square",
                "yc-square",
                "hacker-news",
                "tencent-weibo",
                "qq",
                "wechat",
                "weixin",
                "send",
                "paper-plane",
                "send-o",
                "paper-plane-o",
                "history",
                "circle-thin",
                "header",
                "paragraph",
                "sliders",
                "share-alt",
                "share-alt-square",
                "bomb",
                "soccer-ball-o",
                "futbol-o",
                "tty",
                "binoculars",
                "plug",
                "slideshare",
                "twitch",
                "yelp",
                "newspaper-o",
                "wifi",
                "calculator",
                "paypal",
                "google-wallet",
                "cc-visa",
                "cc-mastercard",
                "cc-discover",
                "cc-amex",
                "cc-paypal",
                "cc-stripe",
                "bell-slash",
                "bell-slash-o",
                "trash",
                "copyright",
                "at",
                "eyedropper",
                "paint-brush",
                "birthday-cake",
                "area-chart",
                "pie-chart",
                "line-chart",
                "lastfm",
                "lastfm-square",
                "toggle-off",
                "toggle-on",
                "bicycle",
                "bus",
                "ioxhost",
                "angellist",
                "cc",
                "shekel",
                "sheqel",
                "ils",
                "meanpath",
                "buysellads",
                "connectdevelop",
                "dashcube",
                "forumbee",
                "leanpub",
                "sellsy",
                "shirtsinbulk",
                "simplybuilt",
                "skyatlas",
                "cart-plus",
                "cart-arrow-down",
                "diamond",
                "ship",
                "user-secret",
                "motorcycle",
                "street-view",
                "heartbeat",
                "venus",
                "mars",
                "mercury",
                "intersex",
                "transgender",
                "transgender-alt",
                "venus-double",
                "mars-double",
                "venus-mars",
                "mars-stroke",
                "mars-stroke-v",
                "mars-stroke-h",
                "neuter",
                "genderless",
                "facebook-official",
                "pinterest-p",
                "whatsapp",
                "server",
                "user-plus",
                "user-times",
                "hotel",
                "bed",
                "viacoin",
                "train",
                "subway",
                "medium",
                "yc",
                "y-combinator",
                "optin-monster",
                "opencart",
                "expeditedssl",
                "battery-4",
                "battery",
                "battery-full",
                "battery-3",
                "battery-three-quarters",
                "battery-2",
                "battery-half",
                "battery-1",
                "battery-quarter",
                "battery-0",
                "battery-empty",
                "mouse-pointer",
                "i-cursor",
                "object-group",
                "object-ungroup",
                "sticky-note",
                "sticky-note-o",
                "cc-jcb",
                "cc-diners-club",
                "clone",
                "balance-scale",
                "hourglass-o",
                "hourglass-1",
                "hourglass-start",
                "hourglass-2",
                "hourglass-half",
                "hourglass-3",
                "hourglass-end",
                "hourglass",
                "hand-grab-o",
                "hand-rock-o",
                "hand-stop-o",
                "hand-paper-o",
                "hand-scissors-o",
                "hand-lizard-o",
                "hand-spock-o",
                "hand-pointer-o",
                "hand-peace-o",
                "trademark",
                "registered",
                "creative-commons",
                "gg",
                "gg-circle",
                "tripadvisor",
                "odnoklassniki",
                "odnoklassniki-square",
                "get-pocket",
                "wikipedia-w",
                "safari",
                "chrome",
                "firefox",
                "opera",
                "internet-explorer",
                "tv",
                "television",
                "contao",
                "500px",
                "amazon",
                "calendar-plus-o",
                "calendar-minus-o",
                "calendar-times-o",
                "calendar-check-o",
                "industry",
                "map-pin",
                "map-signs",
                "map-o",
                "map",
                "commenting",
                "commenting-o",
                "houzz",
                "vimeo",
                "black-tie",
                "fonticons",
                "reddit-alien",
                "edge",
                "credit-card-alt",
                "codiepie",
                "modx",
                "fort-awesome",
                "usb",
                "product-hunt",
                "mixcloud",
                "scribd",
                "pause-circle",
                "pause-circle-o",
                "stop-circle",
                "stop-circle-o",
                "shopping-bag",
                "shopping-basket",
                "hashtag",
                "bluetooth",
                "bluetooth-b",
                "percent",
                "gitlab",
                "wpbeginner",
                "wpforms",
                "envira",
                "universal-access",
                "wheelchair-alt",
                "question-circle-o",
                "blind",
                "audio-description",
                "volume-control-phone",
                "braille",
                "assistive-listening-systems",
                "asl-interpreting",
                "american-sign-language-interpreting",
                "deafness",
                "hard-of-hearing",
                "deaf",
                "glide",
                "glide-g",
                "signing",
                "sign-language",
                "low-vision",
                "viadeo",
                "viadeo-square",
                "snapchat",
                "snapchat-ghost",
                "snapchat-square",
                "pied-piper",
                "first-order",
                "yoast",
                "themeisle",
                "google-plus-circle",
                "google-plus-official",
                "fa",
                "font-awesome",
                "handshake-o",
                "envelope-open",
                "envelope-open-o",
                "linode",
                "address-book",
                "address-book-o",
                "vcard",
                "address-card",
                "vcard-o",
                "address-card-o",
                "user-circle",
                "user-circle-o",
                "user-o",
                "id-badge",
                "drivers-license",
                "id-card",
                "drivers-license-o",
                "id-card-o",
                "quora",
                "free-code-camp",
                "telegram",
                "thermometer-4",
                "thermometer",
                "thermometer-full",
                "thermometer-3",
                "thermometer-three-quarters",
                "thermometer-2",
                "thermometer-half",
                "thermometer-1",
                "thermometer-quarter",
                "thermometer-0",
                "thermometer-empty",
                "shower",
                "bathtub",
                "s15",
                "bath",
                "podcast",
                "window-maximize",
                "window-minimize",
                "window-restore",
                "times-rectangle",
                "window-close",
                "times-rectangle-o",
                "window-close-o",
                "bandcamp",
                "grav",
                "etsy",
                "imdb",
                "ravelry",
                "eercast",
                "microchip",
                "snowflake-o",
                "superpowers",
                "wpexplorer",
                "meetup"
            ];
        };
        aa.deploy(FontAwesome4.prototype, {
            format:     function (className) {
                if (!aa.nonEmptyString(className)) { throw new TypeError("Argument must be a non-empty String."); }
                return 'fa-'+className.trim();
            },
            getNode:    function (id, classes, args) {
                /**
                 * @param {array} classes
                 *
                 * @return {array}
                 */
                if (!aa.isArray(classes)) { throw new TypeError("Argument must be an Array."); }

                let nodeName = undefined;
                let suffix = '';
                classes.forEach((className) => {
                    if (this.has(className)) {
                        if (!nodeName) {
                            nodeName = "span.fa";
                        }
                        suffix += '.'+this.format(className);
                    } else {
                        suffix += '.'+className;
                    }
                });
                return (nodeName ?
                    aa.html.apply(undefined, [nodeName+suffix].concat(args))
                    : undefined
                );
            },
            gui:        function () {
            },
            has:        function (className) {
                if (!aa.nonEmptyString(className)) { throw new TypeError("Argument must be a non-empty String."); }
                className = className.trim();

                return this.data.has(className);
            },
            keys:       function () {

                return Object.freeze(this.data);
            }
        }, {force: true});

        function GoogleIconfont () {
            this.data = {
                "3d_rotation": "e84d",
                ac_unit: "eb3b",
                access_alarm: "e190",
                access_alarms: "e191",
                access_time: "e192",
                accessibility: "e84e",
                accessible: "e914",
                account_balance: "e84f",
                account_balance_wallet: "e850",
                account_box: "e851",
                account_circle: "e853",
                adb: "e60e",
                add: "e145",
                add_a_photo: "e439",
                add_alarm: "e193",
                add_alert: "e003",
                add_box: "e146",
                add_circle: "e147",
                add_circle_outline: "e148",
                add_location: "e567",
                add_shopping_cart: "e854",
                add_to_photos: "e39d",
                add_to_queue: "e05c",
                adjust: "e39e",
                airline_seat_flat: "e630",
                airline_seat_flat_angled: "e631",
                airline_seat_individual_suite: "e632",
                airline_seat_legroom_extra: "e633",
                airline_seat_legroom_normal: "e634",
                airline_seat_legroom_reduced: "e635",
                airline_seat_recline_extra: "e636",
                airline_seat_recline_normal: "e637",
                airplanemode_active: "e195",
                airplanemode_inactive: "e194",
                airplay: "e055",
                airport_shuttle: "eb3c",
                alarm: "e855",
                alarm_add: "e856",
                alarm_off: "e857",
                alarm_on: "e858",
                album: "e019",
                all_inclusive: "eb3d",
                all_out: "e90b",
                android: "e859",
                announcement: "e85a",
                apps: "e5c3",
                archive: "e149",
                arrow_back: "e5c4",
                arrow_downward: "e5db",
                arrow_drop_down: "e5c5",
                arrow_drop_down_circle: "e5c6",
                arrow_drop_up: "e5c7",
                arrow_forward: "e5c8",
                arrow_upward: "e5d8",
                art_track: "e060",
                aspect_ratio: "e85b",
                assessment: "e85c",
                assignment: "e85d",
                assignment_ind: "e85e",
                assignment_late: "e85f",
                assignment_return: "e860",
                assignment_returned: "e861",
                assignment_turned_in: "e862",
                assistant: "e39f",
                assistant_photo: "e3a0",
                attach_file: "e226",
                attach_money: "e227",
                attachment: "e2bc",
                audiotrack: "e3a1",
                autorenew: "e863",
                av_timer: "e01b",
                backspace: "e14a",
                backup: "e864",
                battery_alert: "e19c",
                battery_charging_full: "e1a3",
                battery_full: "e1a4",
                battery_std: "e1a5",
                battery_unknown: "e1a6",
                beach_access: "eb3e",
                beenhere: "e52d",
                block: "e14b",
                bluetooth: "e1a7",
                bluetooth_audio: "e60f",
                bluetooth_connected: "e1a8",
                bluetooth_disabled: "e1a9",
                bluetooth_searching: "e1aa",
                blur_circular: "e3a2",
                blur_linear: "e3a3",
                blur_off: "e3a4",
                blur_on: "e3a5",
                book: "e865",
                bookmark: "e866",
                bookmark_border: "e867",
                border_all: "e228",
                border_bottom: "e229",
                border_clear: "e22a",
                border_color: "e22b",
                border_horizontal: "e22c",
                border_inner: "e22d",
                border_left: "e22e",
                border_outer: "e22f",
                border_right: "e230",
                border_style: "e231",
                border_top: "e232",
                border_vertical: "e233",
                branding_watermark: "e06b",
                brightness_1: "e3a6",
                brightness_2: "e3a7",
                brightness_3: "e3a8",
                brightness_4: "e3a9",
                brightness_5: "e3aa",
                brightness_6: "e3ab",
                brightness_7: "e3ac",
                brightness_auto: "e1ab",
                brightness_high: "e1ac",
                brightness_low: "e1ad",
                brightness_medium: "e1ae",
                broken_image: "e3ad",
                brush: "e3ae",
                bubble_chart: "e6dd",
                bug_report: "e868",
                build: "e869",
                burst_mode: "e43c",
                business: "e0af",
                business_center: "eb3f",
                cached: "e86a",
                cake: "e7e9",
                call: "e0b0",
                call_end: "e0b1",
                call_made: "e0b2",
                call_merge: "e0b3",
                call_missed: "e0b4",
                call_missed_outgoing: "e0e4",
                call_received: "e0b5",
                call_split: "e0b6",
                call_to_action: "e06c",
                camera: "e3af",
                camera_alt: "e3b0",
                camera_enhance: "e8fc",
                camera_front: "e3b1",
                camera_rear: "e3b2",
                camera_roll: "e3b3",
                cancel: "e5c9",
                card_giftcard: "e8f6",
                card_membership: "e8f7",
                card_travel: "e8f8",
                casino: "eb40",
                cast: "e307",
                cast_connected: "e308",
                center_focus_strong: "e3b4",
                center_focus_weak: "e3b5",
                change_history: "e86b",
                chat: "e0b7",
                chat_bubble: "e0ca",
                chat_bubble_outline: "e0cb",
                check: "e5ca",
                check_box: "e834",
                check_box_outline_blank: "e835",
                check_circle: "e86c",
                chevron_left: "e5cb",
                chevron_right: "e5cc",
                child_care: "eb41",
                child_friendly: "eb42",
                chrome_reader_mode: "e86d",
                class: "e86e",
                clear: "e14c",
                clear_all: "e0b8",
                close: "e5cd",
                closed_caption: "e01c",
                cloud: "e2bd",
                cloud_circle: "e2be",
                cloud_done: "e2bf",
                cloud_download: "e2c0",
                cloud_off: "e2c1",
                cloud_queue: "e2c2",
                cloud_upload: "e2c3",
                code: "e86f",
                collections: "e3b6",
                collections_bookmark: "e431",
                color_lens: "e3b7",
                colorize: "e3b8",
                comment: "e0b9",
                compare: "e3b9",
                compare_arrows: "e915",
                computer: "e30a",
                confirmation_number: "e638",
                contact_mail: "e0d0",
                contact_phone: "e0cf",
                contacts: "e0ba",
                content_copy: "e14d",
                content_cut: "e14e",
                content_paste: "e14f",
                control_point: "e3ba",
                control_point_duplicate: "e3bb",
                copyright: "e90c",
                create: "e150",
                create_new_folder: "e2cc",
                credit_card: "e870",
                crop: "e3be",
                crop_16_9: "e3bc",
                crop_3_2: "e3bd",
                crop_5_4: "e3bf",
                crop_7_5: "e3c0",
                crop_din: "e3c1",
                crop_free: "e3c2",
                crop_landscape: "e3c3",
                crop_original: "e3c4",
                crop_portrait: "e3c5",
                crop_rotate: "e437",
                crop_square: "e3c6",
                dashboard: "e871",
                data_usage: "e1af",
                date_range: "e916",
                dehaze: "e3c7",
                delete: "e872",
                delete_forever: "e92b",
                delete_sweep: "e16c",
                description: "e873",
                desktop_mac: "e30b",
                desktop_windows: "e30c",
                details: "e3c8",
                developer_board: "e30d",
                developer_mode: "e1b0",
                device_hub: "e335",
                devices: "e1b1",
                devices_other: "e337",
                dialer_sip: "e0bb",
                dialpad: "e0bc",
                directions: "e52e",
                directions_bike: "e52f",
                directions_boat: "e532",
                directions_bus: "e530",
                directions_car: "e531",
                directions_railway: "e534",
                directions_run: "e566",
                directions_subway: "e533",
                directions_transit: "e535",
                directions_walk: "e536",
                disc_full: "e610",
                dns: "e875",
                do_not_disturb: "e612",
                do_not_disturb_alt: "e611",
                do_not_disturb_off: "e643",
                do_not_disturb_on: "e644",
                dock: "e30e",
                domain: "e7ee",
                done: "e876",
                done_all: "e877",
                donut_large: "e917",
                donut_small: "e918",
                drafts: "e151",
                drag_handle: "e25d",
                drive_eta: "e613",
                dvr: "e1b2",
                edit: "e3c9",
                edit_location: "e568",
                eject: "e8fb",
                email: "e0be",
                enhanced_encryption: "e63f",
                equalizer: "e01d",
                error: "e000",
                error_outline: "e001",
                euro_symbol: "e926",
                ev_station: "e56d",
                event: "e878",
                event_available: "e614",
                event_busy: "e615",
                event_note: "e616",
                event_seat: "e903",
                exit_to_app: "e879",
                expand_less: "e5ce",
                expand_more: "e5cf",
                explicit: "e01e",
                explore: "e87a",
                exposure: "e3ca",
                exposure_neg_1: "e3cb",
                exposure_neg_2: "e3cc",
                exposure_plus_1: "e3cd",
                exposure_plus_2: "e3ce",
                exposure_zero: "e3cf",
                extension: "e87b",
                face: "e87c",
                fast_forward: "e01f",
                fast_rewind: "e020",
                favorite: "e87d",
                favorite_border: "e87e",
                featured_play_list: "e06d",
                featured_video: "e06e",
                feedback: "e87f",
                fiber_dvr: "e05d",
                fiber_manual_record: "e061",
                fiber_new: "e05e",
                fiber_pin: "e06a",
                fiber_smart_record: "e062",
                file_download: "e2c4",
                file_upload: "e2c6",
                filter: "e3d3",
                filter_1: "e3d0",
                filter_2: "e3d1",
                filter_3: "e3d2",
                filter_4: "e3d4",
                filter_5: "e3d5",
                filter_6: "e3d6",
                filter_7: "e3d7",
                filter_8: "e3d8",
                filter_9: "e3d9",
                filter_9_plus: "e3da",
                filter_b_and_w: "e3db",
                filter_center_focus: "e3dc",
                filter_drama: "e3dd",
                filter_frames: "e3de",
                filter_hdr: "e3df",
                filter_list: "e152",
                filter_none: "e3e0",
                filter_tilt_shift: "e3e2",
                filter_vintage: "e3e3",
                find_in_page: "e880",
                find_replace: "e881",
                fingerprint: "e90d",
                first_page: "e5dc",
                fitness_center: "eb43",
                flag: "e153",
                flare: "e3e4",
                flash_auto: "e3e5",
                flash_off: "e3e6",
                flash_on: "e3e7",
                flight: "e539",
                flight_land: "e904",
                flight_takeoff: "e905",
                flip: "e3e8",
                flip_to_back: "e882",
                flip_to_front: "e883",
                folder: "e2c7",
                folder_open: "e2c8",
                folder_shared: "e2c9",
                folder_special: "e617",
                font_download: "e167",
                format_align_center: "e234",
                format_align_justify: "e235",
                format_align_left: "e236",
                format_align_right: "e237",
                format_bold: "e238",
                format_clear: "e239",
                format_color_fill: "e23a",
                format_color_reset: "e23b",
                format_color_text: "e23c",
                format_indent_decrease: "e23d",
                format_indent_increase: "e23e",
                format_italic: "e23f",
                format_line_spacing: "e240",
                format_list_bulleted: "e241",
                format_list_numbered: "e242",
                format_paint: "e243",
                format_quote: "e244",
                format_shapes: "e25e",
                format_size: "e245",
                format_strikethrough: "e246",
                format_textdirection_l_to_r: "e247",
                format_textdirection_r_to_l: "e248",
                format_underlined: "e249",
                forum: "e0bf",
                forward: "e154",
                forward_10: "e056",
                forward_30: "e057",
                forward_5: "e058",
                free_breakfast: "eb44",
                fullscreen: "e5d0",
                fullscreen_exit: "e5d1",
                functions: "e24a",
                g_translate: "e927",
                gamepad: "e30f",
                games: "e021",
                gavel: "e90e",
                gesture: "e155",
                get_app: "e884",
                gif: "e908",
                golf_course: "eb45",
                gps_fixed: "e1b3",
                gps_not_fixed: "e1b4",
                gps_off: "e1b5",
                grade: "e885",
                gradient: "e3e9",
                grain: "e3ea",
                graphic_eq: "e1b8",
                grid_off: "e3eb",
                grid_on: "e3ec",
                group: "e7ef",
                group_add: "e7f0",
                group_work: "e886",
                hd: "e052",
                hdr_off: "e3ed",
                hdr_on: "e3ee",
                hdr_strong: "e3f1",
                hdr_weak: "e3f2",
                headset: "e310",
                headset_mic: "e311",
                healing: "e3f3",
                hearing: "e023",
                help: "e887",
                help_outline: "e8fd",
                high_quality: "e024",
                highlight: "e25f",
                highlight_off: "e888",
                history: "e889",
                home: "e88a",
                hot_tub: "eb46",
                hotel: "e53a",
                hourglass_empty: "e88b",
                hourglass_full: "e88c",
                http: "e902",
                https: "e88d",
                image: "e3f4",
                image_aspect_ratio: "e3f5",
                import_contacts: "e0e0",
                import_export: "e0c3",
                important_devices: "e912",
                inbox: "e156",
                indeterminate_check_box: "e909",
                info: "e88e",
                info_outline: "e88f",
                input: "e890",
                insert_chart: "e24b",
                insert_comment: "e24c",
                insert_drive_file: "e24d",
                insert_emoticon: "e24e",
                insert_invitation: "e24f",
                insert_link: "e250",
                insert_photo: "e251",
                invert_colors: "e891",
                invert_colors_off: "e0c4",
                iso: "e3f6",
                keyboard: "e312",
                keyboard_arrow_down: "e313",
                keyboard_arrow_left: "e314",
                keyboard_arrow_right: "e315",
                keyboard_arrow_up: "e316",
                keyboard_backspace: "e317",
                keyboard_capslock: "e318",
                keyboard_hide: "e31a",
                keyboard_return: "e31b",
                keyboard_tab: "e31c",
                keyboard_voice: "e31d",
                kitchen: "eb47",
                label: "e892",
                label_outline: "e893",
                landscape: "e3f7",
                language: "e894",
                laptop: "e31e",
                laptop_chromebook: "e31f",
                laptop_mac: "e320",
                laptop_windows: "e321",
                last_page: "e5dd",
                launch: "e895",
                layers: "e53b",
                layers_clear: "e53c",
                leak_add: "e3f8",
                leak_remove: "e3f9",
                lens: "e3fa",
                library_add: "e02e",
                library_books: "e02f",
                library_music: "e030",
                lightbulb_outline: "e90f",
                line_style: "e919",
                line_weight: "e91a",
                linear_scale: "e260",
                link: "e157",
                linked_camera: "e438",
                list: "e896",
                live_help: "e0c6",
                live_tv: "e639",
                local_activity: "e53f",
                local_airport: "e53d",
                local_atm: "e53e",
                local_bar: "e540",
                local_cafe: "e541",
                local_car_wash: "e542",
                local_convenience_store: "e543",
                local_dining: "e556",
                local_drink: "e544",
                local_florist: "e545",
                local_gas_station: "e546",
                local_grocery_store: "e547",
                local_hospital: "e548",
                local_hotel: "e549",
                local_laundry_service: "e54a",
                local_library: "e54b",
                local_mall: "e54c",
                local_movies: "e54d",
                local_offer: "e54e",
                local_parking: "e54f",
                local_pharmacy: "e550",
                local_phone: "e551",
                local_pizza: "e552",
                local_play: "e553",
                local_post_office: "e554",
                local_printshop: "e555",
                local_see: "e557",
                local_shipping: "e558",
                local_taxi: "e559",
                location_city: "e7f1",
                location_disabled: "e1b6",
                location_off: "e0c7",
                location_on: "e0c8",
                location_searching: "e1b7",
                lock: "e897",
                lock_open: "e898",
                lock_outline: "e899",
                looks: "e3fc",
                looks_3: "e3fb",
                looks_4: "e3fd",
                looks_5: "e3fe",
                looks_6: "e3ff",
                looks_one: "e400",
                looks_two: "e401",
                loop: "e028",
                loupe: "e402",
                low_priority: "e16d",
                loyalty: "e89a",
                mail: "e158",
                mail_outline: "e0e1",
                map: "e55b",
                markunread: "e159",
                markunread_mailbox: "e89b",
                memory: "e322",
                menu: "e5d2",
                merge_type: "e252",
                message: "e0c9",
                mic: "e029",
                mic_none: "e02a",
                mic_off: "e02b",
                mms: "e618",
                mode_comment: "e253",
                mode_edit: "e254",
                monetization_on: "e263",
                money_off: "e25c",
                monochrome_photos: "e403",
                mood: "e7f2",
                mood_bad: "e7f3",
                more: "e619",
                more_horiz: "e5d3",
                more_vert: "e5d4",
                motorcycle: "e91b",
                mouse: "e323",
                move_to_inbox: "e168",
                movie: "e02c",
                movie_creation: "e404",
                movie_filter: "e43a",
                multiline_chart: "e6df",
                music_note: "e405",
                music_video: "e063",
                my_location: "e55c",
                nature: "e406",
                nature_people: "e407",
                navigate_before: "e408",
                navigate_next: "e409",
                navigation: "e55d",
                near_me: "e569",
                network_cell: "e1b9",
                network_check: "e640",
                network_locked: "e61a",
                network_wifi: "e1ba",
                new_releases: "e031",
                next_week: "e16a",
                nfc: "e1bb",
                no_encryption: "e641",
                no_sim: "e0cc",
                not_interested: "e033",
                note: "e06f",
                note_add: "e89c",
                notifications: "e7f4",
                notifications_active: "e7f7",
                notifications_none: "e7f5",
                notifications_off: "e7f6",
                notifications_paused: "e7f8",
                offline_pin: "e90a",
                ondemand_video: "e63a",
                opacity: "e91c",
                open_in_browser: "e89d",
                open_in_new: "e89e",
                open_with: "e89f",
                pages: "e7f9",
                pageview: "e8a0",
                palette: "e40a",
                pan_tool: "e925",
                panorama: "e40b",
                panorama_fish_eye: "e40c",
                panorama_horizontal: "e40d",
                panorama_vertical: "e40e",
                panorama_wide_angle: "e40f",
                party_mode: "e7fa",
                pause: "e034",
                pause_circle_filled: "e035",
                pause_circle_outline: "e036",
                payment: "e8a1",
                people: "e7fb",
                people_outline: "e7fc",
                perm_camera_mic: "e8a2",
                perm_contact_calendar: "e8a3",
                perm_data_setting: "e8a4",
                perm_device_information: "e8a5",
                perm_identity: "e8a6",
                perm_media: "e8a7",
                perm_phone_msg: "e8a8",
                perm_scan_wifi: "e8a9",
                person: "e7fd",
                person_add: "e7fe",
                person_outline: "e7ff",
                person_pin: "e55a",
                person_pin_circle: "e56a",
                personal_video: "e63b",
                pets: "e91d",
                phone: "e0cd",
                phone_android: "e324",
                phone_bluetooth_speaker: "e61b",
                phone_forwarded: "e61c",
                phone_in_talk: "e61d",
                phone_iphone: "e325",
                phone_locked: "e61e",
                phone_missed: "e61f",
                phone_paused: "e620",
                phonelink: "e326",
                phonelink_erase: "e0db",
                phonelink_lock: "e0dc",
                phonelink_off: "e327",
                phonelink_ring: "e0dd",
                phonelink_setup: "e0de",
                photo: "e410",
                photo_album: "e411",
                photo_camera: "e412",
                photo_filter: "e43b",
                photo_library: "e413",
                photo_size_select_actual: "e432",
                photo_size_select_large: "e433",
                photo_size_select_small: "e434",
                picture_as_pdf: "e415",
                picture_in_picture: "e8aa",
                picture_in_picture_alt: "e911",
                pie_chart: "e6c4",
                pie_chart_outlined: "e6c5",
                pin_drop: "e55e",
                place: "e55f",
                play_arrow: "e037",
                play_circle_filled: "e038",
                play_circle_outline: "e039",
                play_for_work: "e906",
                playlist_add: "e03b",
                playlist_add_check: "e065",
                playlist_play: "e05f",
                plus_one: "e800",
                poll: "e801",
                polymer: "e8ab",
                pool: "eb48",
                portable_wifi_off: "e0ce",
                portrait: "e416",
                power: "e63c",
                power_input: "e336",
                power_settings_new: "e8ac",
                pregnant_woman: "e91e",
                present_to_all: "e0df",
                print: "e8ad",
                priority_high: "e645",
                public: "e80b",
                publish: "e255",
                query_builder: "e8ae",
                question_answer: "e8af",
                queue: "e03c",
                queue_music: "e03d",
                queue_play_next: "e066",
                radio: "e03e",
                radio_button_checked: "e837",
                radio_button_unchecked: "e836",
                rate_review: "e560",
                receipt: "e8b0",
                recent_actors: "e03f",
                record_voice_over: "e91f",
                redeem: "e8b1",
                redo: "e15a",
                refresh: "e5d5",
                remove: "e15b",
                remove_circle: "e15c",
                remove_circle_outline: "e15d",
                remove_from_queue: "e067",
                remove_red_eye: "e417",
                remove_shopping_cart: "e928",
                reorder: "e8fe",
                repeat: "e040",
                repeat_one: "e041",
                replay: "e042",
                replay_10: "e059",
                replay_30: "e05a",
                replay_5: "e05b",
                reply: "e15e",
                reply_all: "e15f",
                report: "e160",
                report_problem: "e8b2",
                restaurant: "e56c",
                restaurant_menu: "e561",
                restore: "e8b3",
                restore_page: "e929",
                ring_volume: "e0d1",
                room: "e8b4",
                room_service: "eb49",
                rotate_90_degrees_ccw: "e418",
                rotate_left: "e419",
                rotate_right: "e41a",
                rounded_corner: "e920",
                router: "e328",
                rowing: "e921",
                rss_feed: "e0e5",
                rv_hookup: "e642",
                satellite: "e562",
                save: "e161",
                scanner: "e329",
                schedule: "e8b5",
                school: "e80c",
                screen_lock_landscape: "e1be",
                screen_lock_portrait: "e1bf",
                screen_lock_rotation: "e1c0",
                screen_rotation: "e1c1",
                screen_share: "e0e2",
                sd_card: "e623",
                sd_storage: "e1c2",
                search: "e8b6",
                security: "e32a",
                select_all: "e162",
                send: "e163",
                sentiment_dissatisfied: "e811",
                sentiment_neutral: "e812",
                sentiment_satisfied: "e813",
                sentiment_very_dissatisfied: "e814",
                sentiment_very_satisfied: "e815",
                settings: "e8b8",
                settings_applications: "e8b9",
                settings_backup_restore: "e8ba",
                settings_bluetooth: "e8bb",
                settings_brightness: "e8bd",
                settings_cell: "e8bc",
                settings_ethernet: "e8be",
                settings_input_antenna: "e8bf",
                settings_input_component: "e8c0",
                settings_input_composite: "e8c1",
                settings_input_hdmi: "e8c2",
                settings_input_svideo: "e8c3",
                settings_overscan: "e8c4",
                settings_phone: "e8c5",
                settings_power: "e8c6",
                settings_remote: "e8c7",
                settings_system_daydream: "e1c3",
                settings_voice: "e8c8",
                share: "e80d",
                shop: "e8c9",
                shop_two: "e8ca",
                shopping_basket: "e8cb",
                shopping_cart: "e8cc",
                short_text: "e261",
                show_chart: "e6e1",
                shuffle: "e043",
                signal_cellular_4_bar: "e1c8",
                signal_cellular_connected_no_internet_4_bar: "e1cd",
                signal_cellular_no_sim: "e1ce",
                signal_cellular_null: "e1cf",
                signal_cellular_off: "e1d0",
                signal_wifi_4_bar: "e1d8",
                signal_wifi_4_bar_lock: "e1d9",
                signal_wifi_off: "e1da",
                sim_card: "e32b",
                sim_card_alert: "e624",
                skip_next: "e044",
                skip_previous: "e045",
                slideshow: "e41b",
                slow_motion_video: "e068",
                smartphone: "e32c",
                smoke_free: "eb4a",
                smoking_rooms: "eb4b",
                sms: "e625",
                sms_failed: "e626",
                snooze: "e046",
                sort: "e164",
                sort_by_alpha: "e053",
                spa: "eb4c",
                space_bar: "e256",
                speaker: "e32d",
                speaker_group: "e32e",
                speaker_notes: "e8cd",
                speaker_notes_off: "e92a",
                speaker_phone: "e0d2",
                spellcheck: "e8ce",
                star: "e838",
                star_border: "e83a",
                star_half: "e839",
                stars: "e8d0",
                stay_current_landscape: "e0d3",
                stay_current_portrait: "e0d4",
                stay_primary_landscape: "e0d5",
                stay_primary_portrait: "e0d6",
                stop: "e047",
                stop_screen_share: "e0e3",
                storage: "e1db",
                store: "e8d1",
                store_mall_directory: "e563",
                straighten: "e41c",
                streetview: "e56e",
                strikethrough_s: "e257",
                style: "e41d",
                subdirectory_arrow_left: "e5d9",
                subdirectory_arrow_right: "e5da",
                subject: "e8d2",
                subscriptions: "e064",
                subtitles: "e048",
                subway: "e56f",
                supervisor_account: "e8d3",
                surround_sound: "e049",
                swap_calls: "e0d7",
                swap_horiz: "e8d4",
                swap_vert: "e8d5",
                swap_vertical_circle: "e8d6",
                switch_camera: "e41e",
                switch_video: "e41f",
                sync: "e627",
                sync_disabled: "e628",
                sync_problem: "e629",
                system_update: "e62a",
                system_update_alt: "e8d7",
                tab: "e8d8",
                tab_unselected: "e8d9",
                tablet: "e32f",
                tablet_android: "e330",
                tablet_mac: "e331",
                tag_faces: "e420",
                tap_and_play: "e62b",
                terrain: "e564",
                text_fields: "e262",
                text_format: "e165",
                textsms: "e0d8",
                texture: "e421",
                theaters: "e8da",
                thumb_down: "e8db",
                thumb_up: "e8dc",
                thumbs_up_down: "e8dd",
                time_to_leave: "e62c",
                timelapse: "e422",
                timeline: "e922",
                timer: "e425",
                timer_10: "e423",
                timer_3: "e424",
                timer_off: "e426",
                title: "e264",
                toc: "e8de",
                today: "e8df",
                toll: "e8e0",
                tonality: "e427",
                touch_app: "e913",
                toys: "e332",
                track_changes: "e8e1",
                traffic: "e565",
                train: "e570",
                tram: "e571",
                transfer_within_a_station: "e572",
                transform: "e428",
                translate: "e8e2",
                trending_down: "e8e3",
                trending_flat: "e8e4",
                trending_up: "e8e5",
                tune: "e429",
                turned_in: "e8e6",
                turned_in_not: "e8e7",
                tv: "e333",
                unarchive: "e169",
                undo: "e166",
                unfold_less: "e5d6",
                unfold_more: "e5d7",
                update: "e923",
                usb: "e1e0",
                verified_user: "e8e8",
                vertical_align_bottom: "e258",
                vertical_align_center: "e259",
                vertical_align_top: "e25a",
                vibration: "e62d",
                video_call: "e070",
                video_label: "e071",
                video_library: "e04a",
                videocam: "e04b",
                videocam_off: "e04c",
                videogame_asset: "e338",
                view_agenda: "e8e9",
                view_array: "e8ea",
                view_carousel: "e8eb",
                view_column: "e8ec",
                view_comfy: "e42a",
                view_compact: "e42b",
                view_day: "e8ed",
                view_headline: "e8ee",
                view_list: "e8ef",
                view_module: "e8f0",
                view_quilt: "e8f1",
                view_stream: "e8f2",
                view_week: "e8f3",
                vignette: "e435",
                visibility: "e8f4",
                visibility_off: "e8f5",
                voice_chat: "e62e",
                voicemail: "e0d9",
                volume_down: "e04d",
                volume_mute: "e04e",
                volume_off: "e04f",
                volume_up: "e050",
                vpn_key: "e0da",
                vpn_lock: "e62f",
                wallpaper: "e1bc",
                warning: "e002",
                watch: "e334",
                watch_later: "e924",
                wb_auto: "e42c",
                wb_cloudy: "e42d",
                wb_incandescent: "e42e",
                wb_iridescent: "e436",
                wb_sunny: "e430",
                wc: "e63d",
                web: "e051",
                web_asset: "e069",
                weekend: "e16b",
                whatshot: "e80e",
                widgets: "e1bd",
                wifi: "e63e",
                wifi_lock: "e1e1",
                wifi_tethering: "e1e2",
                work: "e8f9",
                wrap_text: "e25b",
                youtube_searched_for: "e8fa",
                zoom_in: "e8ff",
                zoom_out: "e900",
                zoom_out_map: "e56b",
            };
        };
        aa.deploy(GoogleIconfont.prototype, {
            format:     function (className) {
                if (!aa.nonEmptyString(className)) { throw new TypeError("Argument must be a non-empty String."); }
                className = className.trim();
            },
            getNode:    function (id, classes, args) {
                /**
                 * @param {array} classes
                 *
                 * @return {array}
                 */
                if (!aa.isArray(classes)) { throw new TypeError("Argument must be an Array."); }

                let span = undefined;
                let suffix = '';
                const content = [];
                classes.forEach((className) => {
                    if (this.has(className)) {
                        if (!span) {
                            span = "span.material-icons";
                        }
                        content.push(className);
                    } else {
                        suffix += '.'+className;
                    }
                });
                return (span ?
                    aa.html.apply(undefined, [span+suffix].concat(content).concat(args))
                    : undefined
                );
            },
            gui:        function () {
            },
            has:        function (className) {
                if (!aa.nonEmptyString(className)) { throw new TypeError("Argument must be a non-empty String."); }
                className = className.trim();

                return this.data.hasOwnProperty(className);
            },
            keys:       function () {

                return Object.freeze(this.data.keys());
            }
        }, {force: true});

        const func = function (which, ...args) {
            /**
             * @param {string} which
             *
             * @return {DOMElement}
             */

            const fonts = [FontAwesome4, GoogleIconfont /* */];

            // Display GUI:
            if (which === "gui" && !aa.settings.production) {
                let searchValue = '';
                let win;
                const spec = {
                    onglets: []
                };
                aa.gui.loading(() => {
                    fonts.forEach(font => {
                        const filter = (e) => {
                            const value = e.target.value;
                            searchValue = value;
                            const regex = new RegExp(value);
                            grid.children.forEach((row) => {
                                row.classList[((row.dataset && row.dataset.key.match(regex)) ? "remove" : "add")]("hidden");
                            });
                            let found = false;
                            grid.childNodes.forEach((row) => {
                                if (row.dataset && row.dataset.key.match(regex)) {
                                    found = true;
                                }
                            })
                            noMatch.classList[(found ? "add" : "remove")]("hidden");
                        };
                        const obj = new font();
                        const grid = $$("div.grid");
                        const noMatch = $$("div.row.grey.italic.hidden", "No match");
                        const search = $$("input.search", {
                            placeholder: "Search for a class name...",
                            on: {
                                input: aa.debounce(filter, 200),
                                click: filter
                            }
                        });
                        spec.onglets.push({
                            border: false,
                            name: "aafw-fonts",
                            label: obj.constructor.name,
                            text: (() => {
                                obj.keys().forEach(key => {
                                    grid.appendChild($$("div.row", {dataset: {key: key}},
                                        $$("div.cell", {style: "min-width: fit-content;"},
                                            $$("button.ico", (() => {
                                                const options = {style: "margin: 2px;", title: key};
                                                return (font === GoogleIconfont ?
                                                    aa.icon("icon."+key, options)
                                                    : $$("icon.fw."+key, options)
                                                );
                                            })(), {
                                                tooltip: $$("tooltip", {
                                                    text: "Copy into clipboard",
                                                }),
                                                on: {click: e => {
                                                    navigator.clipboard.writeText(key).then(
                                                        () => {},
                                                        () => {aa.gui.notif("You're not allowed to write into the clipboard.", {type: "critical"});},
                                                    );
                                                }}
                                            })
                                        ),
                                        $$("div.cell",
                                            $$("span", key),
                                        )
                                    ));
                                });
                                const div = $$("fieldset.scrollable",
                                    grid,
                                    noMatch
                                );
                                return $$("div",
                                    search,
                                    div
                                );
                            })(),
                            on: {
                                check: () => {
                                    search.value = searchValue;
                                    search.click()
                                    search.select();
                                },
                            }
                        });
                    });
                    win = aa.gui.win({
                        id: "icons-gui",
                        title: "Fonts",
                        buttons: false,
                        text: $$("div", spec),
                        on: {show: e => {
                            els("#aaDialog-icons-gui", dialog => {
                                aa.wait(100, () => {
                                    const input = dialog.querySelector("input.search");
                                    input?.focus();
                                });
                            });
                        }}
                    });
                }, () => {
                });
                return;
            }
            const extracts = aa.extractClassNameAndID(which);
            const {id, tagName} = extracts;
            let {classes} = extracts;
            let node = undefined;
            fonts.forEach((Font) => {
                const font = new Font();
                const result = font.getNode(id, classes, args);
                if (result && !node) {
                    node = result;
                }
            });
            return node;
        };
        Object.defineProperty(func, `gui`, {
            get: () => {
                return () => {
                    func(`gui`);
                };
            }
        })
        return Object.freeze(func);
    })();
    /* aa.Selectable */ (() => {
        aa.Selectable               = function (/* dimensions */) {
            const dimensions = aa.arg.optional(arguments, 0, 1, aa.isInt);
            aa.defineAccessors.call(this, {
                privates: {
                    collection: []
                }
            });
            for (let i = 0; i < dimensions; i++) {
                get(this, 'collection').push([]);
            }
        };
        aa.Selectable.prototype = Object.create(Array.prototype);
        aa.deploy(aa.Selectable.prototype, {
            select: function (...index) {
                log('Selectable:', index);
            }
        }, { force: true });
    })();
    aa.newInstancer             = function (/* spec */) {
        const defaultSpec = {
            getter: get,
            setter: set
        };
        const spec = arguments && arguments.length && aa.isObject(arguments[0]) ? Object.assign(defaultSpec, arguments[0]) : defaultSpec;
        if (!aa.isObject(spec)) { throw new TypeError("Argument must be an Object."); }

        spec.verify({
            getter: aa.isFunction,
            setter: aa.isFunction
        });
        // spec.getter = spec.getter || get;
        // spec.setter = spec.setter || set;
        const {getter, setter} = spec;

        const Instancer = function () {
        
            // Accessors:
            aa.defineAccessors.call(this, {
                publics: {
                },
                execute: {
                    all:        function () {
                        return getter(this, 'index');
                    },
                    classes:    function () {
                        return getter(this, 'classes');
                    }
                },
                privates: {
                    index: {},
                    classes: {}
                }
            }, spec);

            // Private methods:
            const newID         = function () {
                let id = null;
                do {
                    id = aa.uid();
                } while (getter(this, 'index').hasOwnProperty(id));
                return id;
            };
            const newInstance   = function (id, className, args) {
                if (!aa.nonEmptyString(id)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!aa.nonEmptyString(className)) { throw new TypeError("Second argument must be a non-empty String."); }
                if (!aa.isArray(args)) { throw new TypeError("Third argument must be an Array."); }

                const classes = getter(this, 'classes');
                if (!classes.hasOwnProperty(className)) { throw new TypeError("Class '"+className+"' not indexed."); }
                const cls = classes[className];
                const instance = Object.create(cls.prototype);
                cls.apply(instance, args);
                if (instance.id !== undefined) {
                    id = instance.id;
                }
                if (instance.id === undefined || instance.id === null) {
                    instance.id = id;
                }
                return instance;
            };
            const updateIndex   = function (id, instance) {
                if (!aa.nonEmptyString(id)) { throw new TypeError("ID must be a non-empty String."); }

                const index = getter(this, 'index');
                index[id] = instance;
                setter(this, 'index', index);
            };

            // Public methods:
            aa.deploy(Instancer.prototype, {
                declare:    function (className, cls) {
                    if (!aa.nonEmptyString(className)) { throw new TypeError("First argument must be a non-empty String."); }
                    if (!aa.isFunction(cls)) { throw new TypeError("Second argument must be a Function or a Class."); }

                    const classes = getter(this, 'classes');
                    classes[className.trim()] = cls;
                    setter(this, 'classes', classes);
                },
                new:        function (className /*, args */) {
                    const args = arguments && arguments.length > 1 ? arguments[1] : [];

                    const id = newID.call(this);
                    const instance = newInstance.call(this, id, className, args);
                    updateIndex.call(this, instance.id, instance);

                    return instance;
                },
                get:        function (id) {
                    if (!aa.nonEmptyString(id)) { throw new TypeError("First argument must be a non-empty String."); }

                    id = id.trim();
                    return getter(this, 'index')[id];
                },
                remove:     function (id) {
                    if (!aa.nonEmptyString(id)) { throw new TypeError("First argument must be a non-empty String."); }

                    id = id.trim();
                    const instance = getter(this, 'index')[id];
                    if (instance) {
                        const index = getter(this, 'index');
                        delete index[id];
                        setter(this, 'index', index);
                    }

                    return instance;
                },

                // Getters:
                // Setters:
            }, {
                force: true,
                condition: (Instancer.prototype.hydrate === undefined)
            });
        };
        return new Instancer();
    };
    aa.lang = {

        // Variables:
        lang: null,
        re: /^[a-zA-Z0-9\_]+(\.[a-zA-Z0-9\_]+)*$/,
        dict: {
            en: {
                action: {
                    accept:     'Accept',
                    cancel:     'Cancel',
                    close:      'Close',
                    never:      'Never',
                    no:         'No',
                    ok:         'Ok',
                    publish:    'Publish',
                    reset:      'Reset',
                    save:       'Save',
                    send:       'Send',
                    show:       'Show',
                    submit:     'Submit',
                    validate:   'Valid',
                    yes:        'Yes'
                },
                punctuation: {
                    apostrophe: "'",
                    brackets: {
                        start: ' [',
                        end: '] '
                    },
                    comma: ', ',
                    colon: ': ',
                    dash: '-',
                    exclamation: '! ',
                    parenthesis: {
                        start: ' (',
                        end: ') '
                    },
                    period: '. ',
                    question: '? ',
                    doubleQuotes: {
                        start: '"',
                        end: '"'
                    },
                    semicolon: '; ',
                    zzz: null
                },
                semaine: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],
                mois: ['january','february','march','april','may','june','july','august','september','october','november','december']
            },
            fr: {
                action: {
                    accept:     'Accepter',
                    cancel:     'Annuler',
                    close:      'Fermer',
                    never:      'Jamais',
                    no:         'Non',
                    ok:         'Ok',
                    publish:    'Publier',
                    reset:      'Réinitialiser',
                    save:       'Enregistrer',
                    send:       'Envoyer',
                    show:       'Afficher',
                    submit:     'Soumettre',
                    validate:   'Valider',
                    yes:        'Oui'
                },
                punctuation: {
                    apostrophe: "'",
                    brackets: {
                        start: ' [',
                        end: '] '
                    },
                    comma: ', ',
                    colon: '&nbsp;: ',
                    dash: '-',
                    exclamation: '! ',
                    parenthesis: {
                        start: ' (',
                        end: ') '
                    },
                    period: '. ',
                    question: '&nbsp;? ',
                    doubleQuotes: {
                        start: ' «&nbsp;',
                        end: '&nbsp;» '
                    },
                    semicolon: '&nbsp;; ',
                    zzz: null
                },
                semaine: ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
                mois: ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
            }
        },

        // Functions:
        set: function (p) {
            if (!aa.nonEmptyString(p)) {
                throw new TypeError("Lang argument must be a non-empty String.");
                return false;
            }
        },
        get: function (p) {
            if (!aa.nonEmptyString(p)) {
                throw new TypeError("Word argument must be a non-empty String.");
                return undefined;
            }
            if (!p.match(aa.lang.re)) {
                throw new Error("Word not found.");
                return undefined;
            }
            let lang = aa.getLang();
            if (lang) {
                if (aa.lang.dict.hasOwnProperty(lang)) {
                    lang = aa.lang.dict[lang];
                    const keys = p.split('.');
                    keys.forEach(function (key, i) {
                        if (lang && lang.hasOwnProperty(key)) {
                            lang = lang[key];
                            return true;
                        }
                        lang = undefined;
                        return false;
                    });
                    if (aa.isString(lang)) {
                        return lang;
                    }
                }
            }
            return undefined;
        },
    };
    aa.mouse = (() => {
        const privates = {
            x: 0,
            y: 0,
            absoluteX: 0,
            absoluteY: 0,
        };
        const mouse = {};
        Object.defineProperties(mouse, {
            x: {
                get: () => privates.x,
                set: value => {},
            },
            y: {
                get: () => privates.y,
                set: value => {},
            },
            absoluteX: {
                get: () => privates.absoluteX,
                set: value => {},
            },
            absoluteY: {
                get: () => privates.absoluteY,
                set: value => {},
            },
            getX: {
                get: () => function () {
                    return privates.x;
                },
            },
            getY: {
                get: () => function () {
                    return privates.y;
                },
            },
            onMove: {
                get: () => function (e) {
                    if (arguments.length) {
                        let evt = window.event || arguments[0];
                        
                        if (!aa.browser.is('ie')) {
                            privates.x = evt.clientX;
                            privates.y = evt.clientY;
                            privates.absoluteX = evt.pageX;
                            privates.absoluteY = evt.pageY;
                        } else {
                            privates.x = event.clientX;
                            privates.y = event.clientY;
                            privates.absoluteX = event.clientX + document.body.scrollLeft;
                            privates.absoluteY = event.clientY + document.body.scrollTop;
                        }
                        
                        aa.events.execute("mousemove", e);
                        
                        return {
                            x: privates.x,
                            y: privates.y,
                            absoluteX: privates.absoluteX,
                            absoluteY: privates.absoluteY
                        };
                    }
                },
            }
        });
        return Object.freeze(mouse);
    })();
    aa.shortcut                 = Object.freeze(new (function () {

        // Attributes:
        const re = /^(([a-z\+]+)\s)?\<(.+)\>$/i;
        const specialKeys = ["ctrl", "alt", "shift", "cmd"];
        const chars = {
            ctrl: '^',
            alt: '⌥',
            shift: '⇧',
            cmd: '⌘'
        };
        const keyCodes    = {
            8: "Backspace",
            9: "Tab",
            13: "Enter",
            27: "Esc",
            32: "Spacebar",
            33: "PageUp",
            34: "PageDown",
            35: "End",
            36: "Home",
            37: "Left",
            39: "Right",
            38: "Up",
            40: "Down",
            46: "Del",
            106: "Star",
            // 107: "+",
            // 109: "Dash",
            // 189: "Dash",
            
            16: "Shift",
            17: "Ctrl",
            18: "Alt",
            91: "Cmd"
        };
        const charMap = {
            alt: { symbol: "⌥" },
            cmd: { symbol: "⌘" },
            ctrl: { symbol: "^" },
            shift: { symbol: "⇧" },

            backspace: { symbol: "⌫" },
            capslock: { symbol: "⇪" },
            dash: { symbol: "-" },
            del: { symbol: null },
            down: { symbol: "↓" },
            end: { symbol: "⇲" }, // ↘
            enter: { symbol: "↵" },
            esc: { symbol: null },
            home: { symbol: "⇱" }, // ↖
            left: { symbol: "←" },
            pagedown: { symbol: "⇟" },
            pageup: { symbol: "⇞" },
            right: { symbol: "→" },
            spacebar: { symbol: "Space bar" },
            star: { symbol: "*" },
            tab: { symbol: "⇥" }, // ↹
            up: { symbol: "↑" }
        };
        const verify = aa.prototypes.verify({
            appName: aa.nonEmptyString,
            callback: aa.isFunction,
            defaultValue: arg => (!arg || aa.nonEmptyString(arg)),
            evtName: aa.nonEmptyString,
            shortcut: str => (aa.nonEmptyString(str) && str.match(re)),
        });
        const btnText = "add a shortcut";

        let isGuiOpened = false;
        let node = null;
        let dialog = null;
        let restoreNode = null;
        let searchNode = null;
        let dico = [];
        let byTitle = {};
        let byShortcuts = {};
        let shortcuts = {};
        const os = aa.browser.getOS();

        // functions:
        const gui = {
            // Methods:
            filter:     function (search) {
                search = search.trim();
                search = search.replace(/\s/gi, ".*");
                
                const cssTR = "hidden";
                const cssSearch = "wrong";

                let count   = 0;
                let re      = null;
                let isRegex = false;
                try {
                    re = new RegExp(search, "i");
                    isRegex = true;
                } catch (e) {
                }
                if (isRegex) {
                    if (searchNode) {
                        searchNode.classList.remove(cssSearch);
                        searchNode.title = "";
                    }
                    if (node) {
                        node.children.forEach((tr) => {
                            if (tr.id !== "aaShortcuts-actionNotFound") {
                                if (tr.children[1].innerText.trim().toLowerCase().match(re)) {
                                    tr.classList.remove(cssTR);
                                    count += 1;
                                } else {
                                    tr.classList.add(cssTR);
                                }
                            }
                        });
                    }
                    el("aaShortcuts-actionNotFound", (tr) => {
                        tr.classList[!search || count ? "add" : "remove"]("hidden");
                    }, () => {
                        if (search && !count) {
                            if (node) {
                                node.appendChild(aa.html("tr#aaShortcuts-actionNotFound", aa.html("td.gris", "<i>No action matches the request.</i>")));
                            }
                        }
                    });
                } else if (searchNode) {
                    searchNode.classList.add(cssSearch);
                    searchNode.title = "RegExp not valid.";
                }
                if (dialog) {
                    dialog.resize();
                }
            },
            refresh:    function (appName) {
                node.clear();
                
                dico.forEach((title) => {
                    const action = byTitle[title].action;
                    const parts = (action.description ? action.description : action.name).match(/^(.*\:)?([^\:]*)$/);
                    let text = '';
                    if (parts) {
                        text = (parts[1] !== undefined ? "<b>"+parts[1]+"</b>" : '')+parts[2];
                    }

                    const tr = aa.html("tr",
                        (() => {
                            const td = aa.html("td#aaShortcutValue-"+action.name, {style: "min-width: 160px; text-align: right;"});
                            let empty = true;
                            shortcuts[action.name].forEach((s) => {
                                empty = false;
                                td.appendChild(gui.getButton(appName, s, action));
                            });
                            if (empty) {
                                td.appendChild(gui.getButton(appName, null, action));
                            }
                            return td;
                        })(),
                        aa.html("td", text, {style: "width: 100%;"})
                    );
                    node.appendChild(tr);
                });
                gui.filter(searchNode.value);
                // searchNode.focus();
                searchNode.select();
            },
            reload:     function (appName) {
                
                // Initialize:
                dico = [];
                byTitle = {};
                byShortcuts = {};
                shortcuts = {};

                // Load:
                aa.actionManager.getFrom({app: appName, accessible: true}).forEach((action) => {
                    const title = (action.description ? action.description+'-'+action.name : action.name);
                    if (!dico.has(title)) {
                        dico.push(title);
                    }
                    byTitle[title] = {
                        action: action,
                        shortcuts: []
                    };
                    shortcuts[action.name] = [];
                });
                aa.events.app(appName).getEvents().forEach((events, evtName) => {
                    events.forEach((event) => {
                        if (event) {
                            const action = event.action;
                            if (action.accessible) {
                                if (!shortcuts.hasOwnProperty(action.name)) {
                                    shortcuts[action.name] = [];
                                }
                                shortcuts[action.name].push(evtName);
                                if (byShortcuts[evtName] === undefined) {
                                    byShortcuts[evtName] = [];
                                }
                                byShortcuts[evtName].push(action);
                            }
                        }
                    });
                });
                dico = dico.sortNatural();
            },
            reset:      function () {
                node = null;
                dialog = null;
                restoreNode = null;
                searchNode = null;
                dico = [];
                byTitle = {};
                byShortcuts = {};
                shortcuts = {};
            },
            show:       function (appName, spec={}) {
                aa.arg.test(spec, aa.verifyObject({
                    on: aa.isObjectOfFunctions
                }), "'spec'");
                spec.sprinkle({
                    on: {}
                });

                // Display window:
                dialog = aa.gui.window({
                    escape:     true,
                    buttons:    false,
                    width:      720,
                    title:      "Edit shortcuts",
                    text:       gui.getNode(appName),
                    on: {
                        resize: () => {
                            spec.on?.resize?.();
                        },
                        hide: () => {
                            gui.reset();
                            isGuiOpened = false;
                            spec.on?.hide?.();
                        }
                    }
                });
                
                // Display list:
                gui.refresh(appName);
            },

            // Getters:
            getButton:  function (appName, s, action) {
                return aa.html("button.link.key#aaAction-btn-"+action.name, {
                    title: "Edit shortcut",
                    text: (s ? aa.shortcut.format(s, ["css"]) : btnText),
                    on: {
                        click: ((s, action) => {
                            return () => {
                                const spec = {
                                    app: action.app,
                                    on: {
                                        submit: (shortcut) => {
                                            if (shortcut !== undefined) {

                                                // Shortcut String changed:
                                                if (shortcut !== s) {
                                                    const doit = () => {
                                                        if (s) {
                                                            aa.events.app(appName).dissociate(s);
                                                        }
                                                        if (shortcut !== null) {
                                                            aa.events.app(appName).on(shortcut, action, ["preventDefault"]);
                                                        }
                                                        gui.reload(appName);
                                                        gui.refresh(appName);
                                                        aa.events.storage.update(appName, action, s, shortcut);
                                                        action.fire("shortcutchange", shortcut);
                                                    };
                                                    if (shortcut) {
                                                        const events = aa.events.app(action.app).getEvents(shortcut);
                                                        if (events && events.length) {
                                                            const previous = events.last.action;
                                                            aa.gui.confirm({
                                                                text: "Shortcut "+aa.shortcut.format(shortcut, ["css"])+" is already assigned to <b>"+previous.getDescription()+"</b>.<br><br>Are you sure you would like to assign it to <b>"+action.getDescription()+"</b>?",
                                                                on: { submit: () => {
                                                                    doit();
                                                                } }
                                                            });
                                                        } else {
                                                            doit();
                                                        }
                                                    } else {
                                                        doit();
                                                    }
                                                }
                                            }
                                        }
                                    }
                                };
                                if (s) {
                                    spec.defaultValue = s;
                                }
                                aa.gui.shortcut(spec);
                            };
                        })(s, action)
                    }
                });
            },
            getNode:    function (appName) {
                restoreNode = aa.html("button.link", {
                    text: "Restore default",
                    on: {
                        click: (e) => {
                            aa.events.restoreShortcuts(appName);
                            gui.reload(appName);
                            gui.refresh();
                        }
                    }
                });
                searchNode = aa.html("input", {
                    value: '',
                    placeholder: "Search by action...",
                    on: {
                        change: (e) => {
                            gui.filter(e.target.value);
                        },
                        keyup: (e) => {
                            gui.filter(e.target.value);
                        }
                    }
                });
                node = aa.html("table");
                return aa.html("div",
                    aa.html("div",
                        aa.html("label", searchNode)
                    ),
                    aa.html("fieldset.scrollable", {style: "max-height: 240px;"},
                        node
                    ),
                    aa.html("div.right", restoreNode)
                );
            }
        };

        // Methods:
        this.cmdOrCtrl  = function (shortcut) {
            verify("evtName", shortcut);

            const cmdOrCtrl = (os === "mac" ? "cmd" : "ctrl");
            return shortcut
                .replace(/cmdOrCtrl/gi, cmdOrCtrl)
                .replace(/ctrlOrCmd/gi, cmdOrCtrl)
            ;
        };
        this.format     = function (str /*, options,  */) {
            /**
             * @param {String} str
             * @param {Array} options (optional)
             *
             * @return {String}
             */
            const allowedOptions = ["htmlEncode", "simple", "css"];

            // Verify arguments integrity:
            verify("shortcut", str);
            if (arguments && arguments.length>1) {
                if (!aa.isArray(arguments[1])) { throw new TypeError("Second argument must be an Array."); }
                if (arguments[1].verify((v) => { return allowedOptions.has(v); })) { throw new TypeError("Invalid items found in second argument."); }
            }
            const options = (arguments && arguments.length>1 ? arguments[1] : []);

            // Main:
            str = aa.shortcut.cmdOrCtrl(str);
            const o = {};
            const matches = str.match(re);
            let prefix = matches[2] || null;
            const specials = [];
            const key = matches.last;
            const css = function (str) {
                return (options.has("css") ? '<span class="keyboardKey">'+str+'</span>' : str);
            };
            const symbolize = function (key) {
                const lower = key.toLowerCase();
                return (charMap.hasOwnProperty(lower) && charMap[lower].symbol ? charMap[lower].symbol : key);
            };
            if (prefix) {
                prefix = (function () {
                    const list = prefix.split('+');
                    specialKeys.filter((specialKey) => {
                        return list.has(specialKey);
                    }).forEach((key) => {
                        specials.push(key);
                    });
                    return specials.join('+');
                })();
            }
            if (os === "mac") {
                str = str.replace(/[a-z\+]+\s/gi, '');
                prefix = (specials.reduce((acc, special) => {
                    return acc+css(chars[special]);
                }, ''));
                str = str.replace(/clavier\_/i,'')
                    .replace(/\_/g,'')
                ;
            } else {
                if (options.has("css")) {
                    prefix = (specials.reduce((acc, special) => {
                        acc = acc+css(special.firstToUpper());
                        return acc;
                    }, ''));
                }
                str = str.replace(/clavier/i,'')
                    .replace(/\_/,'')
                ;
            }
            if (options.has("css")) {
                str = (prefix || '')+css(symbolize(key));
            } else {
                str = (prefix ? prefix+' ' : '')+(options.has("simple") ? symbolize(key) : '<'+key+'>');
                str = (options.has("htmlEncode") ? str.htmlEncode() : str);
            }
            return str;
        };
        this.gui        = function (appName, spec={}) {
            verify("appName", appName);
            aa.arg.test(spec, aa.verifyObject({
                on: aa.isObjectOfFunctions
            }), "'spec'");
            spec.sprinkle({
                on: {}
            });

            if (!isGuiOpened) {
                isGuiOpened = true;

                aa.gui.loading(
                    
                    // loading:
                    () => {
                        gui.reset();
                        gui.reload(appName);
                    },
                    
                    // Resolved:
                    () => { gui.show(appName, {
                        ...(spec.on && {on: spec.on})
                    }); },
                    
                    // Rejected:
                    () => { aa.gui.warn("An error occured."); }
                );
            }
        };
        this.isValid    = function (str) {

            return (aa.nonEmptyString(str) ? !!this.cmdOrCtrl(str).match(re) : false);
        };
        this.rename     = function (str) {
            if (!aa.nonEmptyString(str)) { throw new TypeError("Argument must be a non-empty String."); }

            let res = re.exec(str);
            if (res) {
                if (res[2] !== undefined) {
                    const specials = res[2].split('+');
                    const key = res[3];
                    res = specialKeys.filter((special) => {
                        return specials.has(special);
                    }).join('+')+' <'+key+'>';
                    return res;
                }
            }
            return str;
        };

        // Getters:
        this.get = function (event) {
            if (event.constructor && event.constructor.name) {
                if (event.constructor.name === "KeyboardEvent") {
                    if (!["Alt", "Meta", "Shift", "Control"].has(event.key)) {
                        let key = null;
                        const prefix = (specialKeys.filter((specialKey) => {
                            const special = (specialKey === "cmd" ? "meta" : specialKey);
                            return event[special+"Key"];
                        })).join('+');
                        
                        if (aa.inbetween(event.keyCode, 65, 90)) {
                            key = String.fromCharCode(event.keyCode).toUpperCase();
                        } else
                        if(aa.inbetween(event.keyCode, 112, 123)) {
                            key = 'F'+(event.keyCode-111);
                        } else if(keyCodes.hasOwnProperty(event.keyCode)) {
                            key = keyCodes[event.keyCode];
                        } else if (event.key.toLowerCase() === "dead"){
                            key = event.code;
                        } else {
                            key = event.key;
                        }
                        const str = (prefix ? prefix+' ' : '')+'<'+key+'>';
                        return str;
                    }
                } else if (
                    event.constructor.name === "MouseEvent"
                    || event.constructor.name === "PointerEvent"
                    || event.constructor.name === "Event"
                ) {
                    const parts = [];
                    const prefix = (specialKeys.filter((specialKey) => {
                        const special = (specialKey === "cmd" ? "meta" : specialKey);
                        return event[special+"Key"];
                    })).join('+');
                    if (prefix) {
                        parts.push(prefix);
                    }
                    const button = (event.button === 0 ?
                        ''
                        : event.button === 1 ?
                            'Middle'
                            : 'Right'
                    );
                    parts.push('<'+button+'Click>');
                    return parts.join(' ');
                }
            }

            return null;
        };
    })());

    // Functions:
    aa.action                   = Object.freeze(function (name /*, resolve, reject */) {
        /**
         * @param {string} name
         * @param {function} resolve (optional)
         * @param {function} reject (optional)
         *
         * @return {aa.Action}
         */
        aa.arg.test(name, aa.nonEmptyString, "'name'");
        const resolve   = aa.arg.optional(arguments, 1, undefined, aa.isFunction);
        const reject    = aa.arg.optional(arguments, 2, undefined, aa.isFunction);

        const action = aa.actionManager.get(name);

        if (action && resolve) {
            resolve(action);
        }
        if (!action && reject) {
            reject({
                name: name,
                message: "Not found"
            });
        }

        return Object.freeze(action);
    });
    aa.Animation                = (() => {
        /**
         * Events:
         *      - onstart
         *      - onpause
         *      - onresume
         *      - onstop
         */
        function Animation () { get(Animation, `construct`).apply(this, arguments); }
        const blueprint = {
            accessors: {
                publics: {},
                privates: {
                    callback:   null,
                    delay:      null,
                    id:         null
                },
                read: {
                    isPlaying: false
                },
                execute: {}
            },
            verifiers: {
                callback:   aa.isFunction,
                delay:      aa.isStrictlyPositiveInt,
                id:         aa.isStrictlyPositiveInt,
            },
            construct: function (delay, callback) {
                aa.arg.test(delay, blueprint.verifiers.delay, `'delay'`);
                aa.arg.test(callback, blueprint.verifiers.callback, `'callback'`);

                set(this, `callback`, callback);
                set(this, `delay`, delay);
                set(this, `isPlaying`, false);
            },
            startHydratingWith: [],
            methods: {
                publics: {
                    draw:   function () {
                        if (get(this, `id`)) {
                            get(this, `callback`).call(this);
                            emit.call(this, 'drawn');
                        }
                    },
                    start:  function () {
                        if (get(this, `id`)) {
                            this.resume();
                            return;
                        }
                        set(this, `isPlaying`, true);
                        
                        const delay = get(this, `delay`);
                        let previousTime = Date.now();
                        
                        emit.call(this, 'start');
                        const draw = () => {
                            const isPlaying = get(this, `isPlaying`);
                            const now = Date.now();
                            
                            if (isPlaying) {
                                if (now >= previousTime + delay) {
                                    previousTime = now;
                                    get(this, `callback`).call(this);
                                    emit.call(this, 'drawn');
                                }
                            }
                            set(this, `id`, requestAnimationFrame(draw));
                        }
                        set(this, `id`, requestAnimationFrame(draw));
                    },
                    pause:  function () {
                        if (get(this, `id`)) {
                            set(this, `isPlaying`, false);
                            emit.call(this, 'pause');
                        }
                    },
                    resume: function () {
                        if (get(this, `id`)) {
                            set(this, `isPlaying`, true);
                            emit.call(this, 'resume');
                        }
                    },
                    stop:   function () {
                        cancelAnimationFrame(get(this, `id`));
                        set(this, `id`, null);
                        set(this, `isPlaying`, false);
                        emit.call(this, 'stop');
                    },
                }
            },
            statics: {}
        };
        const emit = aa.manufacture(Animation, blueprint, {get, set}).emitter;
        return Animation;
    })();
    aa.SelectionMatrix          = (() => {
        const {get, set} = aa.mapFactory();
        function getAccessor (that) { return aa.getAccessor.call(that, {get, set}); }
        // ----------------
        const SelectionMatrix = (() => {
            const commands = {
                next:       function () {
                    const that = getAccessor(this);
                },
                previous:   function () {
                    const that = getAccessor(this);
                },
                expandTo:   function (...indexes) {
                    const that = getAccessor(this);
                },
                add:        function (index) {
                    const that = getAccessor(this);
                },
                toggle:        function (index) {
                    const that = getAccessor(this);
                },
            };
            function SelectionMatrix () { get(SelectionMatrix, 'construct').apply(this, arguments); }
            const blueprint = {
                accessors: {
                    publics: {
                        collection:     null,
                        dimension:      1,
                        lengths:        null,
                        on:             {}
                    },
                    privates: {
                        list:           null,
                        _lastSelected:  null,
                    },
                    read: {
                        id:             null,
                    },
                    execute: {
                        lastSelected:   function () {
                            const that = getAccessor(this);
                            return Object.freeze([...that._lastSelected]);
                        },
                    }
                },
                startHydratingWith: ['dimension'],
                construct: function () {
                    const that = getAccessor(this);
                    
                    that._lastSelected  = [];
                    that.id             = aa.uid(16);
                    that.lengths        = [1];
                    that.list           = [];
                },
                methods: {
                    publics: {
                        diagram: function () {
                            const that = getAccessor(this);
                            const diamonds = $$('div');
                            const node = $$('section.SelectionMatrix',
                                diamonds
                            );
                            const diamond = (new SelectionMatrixItem({
                                // selected: true,
                                parent: this
                            }));
                            diamonds.appendChild(diamond.node);
                            document.body.appendChild(node);
                        },
                        exec: function (cmd) {
                            aa.arg.test(cmd, blueprint.verifiers.commands, "'cmd'");
                            commands[cmd].call(this);
                            return this;
                        },
                        pos: function (...indexes) {
                            aa.arg.test(indexes, aa.isArrayOf(aa.isPositiveInt), "'indexes' must be an Array of positive integers");

                            const that = getAccessor(this);
                            let itemPointer = that.collection;

                            aa.throwErrorIf(!that.collection, "Collection reference is null.");

                            indexes.forEach((index, i) => {
                                aa.throwErrorIf(
                                    index > itemPointer.length - 1,
                                    `${Number.toOrdinal(i+1)} index (${index}) is out of range.`
                                );
                                itemPointer = itemPointer[index];
                            });

                            const methods = {
                                exec: function (cmd) {
                                    aa.arg.test(cmd, blueprint.verifiers.commands, "'command'");

                                    const that = getAccessor(this);

                                    switch (cmd) {
                                    case '<Click>':
                                    case 'alt <Click>':
                                        break;
                                    
                                    case 'shift <Click>':
                                    case 'alt+shift <Click>':
                                        break;
                                    
                                    case 'cmd <Click>':
                                    case 'alt+cmd <Click>':
                                    case 'ctrl <Click>':
                                    case 'alt+ctrl <Click>':
                                        break;
                                    }
                                },
                                get: function () {
                                },
                                set: function (value) {
                                    const that = getAccessor(this);

                                    let list = that.list;
                                    indexes.forEach((index, depth) => {
                                        if (!aa.isArray(list[index])) {
                                            list[index] = [];
                                        }
                                        if (depth < indexes.length-1) {
                                            list = list[index];
                                        } else {
                                            const item = new SelectionMatrixItem({ value });
                                            list[index] = item;
                                        }
                                    });
                                }
                            };
                            return Object.freeze(methods.bind(this));
                        }
                    },
                    setters: {
                        collection:     function (collection) {
                            const that = getAccessor(this);

                            const verifyCollectionInDepth = (depth, collection) => {
                                aa.throwErrorIf(
                                    !blueprint.verifiers.collection(collection),
                                    "Every dimension of SelectionMatrix must be a Collection.",
                                    TypeError
                                );

                                if (depth < that.dimension) {
                                    collection.forEach(item => {
                                        verifyCollectionInDepth(depth+1, collection);
                                    });
                                }
                            };
                            verifyCollectionInDepth(0, collection);
                            
                            collection.on('datamodified', () => {
                                verifyCollectionInDepth(0, that.collection);
                            });
                            that.collection = collection;
                        },
                    }
                },
                verifiers: {
                    collection:     arg => arg instanceof aa.Collection,
                    commands:       aa.inArray(Object.keys(commands)),
                    dimension:      aa.isStrictlyPositiveInt,
                    lengths:        aa.isArrayOf(aa.isStrictlyPositiveInt),
                    list:           aa.isArray,
                    on:             aa.verifyObject({
                        select:     aa.isFunction,
                        deselect:   aa.isFunction,
                    })
                }
            };
            aa.manufacture(SelectionMatrix, blueprint, {get, set});
            return SelectionMatrix;
        })();
        // ----------------
        const SelectionMatrixItem = (() => {
            function SelectionMatrixItem () { get(SelectionMatrixItem, 'construct').apply(this, arguments); }
            const view = {
                getNode: function () {
                    return $$(`div.diamond${this.selected ? '.selected' : ''}`,
                        $$('span.diamond.top-left'),
                        $$('span.diamond.top-right'),
                        $$('span.diamond.left'),
                        $$('span.diamond.right'),
                        $$('span.diamond.bottom-left'),
                        $$('span.diamond.bottom-right'),
                        {on: {click: e => {
                            this.parent.pos().exec(aa.shortcut.get(e));
                        }
                    }});
                }
            };
            const blueprint = {
                accessors: {
                    publics: {
                        parent:     null,
                        selected:   false,
                        value:      undefined
                    },
                    privates: {
                        list: null,
                        lastClickedItem: null
                    },
                    read: {
                    },
                    execute: {
                        empty:  function () { return this.value === undefined; },
                        node:   function () { return view.getNode.call(this); }
                    }
                },
                construct: function () {
                    const that = getAccessor(this);
                    that.list = [];
                },
                verifiers: {
                    parent:     arg => arg instanceof SelectionMatrix,
                    selected:   aa.isBool,
                    value:      aa.any
                }
            };
            aa.manufacture(SelectionMatrixItem, blueprint, {get, set});
            return SelectionMatrixItem;
        })();
        // ----------------
        return SelectionMatrix;
    })();
    aa.bake                     = function (query /*, spec */) {
        aa.arg.test(query, aa.nonEmptyString, "'query'");
        const spec = aa.arg.optional(arguments, 1, {}, aa.verifyObject({
            label:      aa.isString,
            style:      aa.isString,
            value:      value => aa.isString(value) || isNumber(value),
            name:       aa.nonEmptyString,
            placeholder: aa.nonEmptyString,
            checked:    aa.isBool,
            readonly:   aa.isBool,
            disabled:   aa.isBool,
            on:         aa.isObjectOfFunctions
        }));
        query = aa.selectorSplit(query);
        aa.throwErrorIf(!query.tag, "Can not bake. Argument's tag option must be provided.", TypeError);

        const privates = {
            build:      function (query, spec) {
                const that = privates.getAccessor(this);

                switch (query.tag.toLowerCase()) {
                case 'tooltip':
                    that.contentNode = aa.html('div.text');
                    that.node = (() => {
                        const container = aa.html('div.tooltip-container',
                            aa.html('div.tooltip-anchor',
                                aa.html('div.arrow'),
                                that.contentNode
                            )
                        );
                        return container;
                    })();
                    break;
                default:
                    that.node = aa.html('div', spec);
                    that.contentNode = that.node;
                    break;
                }

                switch (query.tag.toLowerCase()) {
                case 'tooltip':
                    break;

                default:
                    break;
                }
            },
            construct:  function (query, spec) {
                aa.defineAccessors.call(this, {
                    publics: {
                        node:  null,
                    },
                    privates: {
                        contentNode:    null
                    },
                    read: {},
                    execute: {},
                }, {getter: get, setter: set});
                Object.defineProperties(this, {
                    content: {
                        get: () => {},
                        set: value => {},
                    },
                    text: {
                        get: () => {},
                        set: value => {},
                    },
                });
                privates.build.call(this, query, spec);
            },
            getAccessor: function (thisArg) {
                return aa.getAccessor.call(thisArg, {get, set});
            }
        };

        function Node (query, spec) {
            privates.construct.apply(this, arguments);
        }
        aa.deploy(Node.prototype, {
            clear:      function () {
                const that = privates.getAccessor(this);
                that.contentNode.innerHTML = '';
            },
            removeNode: function () {
                const that = privates.getAccessor(this);
                that.node.removeNode();
            }
        }, {force: true});

        return new Node(query, spec);
    };
    aa.cook                     = Object.freeze(function (name, spec={}) {
        /**
         * @param {string} name
         * @param {object} spec
         *
         * @return {DOMElement}
         *
         * How to use:
            aa.cook("checkbox", {
                checked:    boolean,
                disabled:   boolean,
                dataset:    string{},
                id:         string,
                label:      string,
                mixable:    boolean,
                mixed:      boolean,
                name:       string,
                value:      string,
                on: {
                    mix:    function,
                    click:  function
                }
            });
         */
        aa.arg.test(name, aa.nonEmptyString, "'name'");
        // const spec = (arguments && arguments.length > 1 ? arguments[1] : {});

        aa.throwErrorIf(!aa.isObject(spec), "Second argument must be an Object.", TypeError);
        aa.throwErrorIf(spec.mixed !== undefined && !aa.isBool(spec.mixed), "Spec 'mixed' must be a Boolean.", TypeError);
        aa.throwErrorIf(spec.mixable !== undefined && !aa.isBool(spec.mixable), "Spec 'mixable' must be a Boolean.", TypeError);
        aa.throwErrorIf(spec.dataset !== undefined && !aa.isObjectOfStrings(spec.dataset), "Spec 'dataset' must be an Object of Strings.", TypeError);
        aa.throwErrorIf(spec.hasOwnProperty('on') && !aa.isObjectOfFunctions(spec.on), "Spec 'on' must be an Object of Functions.", TypeError);

        spec.on ??= {};

        const {tagName, id, classes} = aa.extractClassNameAndID(name);

        let elt = undefined;
        let temp;
        el("aafw_temp", (node) => {
            temp = node;
        }, () => {
            temp = $$("div#aafw_temp", {style: "display: none;"});
            document.body.appendChild(temp);
        });
        const getElement = (tagName) => {
            let editStarted = false;
            let container   = undefined;
            let input       = undefined;
            let mixed       = undefined;
            let node        = undefined;
            
            const getInput = () => {
                if (!node) {
                    let span = null;
                    node = $$("label");
                    if (
                        spec.label
                        && (
                            aa.isString(spec.label)
                            || aa.isNode(spec.label)
                        )
                    ) {
                        span = $$("text", spec.label);
                    }
                    input = $$(tagName,
                        spec.ignoreKeys("label", "mixable", "mixed")
                    );
                    const events = {
                        blur: () => {
                            if (spec.mixable && !editStarted) {
                                node.insertAfter(getMixed());
                                temp.appendChild(node);
                            }
                        },
                        input: () => {
                            editStarted = true;
                        }
                    };
                    events.forEach((callback, evtName) => {
                        input.on(evtName, callback);
                    });
                    node.appendChild(input);
                    if (span) {
                        node.appendChild(span);
                    }
                }
                return node;
            };
            const getMixed = () => {
                if (!mixed) {
                    delete(spec.mixed);
                    mixed = $$("button."+(!["textarea", "button"].has(tagName) ? "input" : tagName)+".mixed",
                        {
                            disabled: !!spec.disabled,
                            on: {click: () => {
                                mixed.insertAfter(getInput());
                                temp.appendChild(mixed);
                                const method = (tagName === "input" ? "select" : "focus");
                                input[method]();
                            }}
                        },
                        $$("div.table",
                            $$("div.cell",
                                $$("span.fa.fa-"+(!spec.disabled ? "clone" : "clone")),
                                tagName.firstToUpper()+" mixed values"+(!spec.disabled ? " (click to edit)" : '')
                            )
                        )
                    );
                    if (spec.style) {
                        mixed.setAttribute("style", spec.style);
                    }
                }
                return mixed;
            };
            
            if (spec.mixed) {
                container = getMixed();
            } else {
                container = getInput();
            }
            return container;
        };

        switch(tagName.toLowerCase()) {
            case "select":
            case "textarea":
            case "button":
            case "file":
            case "password":
            case "hidden":
            case "number":
            case "range":
            case "reset":
            case "submit":
            case "input":
                elt = getElement(tagName);
                break;
            
            case "checkbox":
            case "radio":
                elt = (() => {
                    let constructing    = true;
                    let elt             = undefined;
                    let mixed           = undefined;
                    let node            = undefined;

                    const getTxt = () => {
                        let txt;
                        if (
                            spec.label
                            && (
                                aa.isString(spec.label)
                                || aa.isNode(spec.label)
                            )
                        ) {
                            txt = $$("span", spec.label);
                        } else if (spec.value && aa.isString(spec.value)) {
                            txt = $$("span", spec.value);
                        }
                        return txt;
                    };
                    const getInputSingleton = () => {
                        if (!node) {
                            node = node || $$("label.cooked"+(spec.disabled ? ".disabled" : ''));
                            const input = $$(tagName+(!!id ? '#'+id : '')+(classes.length ? '.'+classes.join('.') : ''),
                                spec.ignoreKeys("label", "mixable", "mixed")
                            );
                            input.on('click', e => {
                            });
                            input.on("input", (e) => {
                                if (spec.mixable && spec.mixable === true && input.checked === true) {
                                    if (events.onmix) {
                                        events.onmix.call();
                                    }
                                    spec.mixed = true;
                                    temp.appendChild(getTxt());
                                    getInputSingleton().insertAfter(getMixedSingleton());
                                    temp.appendChild(getInputSingleton());
                                } else {
                                    if (input.checked) {
                                        if (events.oncheck) {
                                            events.oncheck.call();
                                        }
                                    } else {
                                        if (events.onuncheck) {
                                            events.onuncheck.call();
                                        }
                                    }
                                }
                            });
                            node.appendChild(input);
                            const buttonSpec = {
                                disabled: !!spec.disabled,
                                // on: {click: e => {
                                //     e.preventDefault();
                                //     spec.on.click?.(e);
                                //     input.click(e);
                                // }}
                            };
                            if (spec.dataset) { buttonSpec.dataset = spec.dataset; }
                            const btn = $$("button.text",
                                $$("span.unchecked.fa.fa-fw.fa-"+(tagName.toLowerCase() === "checkbox" ? "square-o" : "circle-thin")),
                                $$("span.checked.fa.fa-fw.fa-"+(tagName.toLowerCase() === "checkbox" ? "check-square" : "circle")),
                                buttonSpec
                            );
                            if (spec.on.blur) {         btn.on('blur', spec.on.blur); }
                            if (spec.on.focus) {        btn.on('focus', spec.on.focus); }
                            if (spec.on.input) {        input.on('input', spec.on.input); }
                            if (spec.on.click) {        node.on('click', spec.on.click); }
                            if (spec.on.contextmenu) {  node.on('contextmenu', spec.on.contextmenu); }
                            if (spec.on.mousedown) {    node.on('mousedown', spec.on.mousedown); }
                            if (spec.on.mouseout) {     node.on('mouseout', spec.on.mouseout); }
                            if (spec.on.mouseover) {    node.on('mouseover', spec.on.mouseover); }
                            if (spec.on.mouseup) {      node.on('mouseup', spec.on.mouseup); }

                            node.appendChild(btn);
                            const txt = getTxt();
                            if (txt) {
                                node.appendChild(txt);
                            }
                            Object.defineProperties(node, {

                                // Attributes:
                                checked: {
                                    get: () => input.checked,
                                    set: checked => {
                                        aa.arg.test(checked, aa.isBool, "'checked'");
                                        input.checked = checked;
                                    }
                                },
                                disabled: {
                                    get: () => input.disabled,
                                    set: disabled => {
                                        aa.arg.test(disabled, aa.isBool, "'disabled'");
                                        input.disabled = disabled;
                                    }
                                },
                                required: {
                                    get: () => input.required,
                                    set: required => {
                                        aa.arg.test(required, aa.isBool, "'required'");
                                        input.required = required;
                                    }
                                },

                                // Methods:
                                blur:   { get: () => { return btn.blur; }},
                                focus:  { get: () => { return btn.focus; }},
                                click:  { get: () => { return input.click; }},
                            });
                        }
                        return node;
                    };
                    const getMixedSingleton = () => {
                        aa.throwErrorIf(
                            spec.hasOwnProperty("on") && spec.on.some((callback, evtName)=> !aa.isFunction(callback)),
                            "Spec 'on' must be an Array of Functions.",
                            TypeError
                        );
                        aa.throwErrorIf(!aa.nonEmptyString(spec.value), "'value' attribute must be defined for mixed input.");

                        if (!mixed) {
                            mixed = $$("button.text.mixed",
                                $$("span.mixed.fa.fa-fw.fa-"+(tagName.toLowerCase() === "checkbox" ? "minus-square-o" : "dot-circle-o")),
                                getTxt(),
                                $$("checkbox.hidden", {
                                    name: "mixed_"+(spec.name ? spec.name : ''),
                                    checked: true,
                                    value: spec.value
                                }),
                                {
                                    disabled: (spec.disabled && spec.disabled === true),
                                    style: "display: inline-block; width: fit-content;",
                                    dataset: {value: spec.value},
                                    on: {click: () => {
                                        if (events.oncheck) {
                                            events.oncheck.call();
                                        }
                                        spec.checked = true;
                                        temp.appendChild(getTxt());
                                        getMixedSingleton().insertAfter(getInputSingleton());
                                        temp.appendChild(getMixedSingleton());
                                        mixed.focus();
                                    }}
                                }
                            );
                            mixed.checked = true;
                            if (spec.hasOwnProperty("on")) {
                                spec.on.forEach((callback, evtName) => {
                                    mixed.on(evtName, callback);
                                });
                            }

                            // Pilot wrapped input:
                            [
                                'checked',
                                'disabled',
                                'required'
                            ].forEach(attr => {
                                Object.defineProperty(mixed, attr, {
                                    get: () => getInputSingleton()[attr],
                                    set: value => {
                                        getInputSingleton()[attr] = value;
                                    },
                                });
                            });
                        }
                        if (!constructing && events.onmix) {
                            // events.onmix.call();
                        }
                        return mixed;
                    };

                    // Custom events:
                    const events = {
                        oncheck: null,
                        onmix: null,
                        onuncheck: null
                    };
                    events.forEach((callback, evtName) => {
                        const name = evtName.replace(/^on/, '');
                        if (spec.on && spec.on[name]) {
                            events[evtName] = spec.on[name];
                            delete(spec.on[name]);
                        }
                    });

                    // DOM:
                    if (tagName.toLowerCase() === "checkbox" && spec.mixed === true) {
                        delete(spec.mixed);
                        elt = getMixedSingleton();
                    } else {
                        elt = getInputSingleton();
                    }
                    constructing = false;

                    return elt;
                })();
                break;
            
            default:
                break;
        }

        return elt;
    });
    aa.diff                     = Object.freeze((() => {
        const {get, set} = aa.mapFactory();
        function _ (that) { return aa.getAccessor.call(that, {get, set}); }
        const changeTypes = [null, 'deletion', 'insertion']; // The first element will be used as default type.
        const diffTypes = ['Myers']; // The first element will be used as default type.
        // --------------------------------
        function algorithmMethodFactory (methodName) {
            const obj = {};
            obj[methodName] = function () {
                const that = _(this);

                const type = that.type.toLowerCase();
                if (algorithm.hasOwnProperty(type) && aa.isFunction(algorithm[type][methodName])) {
                    return algorithm[type][methodName].call(this);
                }
                throw new TypeError(`Invalid Diff type`);
            };
            Object.defineProperty(obj[methodName], 'name', {
                get: () => methodName
            });
            return obj;
        }
        // --------------------------------
        const Operation = (() => {
            function Operation () { get(Operation, 'construct').apply(this, arguments); }
            const blueprint = {
                accessors: {
                    publics: {
                        index:  null,
                        type:   null,
                        value:  null,
                    }
                },
                construct: function () {
                    const that = _(this);
                },
                methods: {
                    publics: {
                        toObject: function () {
                            return {
                                index:  this.index,
                                type:   this.type,
                                value:  this.value,
                            };
                        },
                    }
                },
                verifiers: {
                    index:  aa.isPositiveInt,
                    type:   aa.inArray(changeTypes),
                    value:  aa.any,
                }
            };
            aa.manufacture(Operation, blueprint, {get, set});
            return Operation;
        })();
        const Cell = (() => {
            function Cell () { get(Cell, 'construct').apply(this, arguments) }
            const blueprint = {
                accessors: {
                    publics: {
                        aIndex:     0,
                        bIndex:     0,
                        index:      0,
                        matched:    false,
                        operations: null,
                        path:       false,
                        selected:   false,
                        value:      null,
                        weight:     0,
                    }
                },
                construct: function () {
                    const that = _(this);
                    that.operations = new aa.Collection({ authenticate: aa.instanceof(Operation) });
                },
                methods: {
                    publics: {
                        toObject:   function () {
                            const that = _(this);
                            return {
                                aIndex:     that.aIndex,
                                bIndex:     that.bIndex,
                                index:      that.index,
                                matched:    that.matched,
                                path:       that.path,
                                operations: that.operations,
                                selected:   that.selected,
                                value:      that.value,
                                weight:     that.weight,
                            };
                        },
                        copy:       function () {
                            return new Cell(this.toObject());
                        },
                    },
                },
                verifiers: {
                    aIndex:     aa.isPositiveInt,
                    bIndex:     aa.isPositiveInt,
                    index:      aa.isPositiveInt,
                    matched:    aa.isBool,
                    operations: arg => aa.isArrayLike(arg) && arg.every(aa.instanceof(Operation)),
                    path:       aa.isBool,
                    selected:   aa.isBool,
                    value:      aa.any,
                    weight:     aa.isPositiveInt,
                },
            };
            aa.manufacture(Cell, blueprint, {get, set});
            return Cell;
        })();
        const Diff = (() => {
            function Diff () { get(Diff, 'construct').apply(this, arguments) }
            const blueprint = {
                accessors: {
                    publics: {
                        entries:        null
                    },
                    privates: {
                        comparator:     null,
                        delimiter:      null,
                        data:           null,
                        next:           null,
                        offsetEnd:      null,
                        offsetStart:    null,
                        previous:       null,
                        type:           null,
                        paths:          null,
                    }
                },
                construct: function (previous, next, options={}) {
                    const that = _(this);
                    aa.throwErrorIf(arguments.length > 3, `This constructor takes 3 arguments only.`);
                    
                    // Initialize attributes:
                    that.data = {};
                    that.entries = new aa.Collection({ authenticate: aa.instanceof(DiffEntry) });
                    that.paths = new aa.Collection({ authenticate: path => aa.isArrayLike(path) && path.every(aa.instanceof(Cell)) });

                    // Set attributes:
                    that.setPrevious(previous);
                    that.setNext(next);
                    that.setOptions(options);

                    // Default values:
                    that.comparator ??= (a, b) => a === b;
                    that.type ??= diffTypes[0];

                    that.compare();
                },
                methods: {
                    publics: {
                        ...algorithmMethodFactory('getPreviewNode'),
                        
                        // Getters:
                        toObject:   function () {
                            return {
                            };
                        },
                    },
                    privates: {
                        ...algorithmMethodFactory('compare'),

                        // Setters:
                        setNext:        function (next) {
                            aa.arg.test(next, blueprint.verifiers.next, "'next'");
                            const that = _(this);
                            that.next = next;
                        },
                        setPrevious:    function (previous) {
                            aa.arg.test(previous, blueprint.verifiers.previous, "'previous'");
                            const that = _(this);
                            that.previous = previous;
                        },
                        setOffsetEnd: function (offsetEnd) {
                            aa.arg.test(offsetEnd, blueprint.verifiers.offsetEnd, "'offsetEnd'");
                            const that = _(this);
                            that.offsetEnd = offsetEnd;
                        },
                        setOffsetStart: function (offsetStart) {
                            aa.arg.test(offsetStart, blueprint.verifiers.offsetStart, "'offsetStart'");
                            const that = _(this);
                            that.offsetStart = offsetStart;
                        },
                        setOptions:        function (options={}) {
                            aa.arg.test(options, aa.verifyObject({
                                comparator: blueprint.verifiers.comparator,
                                delimiter:  blueprint.verifiers.delimiter,
                                type:       blueprint.verifiers.type,
                            }), "'options'");
                            const that = _(this);
                            options.forEach((value, key) => {
                                that[key] = value;
                            });
                        },
                    }
                },
                verifiers: {
                    comparator: aa.isFunction,
                    delimiter:  arg => aa.isString(arg) || aa.isRegExp(arg),
                    entries:    aa.instanceof(aa.Collection),
                    next:       aa.isArrayLike,
                    offsetEnd:      arg => arg === null || aa.isInt(arg),
                    offsetStart:    arg => arg === null || aa.isInt(arg),
                    previous:   aa.isArrayLike,
                    type:       aa.inArray(diffTypes),
                },
            };
            aa.manufacture(Diff, blueprint, {get, set});
            return Diff;
        })();
        const DiffEntry = (() => {
            function DiffEntry () { get(DiffEntry, 'construct').apply(this, arguments) }
            const blueprint = {
                accessors: {
                    read: {
                        index:          null,
                        type:           null,
                        value:          null,
                        previousValue:  null,
                    }
                },
                construct: function (spec={}) {
                    aa.arg.test(spec, aa.verifyObject(blueprint.verifiers), "'spec'");
                    const that = _(this);

                    Object.keys(spec).forEach(attr => {
                        const method = `set${attr.firstToUpper()}`;
                        that[method](spec[attr]);
                    });
                },
                methods: {
                    publics: {
                        toObject: function () {
                            return {
                                index:          this.index,
                                type:           this.type,
                                value:          this.value,
                                previousValue:  this.value,
                            };
                        },
                    },
                    privates: {
                        setIndex:           function (index) {
                            aa.arg.test(index, blueprint.verifiers.index, "'index'");
                            const that = _(this);
                            that.index = index;
                        },
                        setPreviousValue:   function (previousValue) {
                            aa.arg.test(previousValue, blueprint.verifiers.previousValue, "'previousValue'");
                            const that = _(this);
                            that.previousValue = previousValue;
                        },
                        setType:            function (type) {
                            aa.arg.test(type, blueprint.verifiers.type, "'type'");
                            const that = _(this);
                            that.type = type;
                        },
                        setValue:           function (value) {
                            aa.arg.test(value, blueprint.verifiers.value, "'value'");
                            const that = _(this);
                            that.value = value;
                        },
                    }
                },
                verifiers: {
                    index:          aa.isPositiveInt,
                    value:          aa.any,
                    previousValue:  aa.any,
                    type:           aa.inArray(changeTypes),
                },
            };
            aa.manufacture(DiffEntry, blueprint, {get, set});
            return DiffEntry;
        })();
        // --------------------------------
        /**
         * Compare two Array-like.
         * 
         * @param {array-like} previous - The first array to compare, also often considered as old Array.
         * @param {array-like} next - The second array to compare, also often considered as new Array.
         * 
         * @return {object}
         */
        function diff (previous, next, options={}) {
            return new Diff(previous, next, options);
        };
        const algorithm = {
            /**
             * A set of functions to run 'diff', inspired by Myers' algorithm.
             * 
             * Stored data:
             * @param {cell[][]} that.data.virtual - A two-dimensions Array used to store 
             */
            myers: {
                compare:                function () {
                    const that = _(this);
                    const entries = algorithm.myers.getResult.call(this);
                    that.entries = Object.freeze(entries);
                },
                connectWithChanges:     function (cells) {
                    aa.arg.test(cells, aa.isArrayLikeOf(aa.instanceof(Cell)), "'cells'");
                    const that = _(this);
                    
                    const results = [];

                    const prevCell = {
                        aIndex: -1,
                        bIndex: -1,
                    };
                    const connect = (prevX, prevY, curX, curY) => {
                        if (curX > prevX + 1 || curY > prevY + 1) {
                            let x = prevX + 1;
                            let y = prevY;
                            if (curX > prevX) {
                                deletions: for (; x < curX; x++) {
                                    const virtualY = y.bound(0, that.next.length - 1);
                                    const cell = that.data.virtual[x][virtualY];
                                    cell.operations.push(new Operation({
                                        index: x,
                                        type: 'deletion',
                                        value: that.previous[x]
                                    }));
                                    results.pushUnique(cell);
                                }
                                x--;
                                y++;
                            }
                            if (curY > prevY) {
                                insertions: for (; y < curY; y++) {
                                    const virtualY = y.bound(0, that.next.length - 1);
                                    const virtualX = x.bound(0, that.previous.length - 1);
                                    const cell = that.data.virtual[virtualX][virtualY];
                                    cell.operations.push(new Operation({
                                        index: virtualY,
                                        type: 'insertion',
                                        value: that.next[virtualY]
                                    }));
                                    results.pushUnique(cell);
                                }
                            }
                        }
                    };
                    cells.forEach(curCell => {
                        // Push changes for every jump between cells:
                        connect(prevCell.aIndex, prevCell.bIndex, curCell.aIndex, curCell.bIndex);

                        // Push 
                        results.pushUnique(curCell);

                        prevCell.aIndex = curCell.aIndex;
                        prevCell.bIndex = curCell.bIndex;
                    });
                    connect(prevCell.aIndex, prevCell.bIndex, that.previous.length, that.next.length);
                    return results;
                },
                getEntries:             function () {
                    const that = _(this);

                    // Must contain one path at least:
                    const path = new aa.Collection({ authenticate: aa.instanceof(Cell) });
                    that.paths.push(path);
                    
                    // Find all possible paths going through matching items:
                    algorithm.myers.getPossiblePaths.call(this, path);

                    // Find the shortest path:
                    const resultPath = algorithm.myers.getShortestPath.call(this, that.paths);

                    // Selected matching cells in shortest path:
                    const selectedCells = resultPath.reduce((list, cell) => {
                        cell.selected = true;
                        list.push(cell);
                        return list;
                    }, []);

                    selectedCells.reverse();

                    // Fill gaps with 'deletion' and/or 'insertion' changes:
                    const results = algorithm.myers.connectWithChanges.call(this, selectedCells);

                    return aa.Collection.fromArray(
                        results
                        .map(cell => {
                            const list = [];

                            const isInserted = cell.operations.some(op => op.type === 'insertion');
                            const isDeleted = cell.operations.some(op => op.type === 'deletion');

                            if (isDeleted) {
                                list.push(new DiffEntry({
                                    index:      cell.aIndex,
                                    type:       'deletion',
                                    value:      that.previous[cell.aIndex],
                                }));
                            }
                            if (isInserted) {
                                list.push(new DiffEntry({
                                    index:      cell.bIndex,
                                    type:       'insertion',
                                    value:      that.next[cell.bIndex],
                                }));
                            }
                            if (!isDeleted && !isInserted) {
                                list.push(new DiffEntry({
                                    index:          cell.bIndex,
                                    value:          that.next[cell.bIndex],
                                    previousValue:  that.previous[cell.aIndex],
                                }));
                            }

                            return list;
                        })
                        .flat()
                        , { authenticate: aa.instanceof(DiffEntry) }
                    );
                },
                getEntriesFromEmpty:    function () {
                    const that = _(this);
                    const results = new aa.Collection({ authenticate: aa.instanceof(DiffEntry) });

                    aa.throwErrorIf(
                        that.previous.length > 0 && that.next.length > 0,
                        `Previous and next entries are not empty.`
                    );

                    deletions: for (let x = 0; x < that.previous.length; x++) {
                        results.push(new DiffEntry({
                            index: x,
                            type:   'deletion',
                            value:  that.previous[x],
                        }));
                    }
                    insertions: for (let y = 0; y < that.next.length; y++) {
                        results.push(new DiffEntry({
                            index: y,
                            type:   'insertion',
                            value:  that.next[y],
                        }));
                    }
                    
                    return results;
                },
                getPreviewNode:         function () {
                    const that = _(this);

                    const header = $$('thead');
                    const body = $$('tbody');
                    const table = $$('table.diff.sticky',
                        header,
                        body
                    );
                    
                    [...that.next].forEach((destItem, y) => {

                        // Top header:
                        if (y === 0) {
                            const cells = new DocumentFragment();
                            cells.append($$('th.stick-top'));
                            [...that.previous].forEach((srcItem, x) => {
                                cells.append($$('th.stick-top',
                                    $$('span', aa.isString(that.previous) ? srcItem : '', {dataset: {index: `[${x}]`}})),
                                );
                            });
                            header.append($$('tr', cells));
                        }

                        // Row content:
                        const row = $$('tr');
                        body.append(row);
                        [...that.previous].forEach((srcItem, x) => {
                            const cell = that.data.virtual[x][y];

                            // Left header:
                            if (x === 0) {
                                row.append($$('th.stick-left',
                                    $$('span', aa.isString(that.next) ? destItem : '', {dataset: {index: ` [${y}]`}})),
                                )
                            }

                            // Cell content:
                            let weightNode = $$(`span`, `${cell.weight}`);
                            const indexes = `[${cell.aIndex}][${cell.bIndex}]`;
                            const isInserted = cell.operations.some(op => op.type === 'insertion');
                            const isDeleted = cell.operations.some(op => op.type === 'deletion');
                            const td = $$(`td`, weightNode, {
                                on: {click: e => {
                                    log('position', indexes, {
                                        deleted:    isDeleted,
                                        inserted:   isInserted,
                                        matched:    cell.matched,
                                        selected:   cell.selected
                                    });
                                }}
                            });
                            td.classList[cell.matched ? 'add' : 'remove']('matched');
                            td.classList[cell.selected ? 'add' : 'remove']('selected');
                            td.classList[isInserted ? 'add' : 'remove']('inserted');
                            td.classList[isDeleted ? 'add' : 'remove']('deleted');
                            row.append(td);
                        });
                    });
                    return table;
                },
                getPossiblePaths:       function (path) {
                    aa.arg.test(path, aa.isArrayLike, "'path'");
                    
                    const that = _(this);

                    const originCell = path.last ?? null;
                    if (originCell) {
                        if (originCell.weight < 1) return;
                        aa.throwErrorIf(!originCell.matched, ``);
                    }

                    // Get upper-left cell as the bottom-right one of the area to dig in:
                    let x = originCell ? originCell.aIndex - 1 : that.previous.length - 1;
                    let y = originCell ? originCell.bIndex - 1 : that.next.length - 1;
                    if (x < 0 || y < 0) return;

                    const start = {x, y};
                    let {weight} = that.data.virtual[x][y];
                    let matchedCells = [];
                    let i = x * y;

                    // Find matching cells with current weight:
                    row: for (; x > -1; x--) {
                        column: for (y = start.y; y > -1; y--) {
                            const cell = that.data.virtual[x][y];
                            if (!cell || cell.weight !== weight) {
                                if (y === start.y) {
                                    break row;
                                }
                                break column;
                            }
                            if (cell.matched) {
                                matchedCells.pushUnique(cell);
                            }
                        }
                    }

                    matchedCells.forEachReverse((matchedCell, index) => {
                        // If more than one path is found, insert another path:
                        if (index > 0) {
                            const copy = path.copy();
                            copy.push(matchedCell);
                            that.paths.push(copy);
                            algorithm.myers.getPossiblePaths.call(this, copy);
                        }
                        // Or continue with current path:
                        else {
                            path.push(matchedCell);
                            algorithm.myers.getPossiblePaths.call(this, path);
                        }
                    });
                },
                getResult:              function () {
                    const that = _(this);

                    if (that.previous.length === 0 || that.next.length === 0) return algorithm.myers.getEntriesFromEmpty.call(this);

                    algorithm.myers.trimEqualities.call(this);

                    that.data.virtual = algorithm.myers.getVirtualTable.call(this, that.previous.length, that.next.length);
                    algorithm.myers.weight.call(this);
                    const entries = algorithm.myers.getEntries.call(this);
                    return entries;
                },
                getShortestPath:        function (paths) {
                    const that = _(this);

                    let whichIndex = null;
                    let lowestModificationsCount = null;
                    const copyPaths = [...paths];
                    copyPaths.reverse();
                    copyPaths.forEach((path, index) => {
                        const iterationPath = [...path];
                        iterationPath.push({
                            aIndex: -1,
                            bIndex: -1,
                        });
                        let modificationsCount = 0;
                        const previousCell = {
                            aIndex: that.previous.length,
                            bIndex: that.next.length,
                        };
                        iterationPath.forEach(cell => {
                            if (cell.aIndex < previousCell.aIndex - 1 || cell.bIndex < previousCell.bIndex - 1) {
                                modificationsCount++;
                            }
                            previousCell.aIndex = cell.aIndex;
                            previousCell.bIndex = cell.bIndex;
                        });
                        lowestModificationsCount ??= modificationsCount;
                        whichIndex ??= index;
                        if (modificationsCount < lowestModificationsCount) {
                            lowestModificationsCount = modificationsCount;
                            whichIndex = index;
                        }
                    });
                    return copyPaths[whichIndex];
                },
                getVirtualTable:        function (columns, rows) {
                    aa.arg.test(columns, aa.isPositiveInt, "'columns'");
                    aa.arg.test(rows, aa.isPositiveInt, "'rows'");

                    const table = new Array(columns);
                    columns: for (let x = 0; x < columns; x++) {
                        table[x] = new Array(rows);
                        rows: for (let y = 0; y < rows; y++) {
                            const cell = new Cell();
                            cell.aIndex = x;
                            cell.bIndex = y;
                            table[x][y] = cell;
                        }
                    }
                    return table;
                },
                hasNoMatch:             function () {
                    const that = _(this);
                    for (let y = 0; y < that.next.length; y++) {
                        for (let x = 0; x < that.previous.length; x++) {
                            if (that.next[y] === that.previous[x]) return false;
                        }
                    }
                    return true;
                },
                trimEqualities:         function () {
                    const that = _(this);

                    let end = null;
                    let start = null;
                    let i = 0

                    start: for (; i < Math.min(that.previous.length, that.next.length); i++) {
                        if (!that.comparator(that.previous[i], that.next[i])) {
                            start = i;
                            break start;
                        }
                    }
                    start ??= 0;

                    const offset = that.next.length - that.previous.length;
                    end: for (i = that.next.length - 1; i > 0 && i - offset > 0; i--) {
                        if (!that.comparator(that.previous[i - offset], that.next[i])) {
                            end = i - (that.next.length - 1) || null;
                            break end;
                        }
                    }
                    
                    that.setOffsetStart(start);
                    that.setOffsetEnd(end);
                },
                weight:                 function () {
                    const that = _(this);
                    
                    that.data.virtual.forEach((column, x) => {
                        const previousItem = that.previous[x];
                        column.forEach((cell, y) => {
                            const nextItem = that.next[y];
                            if (that.comparator(nextItem, previousItem)) {
                                cell.matched = true;
                                cell.value = nextItem;

                                // Add 1 to the upper-left weight:
                                cell.weight = (x > 0 && y > 0 ?
                                    that.data.virtual[x-1][y-1].weight + 1
                                    : 1
                                );
                            } else {
                                // Retrieve the max weight from left or upper cells:
                                cell.weight = Math.max(y > 0 ? that.data.virtual[x][y-1].weight : 0, x > 0 ? that.data.virtual[x-1][y].weight : 0);
                            }
                        })
                    });
                },
            }
        };
        // --------------------------------
        return diff;
    })());
    aa.extractClassNameAndID    = Object.freeze(function (str) {
        if (!aa.nonEmptyString(str)) { throw new TypeError("Argument must be a non-empty String."); }

        let id = null,
            classes = [];
        const result = {
            id: null,
            classes: [],
            tagName: str
        };
        str = str.trim();
        if (str.match(/^[^\.\#].*[\.\#]/)) {
            const o = {
                tagName: '',
                idName: '',
                className: ''
            };
            let previousType = "tagName";

            str.forEach(function (char, i) {
                switch (char) {
                    case "#":
                        switch (previousType) {
                            case "idName":
                                result.id = o[previousType];
                                o[previousType] = '';
                                break;
                            case "className":
                                result.classes.push(o[previousType]);
                                o[previousType] = '';
                                break;
                            default:
                                o.tagName = o[previousType];
                                break;
                        }
                        previousType = 'idName';
                        break;
                    case ".":
                        switch (previousType) {
                            case "idName":
                                result.id = o[previousType];
                                o[previousType] = '';
                                break;
                            case "className":
                                result.classes.push(o[previousType]);
                                o[previousType] = '';
                                break;
                            default:
                                o.tagName = o[previousType];
                                break;
                        }
                        previousType = "className";
                        break;
                    default:
                        o[previousType] += char;
                        break;
                }
            });
            result.tagName = o.tagName;
            if (o.idName) {
                result.id = o.idName;
            }
            if (o.className) {
                result.classes.push(o.className);
            }
        }
        return Object.freeze(result);
    });
    aa.selection                = Object.freeze((() => {
        function getAccessor (that) { return aa.getAccessor.call(that, {get, set}); }
        const shared = {
            verifiers: {
                field: arg => aa.isElement(arg)
                    && aa.isPositiveInt(arg.selectionStart)
                    && aa.isPositiveInt(arg.selectionEnd)
            }
        };
        const InputSelection = (() => {
            const privates = {
                newSelection: function (head, main, trail) {
                    aa.arg.test(head, aa.isString, "'head'");
                    aa.arg.test(main, aa.isString, "'main'");
                    aa.arg.test(trail, aa.isString, "'trail'");

                    const that = getAccessor(this);
                    const {field} = that;
                    field.value = `${head}${main}${trail}`;
                    field.focus();
                    field.setSelectionRange(
                        head.length,
                        (head + main).length
                    );
                },
                withScrollKeep: function (callback) {
                    aa.arg.test(callback, aa.isFunction, "'callback'");

                    const that = getAccessor(this);

                    const {field} = that;
                    const {scrollTop} = field;
                    callback();
                    field.scrollTop = scrollTop;
                },
                wrap: function (spec) {
                    aa.arg.optional(arguments, 0, {}, aa.verifyObject({
                        tag:    aa.isStringMatch(/^[a-z][a-z0-9]*$/i),
                        trim:   aa.isBool,
                        toggle: aa.isBool
                    }));
                    spec.sprinkle({
                        tag:    'div',
                        trim:   false,
                        toggle: false
                    });

                    const that = getAccessor(this);
                    const tagName = spec.tag;
                    const {field} = that;

                    const tag = {
                        start: `<${tagName}>`,
                        end: `</${tagName}>`,
                    };

                    const posStart  = field.selectionStart;
                    const posEnd    = field.selectionEnd;
                    
                    const text = {
                        head:   field.value.substring(0, posStart),
                        main:   field.value.substring(posStart, posEnd),
                        trail:  field.value.substring(posEnd)
                    };
                    const regex = {
                        start:  new RegExp(`^${tag.start}`),
                        end:    new RegExp(`${tag.end}$`)
                    };

                    // If toggle option is enabled:
                    if (spec.toggle) {

                        // Remove outer tags if already exist:
                        if (posStart >= tag.start.length) {
                            const outsideText = {
                                head:   field.value.substring(0, posStart - tag.start.length),
                                main:   field.value.substring(
                                    posStart - tag.start.length,
                                    posEnd + tag.end.length,
                                ),
                                trail:  field.value.substring(posEnd + tag.end.length)
                            };
                            if (
                                outsideText.main.match(regex.start)
                                && outsideText.main.match(regex.end)
                            ) {
                                privates.newSelection.call(this, outsideText.head, text.main, outsideText.trail);
                                return this;
                            }
                        }

                        // Remove inner tags if already exist:
                        if (
                            text.main.match(regex.start)
                            && text.main.match(regex.end)
                        ) {
                            const newMain = text.main
                                            .replace(regex.start, '')
                                            .replace(regex.end, '');
                            privates.newSelection.call(this, text.head, newMain, text.trail);
                            return this;
                        }
                    }

                    privates.newSelection.call(this,
                        `${text.head}`,
                        `${tag.start}${text.main}${tag.end}`,
                        `${text.trail}`
                    );
                    return this;
                }
            };

            function InputSelection () { get(InputSelection, 'construct').apply(this, arguments); }
            aa.manufacture(InputSelection, {
                accessors: {
                    publics: {
                        field: null
                    },
                    privates: {
                    }
                },
                construct: function () {
                },
                methods: {
                    publics: {
                        wrap: function (spec) {
                            aa.arg.test(spec, aa.isObject, "'spec'");

                            privates.withScrollKeep.call(this, () => {
                                privates.wrap.call(this, spec);
                            });
                        }
                    }
                },
                verifiers: {
                    field: shared.verifiers.field
                }
            }, {get, set});
            return InputSelection;
        })();
        return {
            from: function (field) {
                aa.arg.test(field, shared.verifiers.field, "'field'");

                return new InputSelection({
                    field
                });
            }
        };
    })());
    /**
     * Generate a DOM Element.
     * Usage:
        aa.html(nodeName[, args]);
        - First argument must be nodeName.
        - Each following argument can be a string or an object or parameters.
            - If argument is a String and starts with a '#', it will be considered as id.
            - If argument is a String and starts with a '.', it will be considered as additional className.
        
        // Examples:
        aa.html('div');
        aa.html('div','#myID');
        aa.html('div','.myClass');
        aa.html('div','#myID','.myClass');
        aa.html('div','#myID','.myClass','innerHTML String');
        aa.html('div#myID.myClass.anOtherClass','innerHTML String'); // shortcut markup declaration
        aa.html('input',{
            id:     '#myID',
            class:  '.myClass',
            type:   'button',
            value:  'Ok',
            on: ['click',funcion() {}],
            on: ['click',funcion() {},true],
            on: [
                ['click',function () {}],
                ['mouseover',function () {},false],
                ['focus',function () {},true]
                // ...
            ],
            on: {
                click: function () {}
            },
            on: {
                click: [
                    function () {},
                    function () {}
                    // ...
                ]
            }
        });
     */
    aa.html = (() => {
        const pastilleTypes = ["information", "warning", "critical", "success"];
        return Object.freeze(function (nodeName) {
            let i,elt,res,rest,table,value,type,
                id = null,
                classes = [],
                htmlAttributes = [
                    // Attributes to include as themselves:
                    "action",
                    "alt",
                    "charset",
                    "download",
                    "enctype",
                    "for",
                    "height",
                    "href",
                    "id",
                    "kind",
                    "label",
                    "method",
                    "name",
                    "orient",
                    "placeholder",
                    "src",
                    "srclang",
                    "style",
                    "title",
                    "value",
                    "width",
                    
                    // Attributes to transform before including:
                    "checked",
                    "class",
                    "colspan",
                    "content",
                    "count",
                    // "css",
                    "dataset",
                    "default",
                    "disabled",
                    "direction",
                    "draggable",
                    "icon",
                    "icons",
                    "legend",
                    "max",
                    "min",
                    "multiple",
                    "on",
                    "onglets",
                    "options",
                    "pastille",
                    "pattern",
                    "prefix",
                    "readonly",
                    "required",
                    "rowspan",
                    "selected",
                    "shortcut",
                    "step",
                    "suffix",
                    "target",
                    "text",
                    "tooltip",
                    "type",
                    "validation"
                ];

            if (aa.nonEmptyString(nodeName)) {
                const extracts = aa.extractClassNameAndID(nodeName);
                nodeName = extracts.tagName;

                switch (nodeName) {
                // case "icon":
                //     return aa.icon.apply(undefined, arguments);
                //     break;
                case "text":
                    return (arguments && arguments.length > 1 && aa.isString(arguments[1]) ?
                        document.createTextNode(arguments[1])
                        : undefined
                    );
                    break;
                case "button":
                    type = "button";
                    break;
                case "checkbox":
                case "file":
                case "password":
                case "hidden":
                case "radio":
                case "number":
                case "range":
                case "reset":
                case "submit":
                    type = nodeName;
                    nodeName = "input";
                    break;
                case "input":
                    type = "text";
                    nodeName = "input";
                    break;
                case "icon":
                    type = nodeName;
                    nodeName = "span";
                    break;
                case "pastille":
                case "tooltip":
                    type = nodeName;
                    nodeName = "div";
                    break;
                default:
                    break;
                }

                elt = document.createElement(nodeName);
                if (extracts.id) {
                    elt.id = extracts.id;
                }
                const specialNodes = {
                    icon: () => {
                        elt.classList.add("fa");
                        extracts.classes.forEach(cls => {
                            elt.classList.add("fa-"+cls);
                        });
                        while (extracts.classes.length) extracts.classes.pop();
                    },
                    pastille: () => {
                        elt.classList.add("pastille-container");
                        const args = [...arguments].slice(1);
                        let typeClass = "";
                        let count = 0;
                        args.forEach(arg => {
                            if (aa.isObject(arg)) {
                                if (arg.hasOwnProperty("count")) {
                                    aa.arg.test(arg.count, aa.isPositiveInt, "'count'");
                                    count = arg.count;
                                    delete arg.count;
                                    args.push(""+count);
                                }
                                if (arg.hasOwnProperty("type")) {
                                    aa.arg.test(arg.type, aa.inArray(pastilleTypes), "'type'");
                                    typeClass = "."+arg.type;
                                    delete arg.type;
                                }
                            }
                        });
                        const valueNode = $$("div.pastille"+extracts.classes.map(cls => "."+cls).join("")+typeClass+(count > 0 ? "" : ".hidden"), ...args);
                        elt.append(valueNode);
                        Object.defineProperties(elt, {
                            count: {
                                get: () => parseInt(valueNode.innerHTML),
                                set : count => {
                                    try { aa.arg.test(count, aa.isPositiveInt, "'count'"); }
                                    catch (err) { warn(err); return; }

                                    valueNode.classList[count > 0 ? "remove" : "add"]("hidden");
                                    valueNode.innerHTML = ""+(count > 9 ? "#": count);
                                }
                            },
                            type: {
                                get: () => get(elt, "type"),
                                set: type => {
                                    aa.arg.test(type, aa.inArray([null, ...pastilleTypes]), "'type'");
                                    const previousType = elt.type;
                                    if (previousType) valueNode.classList.remove(previousType);
                                    if (type) {
                                        valueNode.classList.add(type);
                                        set(elt, "type", type);
                                    }
                                }
                            }
                        });
                    },
                    tooltip: () => {
                        elt.classList.add("tooltip-container");
                        elt.classList.add("right"); // Default direction
                        const textNode = $$("div.text");
                        elt.append($$("div.tooltip-anchor",
                            $$("div.tooltip",
                                $$("div.arrow"),
                                textNode
                            )
                        ));
                        Object.defineProperties(elt, {
                            text: {
                                get: () => textNode.innerHTML,
                                set: text => {
                                    aa.arg.test(text, aa.isString, "'text'");
                                    textNode.innerHTML = text.trim();
                                }
                            },
                            content: {
                                get: () => textNode.children,
                                set: content => {
                                    aa.arg.test(content, value => aa.isNode(value) || aa.isArrayOf(aa.isNode)(value), "'content'");

                                    textNode.innerHTML = '';
                                    if (aa.isNode(content)) {
                                        textNode.appendChild(content);
                                    } else {
                                        content.forEach(node => {
                                            textNode.appendChild(node);
                                        });
                                    }
                                }
                            },
                            shortcut: {
                                get: () => textNode.dataset.shortcut,
                                set: shortcut => {
                                    aa.arg.test(shortcut, aa.isNullOrNonEmptyString, "'shortcut'");

                                    if (shortcut) {
                                        textNode.dataset.shortcut = shortcut.trim();
                                    } else {
                                        delete textNode.dataset.shortcut;
                                    }
                                }
                            }
                        });
                    },
                };
                if (type) {
                    if (specialNodes.hasOwnProperty(type)) {
                        specialNodes[type]();
                        if (type === "pastille")
                            return elt;
                    } else {
                        elt.type = type;
                    }
                }
                if (!specialNodes.hasOwnProperty(type)) {
                    Object.defineProperties(elt, {
                        icon: {
                            get: () => get(elt, "icons")[0] ?? null,
                            set: icon => {
                                elt.classList.add("fa");
                                try { aa.arg.test(icon, aa.isNullOrNonEmptyString, "'icon'"); }
                                catch (err) {
                                    warn(err);
                                    return;
                                }
                                elt.icons = (icon ? [icon] : []);
                            }
                        },
                        icons: {
                            get: () => [...get(elt, "icons")],
                            set: icons => {
                                if (icons === null)
                                    icons = [];
                                if (aa.isString(icons))
                                    icons = [icons];
                                
                                elt.classList.add("fa");
                                try { aa.arg.test(icons, aa.isArrayOfNonEmptyStrings, "'icons'"); }
                                catch (err) {
                                    warn(err);
                                    return;
                                }

                                get(elt, "icons")?.forEach(icon => {
                                    elt.classList.remove("fa-"+icon);
                                });
                                icons.forEach(icon => {
                                    elt.classList.add("fa-"+icon);
                                });
                                set(elt, "icons", icons);
                            }
                        },
                        pastille: {
                            get: () => elt.querySelector("div.pastille-container"),
                            set: pastille => {
                                aa.arg.test(pastille, arg => aa.isNode(arg) && arg.classList?.contains("pastille-container"), "'pastille'");
                                elt.classList.add("with-pastille");
                                elt.append(pastille);
                            }
                        },
                    });
                }

                extracts.classes.forEach(function (value) {
                    if (value.match(/\s/)) {
                        let table = value.split(/\s/);
                        table.forEach(function (value) {
                            if (value.trim()) {
                                elt.classList.add(value.trim());
                            }
                        });
                    } else {
                        elt.classList.add(value);
                    }
                });

                if (arguments) {
                    [...arguments].forEach(function (param,i) {
                        let option;

                        if (i > 0) {
                            if (aa.isDom(param) || aa.isNode(param)) {
                                elt.appendChild(param);
                            } else if (aa.isString(param)) {
                                option = param.trim();
                                switch (nodeName) {
                                    case "textarea":
                                        elt.innerText += option;
                                        break;
                                    default:
                                        elt.innerHTML += option;
                                        break;
                                }
                            } else if (aa.isObject(param)) {
                                param.forEach(function (option, key) {
                                    let classes;
                                    if (aa.isString(key)) {
                                        key = key.trim().toLowerCase();
                                        if (htmlAttributes.has(key)) {
                                            switch (key) {
                                                case "class":
                                                    if (aa.isString(option) && option.trim()) {
                                                        option = option.trim().replace(/\s+/,' ');
                                                        classes = option.split(' ');
                                                        classes.forEach(function (classe) {
                                                            return (elt.classList.add(classe));
                                                        });
                                                    }
                                                    break;
                                                
                                                case "colspan":
                                                case "rowspan":
                                                    switch (nodeName) {
                                                        case 'th':
                                                        case 'td':
                                                            elt.setAttribute(key, option+'');
                                                            break;
                                                    }
                                                    break;
                                                
                                                case "content":
                                                    aa.arg.test(option, value => aa.isNode(value) || value instanceof DocumentFragment || aa.isArrayOf(aa.isNode)(value), "'content'");

                                                    if (!["pastille", "tooltip"].includes(type)) {
                                                        elt.content = option;
                                                    } else {
                                                        elt.innerHTML = '';
                                                        if (aa.isNode(option)) {
                                                            elt.appendChild(option);
                                                        } else if (option instanceof DocumentFragment) {
                                                            elt.append(option);
                                                        } else if (aa.isArray(option)) {
                                                            option.forEach(node => {
                                                                elt.appendChild(node);
                                                            });
                                                        }
                                                    }
                                                    break;

                                                case "count":
                                                    if (["pastille"].includes(type)) {
                                                        if (aa.isNumber(option)) {
                                                            elt.count = option;
                                                        }
                                                    }
                                                    break;
                                                
                                                case "dataset":
                                                    if (aa.isObject(option)) {
                                                        option.forEach((v, k) => {
                                                            if (aa.nonEmptyString(v))
                                                                elt.dataset[k] = v;
                                                            else if (v === null)
                                                                delete elt.dataset[v];
                                                            else
                                                                warn("Dataset argument should be an Object of non-empty Strings only.");
                                                        });
                                                    }
                                                    break;
                                                
                                                case "direction":
                                                    if (type === "tooltip") {
                                                        aa.arg.test(option, aa.inEnum(
                                                            'bottom',
                                                            'bottom-left',
                                                            'bottom-right',
                                                            'left',
                                                            'right',
                                                            'top',
                                                            'top-left',
                                                            'top-right',
                                                        ), "'tooltip.direction'");
                                                        if (option !== 'right') {
                                                            elt.classList.remove('right');
                                                            elt.classList.add(option);
                                                        }
                                                    }
                                                    break;
                                                
                                                case "draggable":
                                                    elt.draggable = (
                                                        aa.isBool(option)
                                                        ? option
                                                        : false
                                                    );
                                                    break;
                                                
                                                case "icon":
                                                case "icons":
                                                    elt[key] = option;
                                                    break;

                                                case "legend":
                                                    if (nodeName === "fieldset") {
                                                        if (aa.nonEmptyString(option)) {
                                                            const legend = aa.html("legend", option.trim());
                                                            elt.insertAtFirst(legend);
                                                        }
                                                    }
                                                    break;
                                                
                                                case "onglets":
                                                    aa.arg.test(option, aa.isArrayOf(aa.verifyObject({
                                                        alt:        aa.nonEmptyString,
                                                        border:     aa.isBool,
                                                        checked:    aa.isBool,
                                                        disabled:   aa.isBool,
                                                        id:         aa.nonEmptyString,
                                                        label:      aa.nonEmptyString,
                                                        name:       aa.nonEmptyString,
                                                        on:         aa.isObject,
                                                        pastilles:  aa.isArrayOf(arg => aa.isPositiveInt(arg) || (aa.isElement(arg) && arg.classList.contains("pastille-container"))),
                                                        text:       p => (aa.nonEmptyString(p) || aa.isElement(p) || aa.instanceof(DocumentFragment)),
                                                        title:      aa.nonEmptyString,
                                                        value:      aa.nonEmptyString,
                                                    })), "'option'");

                                                    const name = aa.uid();
                                                    const onglets = $$("legend.onglets");
                                                    const container = $$("fieldset.onglets", onglets);
                                                    let checkedRadio = null;
                                                    elt.appendChild(container);

                                                    option.forEach((spec, i) => {
                                                        spec.sprinkle({
                                                            border:     true,
                                                            checked:    false,
                                                            disabled:   false,
                                                            id:         aa.uid(),
                                                            name,
                                                        });

                                                        spec.id = spec.id.trim();

                                                        // DOM:
                                                        if (!spec.border)
                                                            container.classList.add("no-border");
                                                        const radio = $$("radio", {
                                                            dataset: {id: spec.id},
                                                            disabled: spec.disabled
                                                        });
                                                        const btn = $$("button", {
                                                            disabled: spec.disabled,
                                                            on: {click: e => radio.click()}
                                                        });
                                                        const label = $$("label.onglet",
                                                            radio,
                                                            btn
                                                        );
                                                        onglets.appendChild(label);

                                                        if (spec.checked) {
                                                            checkedRadio = radio;
                                                        }
                                                        if (spec.label) {
                                                            spec.label = spec.label.trim();
                                                            btn.innerHTML = spec.label;
                                                        }
                                                        if (spec.name) {
                                                            spec.name = spec.name.trim();
                                                            radio.name = spec.name;
                                                        }

                                                        // Pastilles:
                                                        if (spec.pastilles?.length) {
                                                            spec.pastilles.forEach((pastille, i) => {
                                                                if (aa.isNumber(pastille))
                                                                    pastille = $$("pastille", {count: pastille});
                                                                btn.classList.add("with-pastille");
                                                                if (i === 0) {
                                                                    btn.append(pastille);
                                                                } else {
                                                                    btn.querySelector("div.pastille-container").append(pastille.firstElementChild);
                                                                }
                                                            });
                                                        }

                                                        // Listeners:
                                                        if (spec.on) {
                                                            spec.on.forEach((callback, evtName) => {
                                                                if (!aa.isFunction(callback)) { throw new TypeError("Onglets 'on' spec must be an Object of Functions."); }
                                                                evtName = evtName.toLowerCase();
                                                                switch (evtName) {
                                                                    case "check":
                                                                        radio.on("change", () => {
                                                                            if (radio.checked) {
                                                                                setTimeout(() => {
                                                                                    callback();
                                                                                }, 50);
                                                                            }
                                                                        });
                                                                        break;
                                                                    default:
                                                                        throw new TypeError("Unknown onglets 'on' spec key.");
                                                                        break;
                                                                }
                                                            });
                                                        }
                                                        if (spec.title) {
                                                            spec.title = spec.title.trim();
                                                            label.title = spec.title;
                                                        }
                                                        if (spec.value) {
                                                            spec.value = spec.value.trim();
                                                            radio.value = spec.value;
                                                        }
                                                        radio.on("change", () => {
                                                            container.diveTheDOM((node) => {
                                                                if (node.classList.contains("aaDialogOngletContent")) {
                                                                    node.classList.add("hidden");
                                                                }
                                                            });
                                                            el(spec.id, (content) => {
                                                                content.classList.remove("hidden");
                                                            });
                                                        });
                                                    });
                                                    option.forEach((spec, i) => {
                                                        if (spec.text) {
                                                            spec.text = aa.isString(spec.text) ? spec.label.trim() : spec.text;
                                                            const content = $$("div#"+spec.id+".aaDialogOngletContent", spec.text);
                                                            content.classList.add("hidden");
                                                            container.appendChild(content);
                                                        }
                                                    });
                                                    setTimeout(() => {
                                                        if (checkedRadio) {
                                                            checkedRadio.click();
                                                        } else {
                                                            const found = onglets.childNodes
                                                                .find((onglet) => {
                                                                    let radio;
                                                                    onglet.diveTheDOM((node) => {
                                                                        if (node.type && node.type.toLowerCase() === "radio") {
                                                                            radio = node;
                                                                        }
                                                                    })
                                                                    return !radio.disabled;
                                                                })
                                                            ;
                                                            if (found) {
                                                                found.click();
                                                            }
                                                        }
                                                    }, 50);
                                                    break;
                                                
                                                case "orient":
                                                    if (
                                                        nodeName === "input" && type === "range"
                                                        && (["vertical"]).has(option)
                                                    ) {
                                                        elt.setAttribute("orient", option);
                                                    } else {
                                                        warn("Invalid 'orient' argument.");
                                                    }
                                                    break;
                                                
                                                case "text":
                                                    if (["tooltip"].includes(type)) {
                                                        if (aa.isString(option)) {
                                                            elt.text = option;
                                                        } else {
                                                            elt.content = option;
                                                        }
                                                    } else {
                                                        elt.innerHTML = option;
                                                    }
                                                    break;
                                                
                                                case "checked":
                                                    elt.defaultChecked = ((aa.isString(option) && option.toLowerCase() === key.toLowerCase()) || option === true);
                                                    elt[key] = elt.defaultChecked;
                                                    break;
                                                
                                                case "min":
                                                case "max":
                                                case "step":
                                                    elt[key] = option+'';
                                                    break;
                                                
                                                case "prefix":
                                                case "suffix":
                                                    switch (nodeName) {
                                                        case "input":
                                                            key = key.toLowerCase();
                                                            elt.classList.add(key);
                                                            elt.dataset[key] = option;
                                                            break;
                                                    }
                                                    break;
                                                
                                                case "default":
                                                case "disabled":
                                                case "multiple":
                                                case "readonly":
                                                case "required":
                                                case "selected":
                                                    elt[key] = ((aa.isString(option) && option.toLowerCase() === key.toLowerCase()) || option === true);
                                                    break;
                                                
                                                case "on":
                                                    if (aa.isArray(option)) {
                                                        if (option.length > 1 && !aa.isArray(option[0])) {
                                                            let evt =       option[0];
                                                            let callback =  option[1];

                                                            if (option.length > 2) {
                                                                let bubble = option[2];
                                                                return elt.on(evt,callback,bubble);
                                                            } else {
                                                                 return elt.on(evt,callback);
                                                            }
                                                        } else {
                                                            option.forEach(function (listener) {
                                                                if (aa.isArray(listener) && listener.length > 1) {
                                                                    let evt = listener[0];
                                                                    let callback = listener[1];

                                                                    if (listener.length > 2) {
                                                                        let bubble = listener[2];
                                                                        return elt.on(evt,callback,bubble);
                                                                    }
                                                                    return elt.on(evt,callback);
                                                                }
                                                            });
                                                        }
                                                    } else if (aa.isObject(option)) {
                                                        option.forEach(function (callback,evt) {
                                                            if (typeof callback === 'function') {
                                                                return elt.on(evt,callback);
                                                            } else if(aa.isArray(callback)) {
                                                                callback.forEach(function (func) {
                                                                    return elt.on(evt,func);
                                                                });
                                                            }
                                                        });
                                                    }
                                                    break;
                                                
                                                case "options":
                                                    if (!aa.isArray(option)) {
                                                        throw new Error("'Options' argument should be an Array.");
                                                    }
                                                    option.forEach(function (opt) {
                                                        if (!aa.isDom(opt)) {
                                                            throw new Error("<option> should be a DOM Element.");
                                                        }
                                                        elt.appendChild(opt);
                                                    });
                                                    break;
                                                
                                                case "pastille":
                                                    (() => {
                                                        aa.arg.test(
                                                            option,
                                                            arg =>  aa.isPositiveInt(arg)
                                                                    || (aa.isElement(arg) && arg.classList.contains('pastille-container')),
                                                            "'pastille'"
                                                        );
                                                        
                                                        elt.classList.add('with-pastille');
                                                        if (aa.isNumber(option)) {
                                                            const pastille = $$("pastille", {
                                                                count: option
                                                            });
                                                            elt.append(pastille);
                                                        } else {
                                                            elt.append(option);
                                                        }
                                                    })();
                                                    break;

                                                case "pattern":
                                                    switch (nodeName) {
                                                        case "input":
                                                            elt.setAttribute(key, option);
                                                            break;
                                                        
                                                        case "textarea":
                                                            elt.dataset.pattern = option;
                                                            elt.on("input", () => {
                                                                const re = new RegExp(option);
                                                                elt.classList[(elt.value.match(re) ?
                                                                    "remove"
                                                                    : "add"
                                                                )]("invalid");
                                                            });
                                                            break;
                                                    }
                                                    break;

                                                case "shortcut":
                                                    elt.shortcut = option;
                                                    break;

                                                case "tooltip":
                                                    (() => {
                                                        aa.arg.test(
                                                            option,
                                                            arg =>  aa.nonEmptyString(arg)
                                                                    || (aa.isElement(arg) && arg.classList.contains('tooltip-container')),
                                                            "'tootltip'"
                                                        );
                                                        
                                                        elt.classList.add('with-tooltip');
                                                        if (aa.isString(option)) {
                                                            elt.appendChild($$('tooltip', {
                                                                text: option
                                                            }));
                                                        } else {
                                                            elt.appendChild(option);
                                                        }
                                                    })();
                                                    break;

                                                case "type":
                                                    if (["pastille"].includes(type)) {
                                                        elt.type = option;
                                                    } else {
                                                        elt.setAttribute(key, option);
                                                    }
                                                    break;

                                                case "validation":
                                                    switch (nodeName) {
                                                        case "input":
                                                        case "button":
                                                        case "textarea":
                                                        case "select":
                                                            if (!aa.isFunction(option)) { throw new TypeError("Option must be a Function."); }
                                                            set(elt, "validation", option);
                                                            break;
                                                    }
                                                    break;

                                                case "value":
                                                    if (nodeName === "button") {
                                                        elt.innerHTML = option;
                                                    } else {
                                                        elt.setAttribute('value',(option ? option+'' : ''));
                                                    }
                                                    break;
                                                
                                                default:
                                                    if (aa.isString(option)) {
                                                        return (elt.setAttribute(key, option.trim()));
                                                    } else if (aa.isNumber(option)) {
                                                        return (elt.setAttribute(key, option));
                                                    }
                                                    break;
                                            }
                                        } else { warn("Attribute '"+key+"' not implemented yet. (aa.aaFramework.create)"); }
                                    }
                                    return false;
                                });
                            }
                        }
                        return false;
                    });
                }
                return elt;
            }
            return undefined;
        });
    })();
    aa.HTMLCollection           = (() => {
        function HTMLCollection (list) {
            const getAccessor = function (thisArg) {
                return aa.getAccessor.call(thisArg, {get, set});
            }
            aa.arg.test(list, aa.isArrayOf(aa.isElement), "'HTMLCollection.list'");

            aa.defineAccessors.call(this, {
                privates: {
                    data: []
                },
                execute: {
                    length: () => list.length
                }
            }, {getter: get, setter: set});

            const that = getAccessor(this);

            list.forEach((item, i) => {
                this[i] = item;
                that.data.push(item);
            });
            Object.freeze(this);
        }
        aa.deploy(HTMLCollection.prototype, {
            item:       function (i) {
                return this.hasOwnProperty(i) ? this[i] : null;
            },
            namedItem:  function (name) {
                aa.arg.test(name, aa.nonEmptyString, "'name'");

                const that = getAccessor(this);
                const found = that.data.find(item => item.id === name || item.name === name);
                return found ? found : null;
            }
        }, {force: true});
        return HTMLCollection;
    })();
    aa.img                      = Object.freeze(new (function () {
        const o = {
            convertUriToJpg: (uri, resolve /*, reject */) => {
                if (!aa.nonEmptyString(uri)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!aa.isFunction(resolve)) { throw new TypeError("Second argument must be a Function."); }
                const reject = (arguments && arguments.length > 2 ? arguments[2] : undefined);
                if (reject !== undefined && !aa.isFunction(reject)) { throw new TypeError("Third argument must be a Function."); }

                const canvas = $$("canvas");
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.on("load", () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/jpeg"));
                });
                if (reject) {
                    img.on("error", reject);
                }
                img.src = uri;
            }
        };
        return o;
    }));
    aa.isOver                   = function (e) {
        let options = [];
        if (arguments && arguments.length>1) {
            let args = Array.prototype.slice.call(arguments);
            args.shift();
            args.forEach(function (arg) {
            });
            
            let isOver = !!e.composedPath().find(function (elt) {
                return (elt.id === "aaContextMenu");
            });
        }
        return undefined;
    };
    aa.isTheme                  = function (str) {

        return (aa.isString(str) && ENV.THEMES.has(str));
    }
    aa.ClassFactory             = function () {
        aa.ClassFactory.group("Classify");
        if (this["__abstract"]) {
            aa.ClassFactory.continueIfEmpty(this["__abstract"]);
        }
        if (this.construct && aa.isFunction(this.construct)) {
            this.construct.apply(this,arguments);
        }
        aa.ClassFactory.groupEnd("Classify");
    };
    (function () { /* ClassFactory static */
        // Options:
        aa.ClassFactory.isDev = false;

        // Functions:
        aa.ClassFactory.group           = function () {
            let args = arguments;
            if (aa.ClassFactory.isDev) {
                console.group.apply(null,args);
            }
        };
        aa.ClassFactory.groupCollapsed  = function () {
            let args = arguments;
            if (aa.ClassFactory.isDev) {
                console.groupCollapsed.apply(null,args);
            }
        };
        aa.ClassFactory.groupEnd        = function () {
            let args = arguments;
            if (aa.ClassFactory.isDev) {
                console.groupEnd.apply(null,args);
            }
        };
        aa.ClassFactory.log             = function () {
            let args = arguments;
            if (aa.settings.production) {
                console.log.apply(null,args);
            }
        };
        aa.ClassFactory.warn            = function () {
            if (aa.settings.production) {
                console.warn.apply(null, arguments);
            }
        };
        aa.ClassFactory.continueIfEmpty = function (list) {
            if (list && aa.isArray(list) && list.length) {
                let replace = (list.length === 1 ? ["","is"] : ["s","are"]);
                let values = list.join("', '");
                throw new Error("Method"+replace[0]+" '"+values+"' "+replace[1]+" not implemented.");
            }
            return true;
        };
        aa.ClassFactory.infants         = function (options) {
            /**
             * @param: {Object} options (object of options - as described below)
             *
             *  How to use:
             * --------
                // Creating classes:
                // MyTopClass = aa.ClassFactory.infants(options={});
                MyTopClass = aa.ClassFactory.infants({
                    attributes: {
                        self: function () {
                            this.myAttribute = 'value';
                        },
                        self: {
                            myAttribute: 'value'
                        },
                        proto: {
                            anAttribute: 'value'
                        },
                        get: {
                            getterAttribute: function () { return 'value';}
                        }
                    },
                    methods: {
                        __abstract: ['anAbstractMethod'], // list of names of methods that have to be implemented
                        __static: {
                            aStaticMethod: function () {},
                            anotherStaticMethod: function () {}
                        }
                        aMethod: function () {},
                        anotherMethod: function () {}
                    }
                });
                MyChildClass = myTopClass.infants(options={});
                // --------
                // Instancing from classes:
                myChildInstance = new MyChilClass();
             * --------
             */
            aa.ClassFactory.group("Classify.infants");
            let Parent = this;

            let getNS = function (ns,methodName=null) {
                if (aa.isString(ns) && ns.trim()) {
                    let arrays = [
                        '__abstract'
                    ];
                    let objects = [
                        '__methods',
                        '__static'
                    ];

                    if (arrays.has(ns)) {
                    } else if(objects.has(ns)) {
                    } else {
                        throw new Error("Namespace '"+ns+"' not defined in prototype.");
                        return undefined;
                    }

                    if (typeof aaClass.prototype[ns] === 'undefined') {
                        if (arrays.has(ns)) {
                            aaClass.prototype[ns] = [];
                        } else if(objects.has(ns)) {
                            aaClass.prototype[ns] = {};
                        }
                    }

                    if (methodName === null) {
                        return aaClass.prototype[ns];
                    } else if(aa.isString(methodName) && methodName.trim()) {
                        if (arrays.has(ns)) {
                            return aaClass.prototype[ns].has(methodName);
                        } else if(objects.has(ns)) {
                            if (typeof aaClass.prototype[ns][methodName] === 'undefined') {
                                aaClass.prototype[ns][methodName] = [];
                            }
                            return aaClass.prototype[ns][methodName];
                        }
                    } else {
                        return undefined;
                    }
                }
                return undefined;
            };
            let addToNS = function (ns,methodName,callback=null) {
                if (methodName && aa.isString(methodName) && methodName.trim()) {
                    if (aa.isArray(getNS(ns,methodName)) && aa.isFunction(callback)) {
                        getNS(ns,methodName).push(callback);
                    } else if(aa.isArray(getNS(ns))) {
                        // Append method:
                        getNS(ns).push(methodName);
                        
                        // Sort:
                        let i;
                        let indexes = {};
                        getNS(ns).forEach(function (value,i) {
                            indexes[value.toLowerCase()] = value;
                        });
                        let nsCopy = getNS(ns).map(function (value) {
                            return value.toLowerCase();
                        });
                        nsCopy.sort();
                        for(i=0; i<nsCopy.length; i++) {
                            getNS(ns)[i] = indexes[nsCopy[i]];
                        }
                    } else {
                        warn("Method '"+methodName+"' not found in '"+ns+"'.");
                        return false;
                    }
                    return true;
                }
                return false;
            };

            // Class:
            let aaClass = function () {
                aa.ClassFactory.group("aaClass");

                // Parent:
                // Parent.apply(this,arguments);

                // Attributes.self:
                aa.ClassFactory.group('self');
                if (options.attributes && aa.isObject(options.attributes)) {
                    if (options.attributes.self) {
                        if (aa.isFunction(options.attributes.self)) {
                            // options.attributes.self.apply(this);
                            let Temp = function () {};
                            Temp.prototype.self = options.attributes.self;
                            let temp = new Temp();
                            temp.self();
                            aa.ClassFactory.log(temp);
                            temp.forEach(function (v,k) {
                                if (!aa.isFunction(v)) {
                                    if (!this.hasOwnProperty(k)) {
                                        this[k] = v;
                                    }
                                }
                            },this);
                        } else if(aa.isObject(options.attributes.self)) {
                            aa.ClassFactory.log("(object) self");
                            options.attributes.self.forEach(function (v,k) {
                                if (!aa.isFunction(v)) {
                                    if (!this.hasOwnProperty(k)) {
                                        this[k] = v;
                                    }
                                }
                            },this);
                        }
                    }
                    if (options.attributes.get) {
                        if (!aa.isObject(options.attributes.get)) {
                            throw new TypeError("GET argument should be an Object.");
                        }
                        options.attributes.get.forEach(function (f,k) {
                            if (!aa.isFunction(f)) {
                                throw new TypeError("'"+k+"' Getter's value should be a Function.")
                            }
                            Object.defineProperty(this,k,f);
                        },this);
                    }
                }
                aa.ClassFactory.groupEnd('self');

                // Parent:
                Parent.apply(this,arguments);
                aa.ClassFactory.groupEnd("aaClass");
            };

            // Prototype init:
            let Surrogate = function () {};
            Surrogate.prototype = Parent.prototype;
            aaClass.prototype = new Surrogate();
            aaClass.infants = Parent.infants;

            if (options.attributes && aa.isObject(options.attributes)
            && options.attributes.proto && aa.isObject(options.attributes.proto)) {

                options.attributes.proto.forEach(function (value,key) {
                    aaClass.prototype[key] = value;
                });
            }

            // Methods:
            if (options.methods && aa.isObject(options.methods)) {
                options.methods.forEach(function (value,key) {
                    switch (key) {
                        case '__abstract':
                            if (aa.isArray(value)) {
                                value.forEach(function (methodName,i) {
                                    // aa.ClassFactory.log({abstract:methodName});
                                    addToNS('__abstract',methodName);
                                });
                            }
                            break;
                        case '__static':
                            if (aa.isObject(value)) {
                                value.forEach(function (callback,methodName) {
                                    if (aa.isFunction(callback)) {
                                        // aa.ClassFactory.log({static:methodName});
                                        addToNS('__static',methodName,callback);
                                    }
                                });
                            }
                            break;
                        default:
                            if (aa.isFunction(value)) {
                                addToNS('__methods',key,value);
                                if (getNS('__abstract',key)) {
                                    // let o = {}; o['__abstract.'+key] = true; aa.ClassFactory.log(o);
                                    getNS('__abstract').removeElement(key);
                                }
                                Object.defineProperty(aaClass.prototype,key,{
                                    get: (function (key) {
                                        return function () {
                                            if (aa.ClassFactory.continueIfEmpty(getNS('__abstract'))) {
                                                return getNS('__methods',key).getLast();
                                            }
                                        };
                                    })(key)
                                });
                            }
                            break;
                    }
                });
            }

            // Retrieve 'static':
            if (typeof aaClass.prototype['__static'] !== 'undefined' && aa.isObject(aaClass.prototype['__static'])) {
                aaClass.prototype['__static'].forEach(function (list,methodName) {
                    if (aa.isArray(list) && list.length && aa.isFunction(list.getLast())) {
                        Object.defineProperty(aaClass,methodName,{
                            get: (function (methodName) {
                                return function () {
                                    let args = arguments
                                    return list.getLast(args);
                                };
                            })(methodName)
                        });
                    }
                });
            }

            aa.ClassFactory.groupEnd("Classify.infants");

            return aaClass;
        };
    })();
    aa.deploy(Function.prototype, {
        manufacture: function (blueprint /*, accessors */) {
            const accessors = aa.arg.optional(arguments, 1, {});
            aa.manufacture(this, blueprint, accessors);
        }
    }, {force: true});
    aa.newID                    = (function () {
        let x = 0;
        return function () {
            if (aa.newID.prototype.domID === undefined) {
                aa.newID.prototype.domID = -1;
            }
            x++;
            return 'AAID_'+(Date.now())+'_'+x;
        };
    })();
    aa.settings                 = (() => {

        // Class:
        function Settings () {
            aa.defineAccessors.call(this, {
                publics: {
                    production: ENV.PRODUCTION,
                    theme:      ENV.DEFAULT_THEME
                },
                write: {
                    script:     null,
                    scripts:    [],
                },
                privates: {
                }
            }, {getter: get, setter: set});
        };

        // Public methods:
        aa.deploy(Settings.prototype, {
            setProduction:  function (isProd) {
                if (!aa.isBool(isProd)) { throw new TypeError("Argument must be a Boolean."); }
                set(this, 'production', isProd);
            },
            setScript:      function (path) {
                if (!aa.nonEmptyString(path)) { throw new TypeError("Argument must be a non-empty String."); }
                path = path.trim();
                if (!get(this, 'scripts').has(path)) {
                    get(this, 'scripts').push(path);
                    aa.addScriptToDOM(path);
                }
            },
            setScripts:     function (scripts) {
                if (!aa.isArray(scripts) || scripts.find(path => !aa.nonEmptyString(path))) { throw new TypeError("Argument must be an Array of non-empty Strings."); }
                scripts.forEach((path) => {
                    this.setScript(path);
                });
            },
            setTheme:       function (theme) {
                if (theme !== undefined && !aa.nonEmptyString(theme)) { throw new TypeError("'theme' spec must be a non-empty String."); }
                if (ENV.THEMES.has(theme)) {
                    const previous = get(this, 'theme');
                    set(this, 'theme', theme);
                    if (theme !== previous) {
                        aa.events.fire('themechange', theme, previous);
                    }
                } else {
                    console.warn("Theme '"+theme+"' not valid.");
                }
            }
        });

        return Object.freeze(new Settings());
    })();
    aa.xhr                      = function (method='GET', src, options={}) {
        aa.arg.test(method, aa.nonEmptyString, `'method'`);
        aa.arg.test(src, aa.nonEmptyString, `'src'`);
        aa.arg.optional(arguments, 2, {}, aa.verifyObject({
            default: aa.isBool,
            reject: aa.isFunction,
            resolve: aa.isFunction
        }), `'options'`);

        // Default options if undefined:
        options.sprinkle({
            default: true,
            reject: () => {},
            resolve: () => {}
        });
        
        // Execute:
        switch (method.toUpperCase()) {
            case 'GET':{
                let xhr = new XMLHttpRequest();
                xhr.open('GET', src);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        switch (xhr.status) {
                            case 200:{
                                let json;
                                try{
                                    json = JSON.parse(xhr.response);
                                }
                                catch(e) {
                                    console.warn(xhr.response);
                                    throw new Error("Invalid XHR response from Server. (It doesn't seem to be correct JSON.)");
                                    return;
                                }
                                if (json) {
                                    if (options.default) {
                                        if (json.dialog && json.dialog.critical && json.dialog.critical.length) {
                                            (new aa.gui.Dialog('critical',{
                                                text: "- "+json.dialog.critical.join('<br>- ')
                                            })).show();
                                            options.resolve.call(null, undefined, json.dialog);
                                        }
                                        else if(json.dialog && json.dialog.warning && json.dialog.warning.length) {
                                            (new aa.gui.Dialog('warning',{
                                                text: "- "+json.dialog.warning.join('<br>- ')
                                            })).show();
                                            options.resolve.call(null, json.response, json.dialog);
                                        }
                                        else if(json.dialog && json.dialog.information && json.dialog.information.length) {
                                            (new aa.gui.Dialog('information',{
                                                text: "- "+json.dialog.information.join('<br>- ')
                                            })).show();
                                            options.resolve.call(null, json.response);
                                        } else if(typeof json.response !== 'undefined') {
                                            options.resolve.call(null, json.response, json.dialog);
                                        }
                                    } else if (json.response && json.dialog) {
                                        options.resolve.call(null, json.response, json.dialog);
                                    }
                                    return;
                                }
                                throw new Error("Invalid XHR response from Server.");
                                return;
                                break;
                            }
                        }
                    }
                };
                xhr.onload = function (e) {
                };
                xhr.send();
                break;
            }
            case 'POST':{
                if (options.form !== undefined
                && aa.isDom(options.form) && options.form.tagName.toLowerCase() === 'form') {
                    let xhr,data;

                    if (false) {
                        // Une version simple mais à corriger pour que soient accessibles de multiples <checkbox> :
                        data = new FormData(options.form);
                        xhr = new XMLHttpRequest();
                    } else {
                        data = '';
                        options.form.diveTheDOM(function (n) {
                            if (n.name) {
                                // transformer les '&' en caractères valides pour la requête POST :
                                let v = n.value;
                                v = encodeURIComponent(v);
                                
                                /*
                                // v = v.replace(/=/g, '<egal>');
                                // v = v.replace(/\'/g, '<apos>');
                                // v = v.replace(/\"/g, '<guill>');
                                v = v.replace(/\\/g, '__backslash__');
                                v = v.replace(/\&/g, '<and>');
                                //v = v.replace(/\#/g, '<diese>');
                                v = v.replace(/\;/g, '<pointvirgule>');
                                /**/
                                
                                // Test des champs de formulaire :
                                if ((n.type === 'checkbox') && !n.checked) { // typeof() ou .type
                                }
                                else if((n.type === 'radio') && !n.checked) {
                                }
                                else if((n.type === 'files') && !n.checked) {
                                }
                                else {
                                    data += n.name+'='+v+'&';
                                }
                                // n.disabled = true;
                            }
                        });
                        xhr = getHttpObject();
                    }
                    if (xhr) {
                        // xhr.open("POST", src);
                        xhr.open("POST",src+"&rnd="+Math.random(),true);
                        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); // utiliser en POST uniquement
                        // xhr.setRequestHeader("Content-length", chaine.length);
                        // xhr.setRequestHeader("Connection", "close");
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState === 4) {
                                switch (xhr.status) {
                                    case 200:{
                                        let json;
                                        try{
                                            json = JSON.parse(xhr.response);
                                        }
                                        catch(e) {
                                            warn(xhr.response);
                                            throw new Error("Invalid XHR response from Server. (It doesn't seem to be correct JSON.)");
                                            return;
                                        }
                                        if (json) {
                                            if (options.default) {
                                                if (json.dialog && json.dialog.critical && json.dialog.critical.length) {
                                                    (new aa.gui.Dialog('critical',{
                                                        text: '- '+json.dialog.critical.join('<br>- ')
                                                    })).show();
                                                    options.resolve.call(null, undefined, json.dialog);
                                                    return;
                                                }
                                                else if(json.dialog && json.dialog.warning && json.dialog.warning.length) {
                                                    (new aa.gui.Dialog('warning',{
                                                        text: '- '+json.dialog.warning.join('<br>- ')
                                                    })).show();
                                                    options.resolve.call(null, json.response, json.dialog);
                                                    return;
                                                }
                                                else if(json.dialog && json.dialog.information && json.dialog.information.length) {
                                                    (new aa.gui.Dialog('information',{
                                                        text: '- '+json.dialog.information.join('<br>- ')
                                                    })).show();
                                                    options.resolve.call(null, json.response);
                                                    return;
                                                } else if(typeof json.response !== 'undefined') {
                                                    options.resolve.call(null, json.response, json.dialog);
                                                    return;
                                                }
                                            } else if(json.response && json.dialog) {
                                                options.resolve.call(null, json.response, json.dialog);
                                                return;
                                            }
                                        }
                                        throw new Error("Invalid XHR response from Server.");
                                        return;
                                        break;
                                    }
                                }
                            }
                        };
                        xhr.onload = function (e) {
                        };
                        xhr.send(data);
                    }
                } else {
                    throw new Error("Invalid form in 'aa.XHR'.");
                }
                break;
            }
            case 'FILE':{
                if (typeof options.form !== 'undefined'
                && aa.isDom(options.form) && options.form.tagName.toLowerCase() === 'form') {
                    let xhr,data;

                    data = new FormData(options.form);
                    xhr = new XMLHttpRequest();
                    if (xhr) {
                        // xhr.open("POST", src);
                        xhr.open('POST',src+'&rnd='+Math.random(),true);
                        // xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded'); // utiliser en POST uniquement
                        // xhr.setRequestHeader("Content-length", chaine.length);
                        // xhr.setRequestHeader("Connection", "close");
                        xhr.onreadystatechange = function () {
                            if (xhr.readyState === 4) {
                                switch (xhr.status) {
                                    case 200:{
                                        let json;
                                        try{
                                            json = JSON.parse(xhr.response);
                                        }
                                        catch(e) {
                                            warn(xhr.response);
                                            throw new Error("Invalid XHR response from Server. (It doesn't seem to be correct JSON.)");
                                            return;
                                        }
                                        if (json) {
                                            if (options.default) {
                                                if (json.dialog && json.dialog.critical && json.dialog.critical.length) {
                                                    (new aa.gui.Dialog('critical',{
                                                        text: '- '+json.dialog.critical.join('<br>- ')
                                                    })).show();
                                                    options.callback.call(null,undefined,json.dialog);
                                                    return;
                                                }
                                                else if(json.dialog && json.dialog.warning && json.dialog.warning.length) {
                                                    (new aa.gui.Dialog('warning',{
                                                        text: '- '+json.dialog.warning.join('<br>- ')
                                                    })).show();
                                                    options.callback.call(null,json.response,json.dialog);
                                                    return;
                                                }
                                                else if(json.dialog && json.dialog.information && json.dialog.information.length) {
                                                    (new aa.gui.Dialog('information',{
                                                        text: '- '+json.dialog.information.join('<br>- ')
                                                    })).show();
                                                    options.callback.call(null,json.response);
                                                    return;
                                                } else if(typeof json.response !== 'undefined') {
                                                    options.callback.call(null,json.response,json.dialog);
                                                    return;
                                                }
                                            } else if(json.response && json.dialog) {
                                                options.callback.call(null,json.response,json.dialog);
                                                return;
                                            }
                                        }
                                        throw new Error("Invalid XHR response from Server.");
                                        return;
                                        break;
                                    }
                                }
                            }
                        };
                        xhr.onload = function (e) {
                        };
                        xhr.send(data);
                    }
                } else {
                    throw new Error("Invalid form in 'aa.XHR'.");
                }
                break;
            }
        }
    };

    // Getters:
    aa.getEditorField           = (() => {
        function verify (value, verifier) {
            aa.arg.test(verifier, aa.isFunction, "'verifier'");

            const verified = verifier(value);
            aa.throwErrorIf(
                !aa.isBool(verified),
                "'holdIfNot' method must return a Boolean"
            );
            return verified;
        }
        return function (spec) {
            /**
             * @param <object> spec:
             *      @key <bool> autoResize
             *      @key <function> holdIfNot
             *      @key <object> on:
             *          @key <function> cancel
             *          @key <function> end
             *          @key <function> submit
             *      @key <null|string> placeholder
             *      @key <enum: input,textarea> tag
             */
            aa.arg.test(spec, aa.verifyObject({
                autoResize:     aa.isBool,
                holdIfNot:      aa.isFunction,
                on:             aa.verifyObject({
                    cancel:     aa.isFunction,
                    end:        aa.isFunction,
                    submit:     aa.isFunction
                }),
                placeholder:    aa.isNullOrNonEmptyString,
                tag:            aa.inEnum('input', 'textarea'),
                value:          aa.isNullOrNonEmptyString
            }), "'spec'");
            spec.sprinkle({
                autoResize: true,
                holdIfNot: () => true,
                tag: 'input',
            });

            const editorFieldAppName = `aa-editor-field`;
            
            let closed = false;

            const events = {
                blur: () => {
                    events.close(true);
                },
                cancel: () => {
                    events.close(false);
                },
                deletion: () => {
                    aa.selection.from(field).wrap({
                        tag:    'del',
                        trim:   true,
                        toggle: true
                    });
                },
                italic: () => {
                    aa.selection.from(field).wrap({
                        tag:    'i',
                        trim:   true,
                        toggle: true
                    });
                },
                bold: () => {
                    aa.selection.from(field).wrap({
                        tag:    'strong',
                        trim:   true,
                        toggle: true
                    });
                },
                underline: () => {
                    aa.selection.from(field).wrap({
                        tag:    'u',
                        trim:   true,
                        toggle: true
                    });
                },
                focus: () => {
                    aa.events.app(editorFieldAppName).on({
                        'cmdOrCtrl <B>':    events.bold,
                        '<Esc>':            events.cancel,
                        '<Del>':            events.deletion,
                        'alt <Del>':        events.insertion,
                        'cmdOrCtrl <I>':    events.italic,
                        '<Enter>':          events.submit,
                        'cmdOrCtrl <U>':    events.underline,
                    }, ['preventDefault', 'always']);
                },
                insertion: () => {
                    aa.selection.from(field).wrap({
                        tag:    'ins',
                        trim:   true,
                        toggle: true
                    });
                },
                submit: () => {
                    events.close(true);
                },
                close: (submit=true) => {
                    aa.arg.test(submit, aa.isBool, "'submit'");

                    const value = field.value;
                    
                    // Prevent from doing anything if field is empty:
                    if (!verify(value, spec.holdIfNot)) { return; }
                    
                    if (!closed) {
                        aa.wait(10, () => {
                            if (submit) {
                                spec?.on?.submit?.(value);
                            } else {
                                spec?.on?.cancel?.(value);
                            }

                            aa.events.app(editorFieldAppName).cancel('<Esc>', cancel);
                            aa.events.removeApp(editorFieldAppName);

                            spec?.on?.end?.(value);
                        });
                        closed = true;
                    }
                },
            };

            const nodeSpec = {
                on: {input: e => {
                    if (spec.tag === 'textarea' && spec.autoResize) {
                        aa.resizeTextarea(field);
                    }
                }}
            };
            switch (spec.tag) {
            case 'textarea':
                nodeSpec.text = spec.value; 
                break;
            case 'input':
            default:
                nodeSpec.value = spec.value; 
                break;
            }
            if (spec.placeholder) { nodeSpec.placeholder = spec.placeholder; }

            const field = $$(spec.tag, nodeSpec);
            if (spec.tag === 'textarea' && spec.autoResize) {
                aa.resizeTextarea(field);
                field.on('input', e => {
                    aa.resizeTextarea(field);
                });
            }
            field.on('focus',   events.focus);
            field.on('blur',    events.blur);
            field.on('dblclick', e => {
                e.preventDefault();
                e.stopPropagation();
            });

            return field;
        };
    })();
    aa.getLang                  = function () {
        let html,lang;

        html = document.getElementsByTagName('html');

        if (html && html.length) {
            html = html[0];
            lang = html.getAttribute('lang') || html.getAttribute('xml:lang') || undefined;
            if (aa.nonEmptyString(lang)) {
                return lang.trim().toLowerCase();
            }
        }
        return aa.defaultLang;
    };
    aa.lorem                    = function (spec={}) {
        /**
         * Generate a lorem text.
         * 
         * @param <object> spec:
         *      @key <int> repeat:  The number of times the lorem will be repeated.
         *      @key <int> words:   The number of words to generate for each lorem.
         */
        aa.arg.test(spec, aa.verifyObject({
            repeat: aa.isStrictlyPositiveInt,
            words:  aa.isStrictlyPositiveInt
        }), "'spec'");
        spec.sprinkle({
            repeat: 1,
            words:  null,
        });

        const parts = [];
        const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

        aa.repeat(spec.repeat, () => {
            parts.push(
                lorem.split(' ')
                .filter((word, i) => (!spec.words || i < spec.words))
                .join(' ')
            );
        });
        return parts.join('\n\n');
    };
    aa.getLorem                 = function (times=1) {
        aa.deprecated('aa.getLorem');
        aa.arg.test(times, aa.isStrictlyPositiveInt, "'times'");

        const parts = [];
        const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

        aa.repeat(times, () => {
            parts.push(lorem);
        });
        return parts.join('\n\n');
    };
    aa.getMaxZIndex             = function () {
        let dom = document.body;
        let highest = 0;
        let i = 0;

        if (arguments && arguments.length) {
            if (aa.isElement(arguments[0])) {
                dom = arguments[0];
            } else {
                throw new TypeError("First argument must be a DOM element.");
                return false;
            }
        }

        aa.walkTheDOM(dom, function (node) {
            // i++;
            switch (node.nodeName.toLowerCase()) {
                case 'script':
                case 'style':
                case 'iframe':
                    break;
                default:
                    if (aa.isElement(node)) {
                        // let zIndex = document.defaultView.getComputedStyle(node,null).getPropertyValue("z-index");
                        let zIndex = window.getComputedStyle(node,null).getPropertyValue("z-index");
                        if (zIndex !== 'auto') {
                            zIndex = parseInt(zIndex);
                            if (zIndex > highest) {
                                highest = zIndex;
                            }
                        }
                    }
                    break;
            }
            return highest;
        });

        dom.children.forEach(function (child) {
            return;
            switch (child.nodeName.toLowerCase()) {
                case 'script':
                case 'style':
                case 'iframe':
                    break;
                default:
                    let zChild;
                    let zIndex = document.defaultView.getComputedStyle(child,null).getPropertyValue("z-index");
                    if (zIndex !== 'auto') {
                        zIndex = parseInt(zIndex);
                        if (zIndex > highest) {
                            highest = zIndex;
                        }
                        if (child.children.length) {
                            zChild = aa.getMaxZIndex(child);
                        }
                        if (zChild > highest) {
                            highest = zChild;
                        }
                    }
                    break;
            }
        });

        return highest;
    };
    // ----------------------------------------------------------------
    // Overwrite:
    aa.deprecated = function (txt) {
        const message = "This feature is no longer recommended. Avoid using it, and update existing code if possible.";
        if (!aa.settings.production) {
            aa.gui.notif(`${message}`, {
                title: txt.replace(/\</g, '&lt;').replace(/\>/g, '&gt;'),
                type: "warning"
            });
        }
        console.warn(`"Deprecated: ${txt}. ${message}`);
    };
    // ----------------------------------------------------------------
    // Aliases:
    const $$ = aa.html;
    const icon = aa.icon;
    // ----------------------------------------------------------------
    (function () { /* Events */
        window.on("resize", function () { aa.events.execute("windowresize"); });
        window.onbeforeunload   = function () { return aa.events.execute("beforeunload"); }; // return value has to be a String
        window.onunload         = function () { return aa.events.execute("windowunload"); }; // return value has to be a String

        document.on((aa.browser.is("firefox") ? "DOMMouseScroll" : "mousewheel"), aa.events.custom.mousewheel);
        document.on("keydown", (e) => { return aa.events.custom.keyboard(e); });
        // document.on("keyup", aa.events.custom.keyboard);
        // document.on("click", aa.events.custom.click);
        document.on("contextmenu", (e) => { return aa.events.custom.click(e); });
        document.on("mousemove", (e) => { return aa.mouse.onMove(e); });
        document.on("mousedown", (e) => { return aa.events.execute("mousedown", e); });
        document.on("mouseup", (e) => { return aa.events.execute("mouseup", e); });

        // Custom:
        window.on("shortcutchange", (e) => { return aa.events.execute("shortcutchange", e); });
        
        // bodyload:
        (function () {
            let loadingTimer = null;
            let loaded = false;

            const bodyload = function () {
                if (!loaded) {
                    // quit if this function has already been called
                    if (loaded) {
                        return;
                    }
                    
                    // kill the timer:
                    if (loadingTimer) {
                        clearInterval(loadingTimer);
                        loadingTimer = null;
                    }
                    
                    // do stuff :
                    aa.versioning.onbodyload();
                    if (aa.events) {
                        aa.events.execute("bodyload");
                    }
                    
                    // flag this function so we don't do the same thing twice
                    loaded = true;
                }
            };
            
            // for Mozilla:
            if (document.addEventListener) {
                // document.addEventListener("DOMContentLoaded", bodyload, false); // call the onload handler
                document.on("DOMContentLoaded", bodyload);
                return;
            }

            // for Internet Explorer:
            /*@cc_on @*/
            /*@if(@_win32)
                document.write('<script id="__ie_onload" defer src="javascript:void(0);"><\/script>');
                var script = document.getElementById("__ie_onload");
                script.onreadystatechange = function () {
                    if (this.readyState == "complete") {
                        bodyload(); // call the onload handler
                    }
                };
            /*@end @*/

            // for Safari:
            if (/WebKit/i.test(navigator.userAgent)) { // sniff
                loadingTimer = setInterval(function () {
                    if (/loaded|complete/.test(document.readyState)) {
                        bodyload(); // call the onload handler
                    }
                }, 10);
                return;
            }

            // for other browsers:
            window.onload = bodyload;
        })();
    })();
    // ----------------------------------------------------------------
    (function () { /* tests */
        return;
        ({
            bodyload: () => {
                aa.gui.todo(("Douglas Crockford recommends to create Objects like this:\n<pre>"
                    +"const constructor = function(spec){\n"
                    +"    let {member} = spec;\n"
                    +"    \n"
                    +"    let method = function(){\n"
                    +"        console.log(member);\n"
                    +"    };\n"
                    +"    \n"
                    +"    return Object.freeze({\n"
                    +"        method\n"
                    +"    });\n"
                    +"};\n"
                    +"const obj = new constructor({\n"
                    +"    member: 'value'\n"
                    +"});\n"
                    +"console.log(obj);\n"
                    +"obj.method();\n"
                    +"</pre>"
                    )
                    .replace(/\n/g, "<br>")
                    .replace(/\s/g, "&nbsp;")
                , false);
            }
        }).forEach((callback, evtName) => {
            aa.events.app("aaFramework").on(evtName, callback , ["forever"]);
        });
    })();
})();
