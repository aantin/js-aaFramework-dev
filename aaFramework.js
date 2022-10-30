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
    addStyleToScript(ENV.MODULE_NAME+".js", ENV.MODULE_NAME+".css");
    addStyleToScript(ENV.MODULE_NAME+".js", "vendors/css/font-awesome-4.7.0/css/font-awesome.min.css");
    addStyleToScript(ENV.MODULE_NAME+".js", "vendors/css/google-iconfont/material-icons.css");
    addStyleToScript(ENV.MODULE_NAME+".js", "vendors/css/google-iconfont-aa.css");
    // ----------------------------------------------------------------
    // Public:
    aa.versioning.test({
        name: ENV.MODULE_NAME,
        version: "2.0",
        dependencies: {
            aaJS: "^2.0"
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
    // Prototypes:
    aa.prototypes = Object.freeze({
        defineAccessors: function (publics, mode) {
            if (!isObject(publics)) { throw new TypeError("Argument must be an Object."); }
            if (mode && mode.verify({
                accessor:   o => isArrayOfStrings(o),
                reader:     o => isArrayOfStrings(o),
                writer:     o => isArrayOfStrings(o),
            })) {
                if (mode.accessor) {
                    mode.accessor.forEach((key) => {
                        Object.defineProperty(this, key, {
                            get: () => { return publics[key]; },
                            set: (value) => {
                                const method = "set"+key.firstToUpper();
                                if (typeof this[method] === "function") {
                                    this[method].call(this, value);
                                }
                            }
                        });
                    });
                }
                if (mode.reader) {
                    mode.reader.forEach((key) => {
                        Object.defineProperty(this, key, {
                            get: () => { return publics[key]; },
                        });
                    });
                }
                if (mode.writer) {
                    mode.writer.forEach((key) => {
                        Object.defineProperty(this, key, {
                            set: (value) => {
                                const method = "set"+key.firstToUpper();
                                if (typeof this[method] === "function") {
                                    this[method].call(this, value);
                                }
                            }
                        });
                    });
                }
            }
        },
        events: {
            getEmitter:     function (getter, key /*, spec */) {
                /**
                 *  Usage:
                 *      const emit = getEmitter(get, "listeners");
                 * 
                 * @param {function} getter
                 * @param {string} key
                 * @param {object} spec (optional)
                 * 
                 * @return {function}
                 */
                aa.arg.test(getter, isFunction, `'getter'`);
                aa.arg.test(key, nonEmptyString, `'key'`);
                const spec = aa.arg.optional(arguments, 2, {}, arg => isObject(arg) && arg.verify(aa.prototypes.events.specs));

                return function emit (eventName, data) {
                    /**
                     *  Usage:
                     *      emit.call(this, "eventname", data);
                     * 
                     * @param {string} eventName
                     * @param {any} data
                     * 
                     * @return {void}
                     */
                    aa.arg.test(eventName, nonEmptyString, `'eventName'`);
                    const listeners = getter(this, key);
                    aa.arg.test(listeners, isObject, `'listeners'`);

                    eventName = eventName.trim();
                    if (listeners.hasOwnProperty(eventName)) {
                        listeners[eventName].forEach(callback => {
                            const event = null; // A future event, some day...
                            callback(event, data);
                        });
                    }
                };
            },
            getListener:    function (getter, key /*, spec */) {
                /**
                 * Usage:
                 *      MyClass.prototype.on = getListener(get, "listeners");
                 * 
                 * @param {function} getter
                 * @param {string} key
                 * @param {object} spec (optional)
                 * 
                 * @return {function}
                 */
                aa.arg.test(getter, isFunction, `'getter'`);
                aa.arg.test(key, nonEmptyString, `'key'`);
                const spec = aa.arg.optional(arguments, 2, {}, arg => isObject(arg) && arg.verify(aa.prototypes.events.specs));

                const on = function (eventName, callback) {
                    /**
                     *  Usage:
                     *      this.on("eventname", (data) => {
                     *          // do stuff with data...
                     *      }));
                     *  or
                     *      this.on({
                     *          eventname: data => {
                     *              // do stuff with data...
                     *          }
                     *      });
                     * 
                     * @param {string} eventName
                     * @param {function} callback
                     * 
                     * @return {object} this, for chaining
                     */

                    const listeners = getter(this, key);
                    aa.arg.test(listeners, isObject, `'listeners'`);

                    if (isObject(eventName)) {
                        aa.arg.test(eventName, isObjectOfFunctions, `'eventName'`);
                        eventName.forEach((callback, name) => {
                            on.call(this, name, callback);
                        });
                        return;
                    }

                    aa.arg.test(eventName, nonEmptyString, `'eventName'`);
                    aa.arg.test(callback, isFunction, `'callback'`);

                    eventName = eventName.trim();
                    if (!listeners.hasOwnProperty(eventName)) {
                        listeners[eventName] = [];
                    }
                    listeners[eventName].push(callback);
                    return this;
                };
                return on;
            },
            specs: {
                verbose: value => typeof value === "boolean"
            }
        },
        hydrate:        function (spec /*, startWith */) {
            /**
             * @param {object} spec={}
             * @param {array} startWith=[]
             *
             * @return {void}
             */
            spec = arguments && arguments.length > 0 && isObject(arguments[0]) ? arguments[0] : {};
            const startWith = arguments && arguments.length > 1 && isArray(arguments[1]) ? arguments[1] : [];

            const set = (k, v) => {
                const method = "set"+k.firstToUpper();
                if (typeof this[method] === "function") {
                    this[method].call(this, v);
                }
            };

            // Do first:
            startWith.forEach((key) => {
                if (spec.hasOwnProperty(key)) {
                    set(key, spec[key]);
                    delete spec[key];
                }
            });

            // Then:
            spec.forEach((v, k) => {
                set(k, v);
            });
        },
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
                    aa.prototypes.verify({ key: nonEmptyString })("key", key);
                    const results = privates.get(that, "data");
                    if (!results) {
                        return undefined;
                    }
                    return results[key];
                },

                /**
                 * @param {any} that;
                 * @param {String} key;
                 * @param {any} value;
                 *
                 * @return {void}
                 */
                set: function (that, key, value) {
                    aa.prototypes.verify({ key: nonEmptyString })("key", key);
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
            aa.prototypes.verify({ param: (key) => { return (nonEmptyString(key) || isArrayOfStrings(key)); } })("param", param);

            if (isString(param)) {
                this.getters([param.trim()]);
            } else if (isArray(param)) {
                param.forEach((key) => {
                    Object.defineProperty(this, key, {get: () => { return get(this, key); }})
                });
            }
        },
        initGetters:    function (list) {
            /**
             * @param {Array} list
             */
            aa.prototypes.verify({list: (arr) => { return (isArray(arr) && arr.reduce((ok, item) => { return (nonEmptyString(item) ? ok : false); }, true)); }})("list", list);
            list.forEach((key) => {
                Object.defineProperty(this, key, {get: () => { return get(this, key); }});
            });
        },
        dispatcher:     function (listeners) {
            aa.arg.test(listeners, isObject(listeners) && listeners.verify({
                root: nonEmptyString,
                names: isArrayOfStrings,
            }, true), 0);

            return (eventName, data) => {
                aa.arg.test(eventName, nonEmptyString, 0);

                if (!listeners.names.has(eventName)) {
                    warn(`Event '${eventName}' not known.`);
                } else {
                    aa.events.fire(`${listeners.root}:${this.id}:${eventName}`, data);
                }
            };
        },
        listener:       function (listeners) {
            aa.arg.test(listeners, isObject(listeners) && listeners.verify({
                root: nonEmptyString,
                names: isArrayOfStrings
            }, true), 0);

            return (eventName, callback) => {
                aa.arg.test(eventName, nonEmptyString, 0);
                aa.arg.test(callback, isFunction, 1);

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
            aa.prototypes.verify({list: (arr) => { return (isArray(arr) && arr.reduce((ok, item) => { return (nonEmptyString(item) ? ok : false); }, true)); }})("list", list);
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
            aa.arg.test(param, key => nonEmptyString(key) || isArrayOfStrings(key), `'param'`);
            // aa.prototypes.verify({ param: (key) => { return (nonEmptyString(key) || isArrayOfStrings(key)); } })("param", param);

            if (isString(param)) {
                this.setters([param.trim()]);
            } else if (isArray(param)) {
                param.forEach((key) => {
                    Object.defineProperty(this, key.trim(), {set: (value) => { set(this, key, value); }});
                });
            }
        },
        toObjectMaker:  function (keys) {
            if (!isArray(keys)) { throw new TypeError("Argument must be an Object."); }

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
            if (!isObject(o)) { throw new TypeError("Argument must be an Object."); }
            return function (key, value) {
                if (!nonEmptyString(key) || !o.hasOwnProperty(key)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!isFunction(o[key])) { throw new TypeError("Verifier must be a Function."); }
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

        if (!isObject(keyValues)) { throw new TypeError('First argument must be an Object.'); }
        if (!isObject(spec)) { throw new TypeError("second argument must be an Object."); }

        aa.arg.test(spec, aa.verifyObject({
            getter: isFunction,
            setter: isFunction,
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

        if (!isObject(keyValues)) { throw new TypeError('First argument must be an Object.'); }
        if (!isObject(spec)) { throw new TypeError("second argument must be an Object."); }

        spec.verify({
            getter: isFunction,
            setter: isFunction,
        });

        const getter = spec.getter || get;
        const setter = spec.setter || set;

        keyValues.forEach((value, key) => {
            setter(this, key, value);
        });
    };
    aa.defineAccessors      = function (accessors /*, spec */) {
        const spec = arguments && arguments.length > 1 ? arguments[1] : {};

        if (!isObject(accessors)) { throw new TypeError('First argument must be an Object.'); }
        if (!isObject(spec)) { throw new TypeError("Second argument must be an Object."); }

        accessors.verify({
            execute: isObject,
            privates: isObject,
            publics: isObject,
            read: isObject,
            write: isObject
        });
        spec.verify({
            getter: isFunction,
            setter: isFunction,
        });

        const getter = spec.getter || get;
        const setter = spec.setter || set;

        accessors.forEach((keyValues, accessor) => {
            keyValues.forEach((value, key) => {
                const thisSetter = 'set'+key.firstToUpper();
                setter(this, key, value);
                switch (accessor) {
                    case 'publics':
                        Object.defineProperty(this, key, {
                            get: () => {
                                return getter(this, key);
                            },
                            set: (value) => {
                                if (typeof this[thisSetter] === 'function') {
                                    this[thisSetter].call(this, value);
                                } else {
                                    console.warn("Setter '"+key+"' not implemented.");
                                }
                            }
                        });
                        break;
                    case 'read':
                        Object.defineProperty(this, key, {
                            get: () => {
                                return getter(this, key);
                            }
                        });
                        break;
                    case 'write':
                        Object.defineProperty(this, key, {
                            set: (value) => {
                                if (typeof this[thisSetter] === 'function') {
                                    this[thisSetter].call(this, value);
                                } else {
                                    console.warn("Setter '"+key+"' not implemented.");
                                }
                            }
                        });
                        break;
                    case 'execute':
                        Object.defineProperty(this, key, {
                            get: () => {
                                return getter(this, key).call(this);
                            }
                        });
                        break;
                }
            });
        });
    };
    // ----------------------------------------------------------------

    // Classes:
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
        if (aa.ActionGroup.prototype.hydrate === undefined) {

            // General:
            aa.ActionGroup.prototype.hydrate        = aa.prototypes.hydrate;
            aa.ActionGroup.prototype.isValid        = function () {
                return (
                    !!get(this, "label")
                );
            };

            // Setters:
            aa.ActionGroup.prototype.addAction      = function (action) {
                if (!(action instanceof aa.Action)) { throw new TypeError("Argument must be an Action."); }
                get(this, "collection").push(action);
            };
            aa.ActionGroup.prototype.setCollection  = function (arr) {
                const errors = [];
                const parse = (arr) => {
                    if(!isArray(arr)) { throw new TypeError("Argument must be an Array."); }

                    const list = [];
                    arr.forEach((item) => {
                        if (item instanceof aa.ActionGroup && item.isValid()) {
                            list.push(item);
                        } else if (item instanceof aa.Action && item.isValid()) {
                            list.push(item.name);
                        } else if (nonEmptyString(item)) {
                            list.push(item.trim());
                        } else if (item === null) {
                            list.push(null);
                        } else if (item === undefined) {
                            deprecated("undefined as separator");
                            list.push(null);
                        } else { throw new TypeError("Argument not valid."); }
                    });
                    return list;
                };
                const group = parse(arr);
                if (errors.length) {
                    aa.gui.notification(errors.join("<br>"), {type: "warning"});
                } else {
                    set(this, "collection", group);
                }
            };
            aa.ActionGroup.prototype.setLabel       = function (str) {
                if (!nonEmptyString(str)) { throw new TypeError("Argument must be a non-empty String."); }
                set(this, "label", str.trim());
            };

            // Getters:
        }

        // Instanciate:
        construct.apply(this, arguments);
    };
    aa.Action                   = function () {
        /*
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

        // Attributes:
        const publics = {
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
            callbacks: [], // deprecated
            listeners: {}
        };
        const privates = {
            addToManager: true,
            constructing: true,
            nodesToListen: {}
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
        const verifier = {
            accessible: isBool,
            addToManager: isBool,
            app: nonEmptyString,
            checked: isBool,
            callback: isFunction,
            callbacks: isArrayOfFunctions,
            description: nonEmptyString,
            evtName: nonEmptyString,
            disabled: isBool,
            icon: nonEmptyString,
            name: nonEmptyString,
            on: isObject,
            priority: nonEmptyString,
            text: nonEmptyString,
            tooltip: nonEmptyString,
            type: type => types.has(type)
        };
        const verify = aa.prototypes.verify(verifier);
        let count = 0;

        // Private:
        const construct         = function(){
            /**
             * @param {object} spec
             * @param {bool} addToManager=true
             *
             * @return {void}
             */

            set(this, "constructing", true);
            initAttributes.call(this);
            initGetters.call(this);
            initListeners.call(this);

            // Add to manager:
            const addToManager = (arguments && arguments.length > 1 && isBool(arguments[1]) ? arguments[1] : get(this, "addToManager"));
            this.setAddToManager(addToManager);
            
            // Hydrate:
            const spec = (arguments && arguments.length > 0 && isObject(arguments[0]) ? arguments[0] : undefined);
            this.hydrate(spec, ["checkable"]);

            initAnonymous.call(this);
            set(this, "constructing", false);
            this.addToManager();
            count += 1;
        };
        const _execute          = function (/* param */) {
            /**
             * @param {any} param (optional)
             *
             * @return {void}
             */
            const param = arguments && arguments.length ? arguments[0] : undefined;
            if (!get(this, "disabled")) {
                this.fire("execute", param);
                get(this, "callbacks").forEach(function (callback) {
                    if (!privates.get(aa.Action, "onceExecuteDeprecated")) {
                        const onceExecuteDeprecated = true;
                        privates.set(aa.Action, onceExecuteDeprecated);
                        deprecated("aa.Action.callbacks");
                    }
                    callback(param);
                });
            }
        };
        const _enable           = function () {
            /**
             * @param {boolean} disabled=false
             * @param {boolean} fire=true
             * return void
             */
            const disabled = (
                arguments && arguments.length && isBool(arguments[0])
                ? !arguments[0]
                : false
            );
            this.setDisabled(disabled);
            return get(this, "disabled");
        };
        const _disable          = function () {
            /**
             * @param {boolean} disabled=true
             * return void
             */
            const disabled = (
                arguments && arguments.length && isBool(arguments[0])
                ? arguments[0]
                : true
            );
            this.setDisabled(disabled);
            return get(this, "disabled");
        };
        const dispatch          = function (evtName, param) {
            // Dispatch on listened nodes:
            evtName = "on"+evtName;
            const list = get(this, "nodesToListen");
            if (list.hasOwnProperty(evtName)) {
                list[evtName].forEach((listener) => {
                    listener.callback(listener.node, param);
                });
            }
        };
        const initAnonymous     = function () {
            this.execute = (e) => { _execute.call(this, e); };
            this.enable = (e) => { _enable.call(this, e); };
            this.disable = (e) => { _disable.call(this, e); };
        };
        const initAttributes    = function () {
            publics.forEach((v, k) => {
                set(this, k, v);
            });
            privates.forEach((v, k) => {
                set(this, k, v);
            });
        };
        const initGetters       = function () {
            publics.forEach((v, k) => {
                Object.defineProperty(this, k, {
                    get: () => {
                        return Object.freeze(get(this, k));
                    },
                    set: (v) => {
                        const method = "set"+k.firstToUpper();
                        if (typeof this[method] === "function") {
                            this[method](v);
                        }
                    }
                });
            });
            Object.defineProperty(this, "shortcut", {
                get: () => {
                    return Object.freeze(getShortcut.call(this));
                }
            });
            Object.defineProperty(this, "shortcuts", {
                get: () => {
                    return Object.freeze(getShortcuts.call(this));
                }
            });
        };
        const initListeners     = function () {
            allowedEvents.forEach(function (evtName) {
                const listeners = get(this, "listeners");
                if (!listeners.hasOwnProperty(evtName)) {
                    listeners[evtName] = [];
                }
            },this);
        };
        const getShortcut       = function () {
            const appName = this.app;
            const app = aa.events.app(appName);
            return (app ?
                app.getShortcutOf(this)
                : undefined
            );
        };
        const getShortcuts      = function () {
            const appName = this.app;
            const app = aa.events.app(appName);
            return (app ?
                app.getShortcutsOf(this)
                : []
            );
        };

        // Methods:
        if (aa.Action.prototype.hydrate === undefined) {

            // General:
            aa.Action.prototype.hydrate         = aa.prototypes.hydrate;
            aa.Action.prototype.addToManager    = function () {
                if (get(this, "addToManager")) {
                    aa.actionManager.update(this);
                }
            };
            /**
             * @param {string} evtName="execute" (optional)
             * @param {any} param=undefined (optional)
             *
             * @return {void}
             */
            aa.Action.prototype.fire            = function (/* evtName, param */) {
                let evtName = arguments && arguments.length > 0 ? arguments[0] : "execute";
                const param = arguments && arguments.length > 1 ? arguments[1] : undefined;
                if (!nonEmptyString(evtName)) { throw new TypeError("First Argument must be a non-empty String."); }

                evtName = "on"+evtName.trim();
                const listeners = get(this, "listeners");
                if (listeners.hasOwnProperty(evtName) && isArray(listeners[evtName])) {
                    if (!(evtName === "onexecute" && get(this, "disabled"))) {
                        listeners[evtName].forEach(function (callback) {
                            callback(param);
                        });
                    }
                }
                if (param !== undefined && !(evtName === "onexecute" && get(this, "disabled"))) {
                    dispatch.call(this, evtName.replace(/^on/, ''), param);
                }
            };
            aa.Action.prototype.isValid         = function () {
                
                return (get(this, "name") !== null);
            };
            aa.Action.prototype.listenNode      = function (node, evtName, callback) {
                /**
                 * @param {element} node
                 * @param {string} evtName
                 * @param {function} callback
                 *
                 * @return {void}
                 */
                if (!isElement(node)) { throw new TypeError("First argument must be an Element node."); }
                if (!allowedEvents.has(evtName)) { throw new TypeError("Second argument not valid."); }
                if (!isFunction(callback)) { throw new TypeError("Third argument must be a Function."); }

                const list = get(this, "nodesToListen");
                if (!list.hasOwnProperty(evtName)) {
                    list[evtName] = [];
                }
                
                list[evtName].push({
                    node: node,
                    callback: callback
                });
            };
            aa.Action.prototype.on              = function (evtName, callback) {
                /**
                 * If not already added, add a callback Function to Action's events listener.
                 *
                 * @param {string} evtName
                 * @param {function} callback
                 *
                 * return {boolean} true if callback could be added, false if already existed
                 */
                
                let res = false;
                
                if (!nonEmptyString(evtName)) {   throw new TypeError("First argument must be a non-empty String."); }
                if (!isFunction(callback)) {      throw new TypeError("Second argument must be a Function."); }
                
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
            };

            // Setters:
            aa.Action.prototype.get             = aa.prototypes.get;
            aa.Action.prototype.set             = aa.prototypes.set;
            aa.Action.prototype.setAccessible   = function (/* bool */) {
                const bool = arguments && arguments.length ? arguments[0] : true;
                verify("accessible", bool);
                set(this, "accessible", bool);
            };
            aa.Action.prototype.setAddToManager = function (bool) {
                if (!isBool(bool)) { throw new TypeError("Argument should be a Boolean."); }
                
                set(this, "addToManager", bool);
                return bool;
            };
            aa.Action.prototype.setApp          = function (name) {
                verify("app", name);
                set(this, "app", name.trim());
                return true;
            };
            aa.Action.prototype.setCheckable    = function (bool) {
                if (!isBool(bool)) { throw new TypeError("Argument should be a Boolean."); }
                
                const change = (get(this, "checkable") !== bool);
                set(this, "checkable", bool);
                if (!get(this, "constructing") && change) {
                    this.fire("checkablechange", bool);
                }
            };
            aa.Action.prototype.setChecked      = function (bool) {
                if (!isBool(bool)) { throw new TypeError("Argument should be a Boolean."); }

                if (get(this, "checkable")) {
                    const change = (get(this, "checked") !== bool);
                    set(this, "checked", bool);
                    if (!get(this, "constructing") && change) {
                        this.fire("checkchange", bool);
                    }
                }
                return bool;
            };
            aa.Action.prototype.setDescription  = function (str) {
                verify("description", str);
                const change = (get(this, "description") !== str);
                set(this, "description", str);
                if (!get(this, "constructing") && change) {
                    this.fire("descriptionchange", str);
                }
                return true;
            };
            aa.Action.prototype.setDisabled     = function (disabled) {
                /**
                 * @param {boolean} disabled
                 *
                 * @return {void}
                 */
                
                verify("disabled", disabled);
                const change = (get(this, "disabled") !== disabled);
                set(this, "disabled", disabled);
                if (!get(this, "constructing") && change) {
                    this.fire("disablechange", disabled);
                    this.fire((disabled ? "dis" : "en")+"able", disabled);
                }
                return get(this, "disabled");
            };
            aa.Action.prototype.setCallback     = function (f) {
                deprecated("aa.Action.callbacks");
                verify("callback", f);

                get(this, "listeners")["onexecute"].push(f); // now in 'onexecute' instead of in 'callbacks'
                return true;
            };
            aa.Action.prototype.setCallbacks    = function (list) {
                verify("callbacks", list);

                return list.forEach((callback) => {
                    this.setCallback(callback);
                });
            };
            aa.Action.prototype.setIcon         = function (str) {
                verify("icon", str);
                const previous = get(this, "icon");
                const change = (previous !== str);
                set(this, "icon", str.trim())
                if (!get(this, "constructing") && change) {
                    this.fire("iconchange", {
                        new: str,
                        previous: previous
                    });
                }
                return true;
            };
            aa.Action.prototype.setName         = function (p) {
                verify("name", p);
                set(this, "name", p.trim());
                return true;
            };
            aa.Action.prototype.setOn           = function (o) {
                verify("on", o);

                const verifier = {};
                allowedEvents.forEach((evtName) => {
                    evtName = evtName.replace(/^on/, "");
                    verifier[evtName] = isFunction
                });
                if (!o.verify(verifier)) { throw new TypeError("'on' argument is not compliant."); }

                o.forEach((callback, evtName) => {
                    this.on(evtName, callback);
                });
            };
            aa.Action.prototype.setPriority     = function (p) {
                verify("priority", p);

                p = p.trim().toLowerCase();
                if (priorities.has(p)) {
                    const change = (get(this, "priority") !== p);
                    set(this, "priority", p);
                    if (!get(this, "constructing") && change) {
                        this.fire("prioritychange", p);
                    }
                    return true;
                }
            };
            aa.Action.prototype.setText         = function (str) {
                verify("text", str);

                const change = (get(this, "text") !== str);
                set(this, "text", str.trim());
                if (!get(this, "constructing") && change) {
                    this.fire("textchange", str);
                }
                return true;
            };
            aa.Action.prototype.setTooltip      = function (p) {
                verify("tooltip", p);

                set(this, "tooltip", p.trim());
                return true;
            };
            aa.Action.prototype.setType         = function (p) {
                verify("type", p);
                set(this, "type", p);
                if (!get(this, "icon")) {
                    switch (p) {
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
            };

            // Getters:
            aa.Action.prototype.getDomLi        = function () {
                let li = aa.html('li');
                li.innerHTML = this.getText();
                if (get(this, "tooltip")) {
                    li.title = get(this, "tooltip");
                }
                if (get(this, "callbacks").length > 0) {
                    get(this, "callbacks").forEach(function (callback) {
                        li.on('click',callback);
                    });
                }
                return li;
            };
            aa.Action.prototype.getDescription  = function () {
                return Object.freeze(
                    get(this, "description")
                    ? get(this, "description")
                    : (
                        get(this, "name")
                        ? get(this, "name")
                        : "Action"
                    )
                );
            };
            aa.Action.prototype.getText         = function () {
                return Object.freeze(
                    get(this, "text")
                    ? get(this, "text")
                    : (
                        get(this, "name")
                        ? get(this, "name")
                        : "Action"
                    )
                );
            };
            aa.Action.prototype.getTitle        = function () {
                return Object.freeze(
                    get(this, "title")
                    ? get(this, "title")
                    : (
                        get(this, "name")
                        ? get(this, "name")
                        : "Action"
                    )
                );
            };
            aa.Action.prototype.getCallbacks    = function () {

                return get(this, "listeners").onexecute;
            };
        }

        // Init:
        construct.apply(this, arguments);
    };
    (function () { /* aa.Action static */
        const verifier = {
            appName: nonEmptyString
        };
        const verify = aa.prototypes.verify(verifier);

        aa.Action.build = function (appName, builder) {
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
            verify("appName", appName);

            if (isObject(builder)) {
                const shortcuts = [];
                const spec = {
                    app: appName,
                    name: null,
                    on: {}
                };
                Object.keys(builder).forEach((k) => {
                    if (builder.hasOwnProperty(k)) {
                        const v = builder[k];
                        if (isFunction(v)) {
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
                                    if (isArray(v)) {
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
            } else if (isArray(builder)) {
                return builder.reduce((ok, spec) => {
                    if (spec.app === undefined) {
                        spec.app = appName;
                    }
                    return (!aa.Action.build(appName, spec) ? false : ok);
                }, true);
            } else { throw new TypeError("Argument must be an Object or an Array of Objects."); }
        };
    })();
    aa.Collection               = (() => {
      const {get, set} = aa.mapFactory();

      /**
       * Usage:
       * new aa.Collection({
       *    authenticate: <function>, // a function that returns a boolean, used to verify each item integrity with the collection
       *    on: {
       *        added: <function>,    // a callback function that will be called after an item is added to the collection
       *        removed: <function>   // a callback function that will be called after an item is removed from the collection
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
                authenticate: null
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
                    removed:  aa.isFunction
                }),
                parent: () => true
            },
            
            // Methods:
            construct:          function (/* spec */) {
                const spec = aa.arg.optional(arguments, 0, {});
                this.hydrate(spec);
            },
            emit:               aa.prototypes.events.getEmitter(get, "listeners"),
        };

        // Publics:
        aa.deploy(Collection.prototype, {
            forEach:            function (callback /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = arguments.length > 1 ? arguments[1] : undefined;

                const data = get(this, "data");
                data.forEach(callback, thisArg);
            },
            filter:             function (callback /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = arguments.length > 1 ? arguments[1] : undefined;

                const data = get(this, "data");
                return data.filter(callback, thisArg);
            },
            find:               function (callback /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = arguments.length > 1 ? arguments[1] : undefined;

                const data = get(this, "data");
                return data.find(callback, thisArg);
            },
            map:                function (callback /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = arguments.length > 1 ? arguments[1] : undefined;
                return get(this, "data").map(callback, thisArg);
            },
            reduce:             function (callback, accumulator /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = arguments.length > 1 ? arguments[1] : undefined;

                const data = get(this, "data");
                return data.reduce(callback, accumulator, thisArg);
            },
            some:               function (callback /*, thisArg */) {
                aa.arg.test(callback, aa.isFunction, `callback`);
                const thisArg = arguments.length > 1 ? arguments[1] : undefined;

                const data = get(this, "data");
                return data.some(callback, thisArg);
            },

            // General:
            clear:              function () {
                get(this, `data`).clear();
            },
            has:                function (value) {
                return (get(this, "data").indexOf(value) > -1);
            },
            hydrate:            function (spec) {
                aa.arg.test(spec, aa.verifyObject(privates.verifiers), `'spec'`);
                aa.prototypes.hydrate.call(this, spec);
            },
            indexOf:            function (/* value */) {
                return get(this, "data").indexOf.apply(this, arguments);
            },
            join:               function () {
                return (
                    get(this, `data`).join.apply(this, arguments)
                );
            },
            on:                 aa.prototypes.events.getListener(get, "listeners"),
            push:               function (...items) {
                const data = get(this, "data");
                items.forEach(item => {
                    if (this.authenticate) {
                        if (!this.authenticate(item)) {
                            console.error(`parent:`, this.parent);
                            console.error(`unauthorized item:`, item);
                            throw new Error(`Invalid collection item.`);
                            return;
                        }
                    }
                    data.push(item);
                    const index = data.length - 1;
                    if (!this.hasOwnProperty(index)) {
                        Object.defineProperty(this, index, {
                            get: () => {
                                if (index >= data.length) { throw new Error(``); }
                                return get(this, "data")[index];
                            }
                        });
                    }
                    privates.emit.call(this, `added`, item);
                });
            },
            remove:             function (...items) {
                const removedItems = [];
                const data = get(this, "data");
                items.forEach(item => {
                    const index = data.indexOf(item);
                    if (index > -1) {
                        const removedItem = data.splice(index, 1);
                        if (removedItem.length) {
                            privates.emit.call(this, `removed`, removedItem[0]);
                            removedItems.push(removedItem[0]);
                        }
                    }
                });
                return removedItems;
            },
            sort:               function (func) {
                get(this, 'data').sort(func);
            },

            // Getters:
            toArray:            function () {
                return Array.from(get(this, 'data'));
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

        // Static:
        aa.deploy(Collection, {
        }, {force: true});

        return Collection;
    })();
    aa.Event                    = function (actionOrCallback, options /* , spec */) {
        /*
            aa.Event = function (Function callback[, Array options(String)]);
        */
        /**
         * @param {Function|aa.Action} actionOrCallback
         * @param {Array} options
         * @param {Object} spec (optional)
         */

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
        const verify = aa.prototypes.verify({
            options: isArrayOfStrings
        });

        // Private:
        const construct = function (actionOrCallback /* , options, spec */) {
            const options = (arguments && arguments.length > 1 && verify("options", arguments[1]) ? arguments[1] : undefined);
            const spec = (arguments && arguments.length > 2 ? arguments[2] : {});
            if (!isObject(spec)) { throw new TypeError("Third argument must be an Object."); }

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
        };

        if (this.isValid === undefined) {

            // Methods:
            aa.Event.prototype.isValid              = function () {

                return (typeof this.callback === "function" || this.action instanceof aa.Action);
            };
            aa.Event.prototype.hasOption            = function (s) {
                if (!nonEmptyString(s)) {
                    throw new TypeError("Argument must be a non-empty String.");
                }
                s = s.trim();
                return (this.options.hasOwnProperty(s) && this.options[s]);
            };
            aa.Event.prototype.run                  = function () {

                // this.suspended = false;
            };
            aa.Event.prototype.execute              = function () {
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
            };
            aa.Event.prototype.isModule             = function (s) {
                if (s !== null && !nonEmptyString(s)) {
                    throw new TypeError("Argument must be null or non-empty String.");
                    return false;
                }
                if (isString(s)) {
                    s = s.trim();
                }
                return (s === this.module);
            };
            
            // Setters:
            aa.Event.prototype.setApp               = function (s) {
                if (!nonEmptyString(s)) {
                    throw new TypeError("Argument must be a non-empty string.");
                    return false;
                }
                this.app = s.trim();
            };
            aa.Event.prototype.setActionOrCallback = function (p) {
                if (isFunction(p)) {
                    deprecated('aa.Event.callback');
                    this.setActionOrCallback(new aa.Action({ on: {execute: p}}));
                    return true;
                } else if (p instanceof aa.Action && p.isValid) {
                    this.action = p;
                    return true;
                }
                return false;
            };
            aa.Event.prototype.setModule            = function (s) {
                if (s !== null && !nonEmptyString(s)) {
                    throw new TypeError("Argument must be null or non-empty String.");
                    return false;
                }
                if (isString(s)) {
                    s = s.trim();
                }
                this.module = s;
            };
            aa.Event.prototype.setOptions           = function (a) {
                if (!isArray(a)) { throw new TypeError("Argument must be an Array."); }

                a.forEach((s) => {
                    if (!nonEmptyString(s)) { throw new TypeError("Options need to be non-empty Strings."); }

                    s = s.trim();
                    if (this.options.hasOwnProperty(s)) {
                        this.options[s] = true;
                        if (s === "forever") {
                            this.options.always = true;
                        }
                    }
                    return true;
                });
                return true;
            };
        }

        // Construct:
        construct.apply(this, arguments);
    };
    aa.EventApp                 = function (app) {

        // Attributes:
        set(this, "app",     null);
        set(this, "module",  null);

        // Lists:
        set(this, "events", {});

        const db = new aa.Storage("custom");

        const verify = aa.prototypes.verify({
            appName: nonEmptyString,
            callback: isFunction,
            associableParam: (p) => { return (isFunction(p) || ((p instanceof aa.Event || p instanceof aa.Action) && p.isValid()) || nonEmptyString(p)); },
            callbackOrUndefined: (f) => { return (isFunction(f) || f === undefined); },
            evtName: nonEmptyString
        });
        const construct = function (app) {
            defineProperties.call(this);
            return this.setApp(app);
        };
        const defineProperties = function () {

            aa.prototypes.initGetters.call(this, ['events']);
        };

        // Construct:
        if (this.listen === undefined) {

            // Methods:
            aa.EventApp.prototype.associate     = function (evtName, param) {
                /**
                 * @param {String} evtName
                 * @param {aa.Action|Function|String} param
                 *
                 * @return {void}
                 */

                verify('evtName', evtName);
                verify('associableParam', param)

                const o = {};

                // Regular syntax:
                if (param instanceof aa.Event) {
                    o[evtName] = param;
                    this.listen(o);
                }
                
                // Other syntax:
                else if (isFunction(param)) {
                    this.associate(evtName, new aa.Action({on: {execute: param}}));
                } else if (param instanceof aa.Action) {
                    this.associate(evtName, new aa.Event(param))
                } else if (isString(param)) {
                    this.associate(evtName, aa.actionManager.get(evtName));
                }
            };
            aa.EventApp.prototype.dissociate    = function (evtName /*, param */) {
                /**
                 * @param {String} evtName
                 * @param {aa.Action|Function|String} param
                 *
                 * @return {void}
                 */
                verify("evtName", evtName);
                const param = (arguments && arguments.length>1 && verify("associableParam", arguments[1])) ? arguments[1] : undefined;

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
                            else if (isFunction(param)) {
                                deprecated("aa.Event.callback");
                                if (evt.callback === param) {
                                } else {
                                    list.push(evt);
                                }
                            } else if (param instanceof aa.Action) {
                                if (evt.callback === param.execute) {
                                    deprecated("aa.Event.callback");
                                } else if (evt.action === param) {
                                } else {
                                    list.push(evt.callback);
                                }
                            } else if (isString(param)) {
                                aa.gui.todo("Dissociate with String", true);
                            }
                        });
                    }
                    // this._events[evtName] = list;
                    get(this, "events")[evtName] = list;
                }
            };
            aa.EventApp.prototype.listen        = function (spec) {
                if (!isObject(spec)) { throw new TypeError("Argument must be an object."); }

                spec.forEach((evt, evtName) => {
                    evtName = aa.shortcut.rename(evtName);
                    if (!nonEmptyString(evtName)) { throw new TypeError("Event name must be a non-empty String."); }

                    evtName = aa.shortcut.cmdOrCtrl(evtName);
                    let pile = [];
                    if (evt instanceof aa.Event) {
                        pile.push(evt);
                    } else if(isArray(evt)) {
                        if (!evt.verify((e) => { return (e instanceof aa.Event); })) { throw new TypeError("Every item must be instance of 'aa.Event'."); }
                        evt.forEach((e) => {
                            pile.push(e);
                        });
                    }
                    pile.forEach((event) => {
                        const events = get(this, "events");

                        if (event.callback) {
                            deprecated("aa.Event.callback");
                        }
                        event.setModule(get(this, "module"));
                        event.setApp(get(this, "app"));
                        if (!events.hasOwnProperty(evtName)) {
                            events[evtName] = [];
                        }
                        if (event === null) { log("this one is null"); }
                        events[evtName].push(event);
                    });
                });
                return true;
            };
            aa.EventApp.prototype.on            = function (evtName, callback /*, options */) {
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

                // Recur in case of signature: aa.EventApp.prototype.on({eventName: callback} /*, options */);
                if (isObject(evtName)) {
                    const options = callback || [];
                    evtName.forEach((func, name) => {
                        this.on(name, func, options);
                    });
                    return this;
                }

                // else:
                if (arguments.length === 1 && isObject(arguments[0])) {
                    arguments[0].forEach((func, name) => {
                        this.on(name, func);
                    });
                    return this;
                }

                const spec = {}
                const options = (arguments && arguments.length > 2 && isArray(arguments[2]) ?
                    arguments[2].filter((opt) => {
                        return nonEmptyString(opt);
                    })
                    : ["preventDefault"]
                );
                evtName = aa.shortcut.cmdOrCtrl(evtName);
                if (isFunction(callback)) {
                    spec[evtName] = new aa.Event((new aa.Action({
                        on: {execute: callback}
                    })), options);
                } else if (callback instanceof aa.Action) {
                    const action = callback;
                    spec[evtName] = new aa.Event(action, options);
                } else { throw new TypeError("Second argument must be a Function or an instance of 'aa.Action'."); }
                this.listen(spec);
                return this;
            };
            aa.EventApp.prototype.module        = function (m) {
                if (m !== null && !nonEmptyString(m)) {
                    throw new TypeError("Argument must be null or a non-empty String.");
                    return undefined;
                }
                if (isString(m)) {
                    set(this, "module", m.trim());
                }
                return this;
            };
            aa.EventApp.prototype.pop           = function (evt) {
                const events = get(this, "events");
                if (isString(evt) && events.hasOwnProperty(evt)) {
                    events[evt].pop();
                }
            };
            aa.EventApp.prototype.run           = function (evt) {};
            aa.EventApp.prototype.suspend       = function (p) {
                const o = {toSuspend: []};
                if (!isArray(p) && !nonEmptyString(p)) { throw new TypeError("Argument must be a non-empty String or an Array of non-empty Strings."); }

                if (nonEmptyString(p)) {
                    p = p.trim();
                    o.toSuspend.push(p);
                } else if(isArray(p)) {
                    p.forEach((s) => {
                        if (!nonEmptyString(s)) { throw new TypeError("Argument must be a non-empty String."); }

                        o.toSuspend.push(s);
                    });
                }
                o.toSuspend.forEach((evtName) => {
                    evtName = aa.shortcut.cmdOrCtrl(evtName);
                    let o = {};
                    o[evtName] = new aa.Event(new aa.Action({on: {execute: function () {}}}),["preventDefault"]);
                    this.listen(o);
                });
                delete o.toSuspend;
                return this;
            };

            // Setters:
            aa.EventApp.prototype.setApp        = function (name) {
                verify("appName", name);
                if (isString(name)) {
                    set(this, "app", name.trim());
                }
                set(this, "module", null);
                return this;
            };

            // Getters:
            aa.EventApp.prototype.getEvents     = function (evtName) {
                if (evtName !== undefined && !nonEmptyString(evtName)) { throw new TypeError("Argument must be undefined or a non-empty String."); }

                const events = get(this, "events");

                if (isString(evtName)) {
                    evtName = evtName.trim();
                    // return this._events.hasOwnProperty(evtName) ? this._events[evtName] : undefined;
                    return events.hasOwnProperty(evtName) ? events[evtName] : undefined;
                } else {
                    return events;
                }
            };
            aa.EventApp.prototype.getShortcutOf = function (obj) {

                return this.getShortcutsOf(obj).first;
            };
            aa.EventApp.prototype.getShortcutsOf = function (obj) {
                const shortcuts = [];

                // action's shortcut saved in DB:
                if (get(this, "app") === obj.app) {
                    db.load();
                    const data = db.select("shortcuts");
                    if (data) {
                        const app = data.find((list, name)=> name === get(this, "app"));
                        if (app && obj instanceof aa.Action) {
                            if (app[obj.name] && isArray(app[obj.name])) {
                                return app[obj.name];
                            }
                        }
                    }
                }

                // else:
                this.events.forEach((events, evtName) => {
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
            };

            // Aliases:
            aa.EventApp.prototype.resume        = aa.EventApp.prototype.run;
            aa.EventApp.prototype.pause         = aa.EventApp.prototype.suspend;
        }

        // Init:
        return construct.apply(this, arguments);
    };
    aa.EventResponse            = function (/* name */) {

        this.type = undefined;
        this._preventDefault = false;
        
        // Methods:
        if (this.construct === undefined) {

            // Magic:
            aa.EventResponse.prototype.construct        = function (/* name */) {
                const name = arguments && arguments.length ? arguments[0] : undefined;
                if (name) {
                    this.setEvenement(name);
                }
            };

            // Methods:
            aa.EventResponse.prototype.preventDefault   = function () {
            
                this._preventDefault = true;
            };
            aa.EventResponse.prototype.isPreventDefault = function () {
            
                return this._preventDefault;
            };

            // Setters:
            aa.EventResponse.prototype.setEvenement = function (name) {
                if (nonEmptyString(name)) {
                    this.type = name.trim();
                }
            };
        }

        // Init:
        this.construct.apply(this, arguments);
    };
    aa.Parser                   = function () {
        this.content = null;

        if (typeof aa.Parser.replace === 'undefined') {
            // Methods:
            aa.Parser.prototype.replace     = function (mask,value) {
                if (this.content !== null) {
                    let regex = new RegExp('\\{\\{\\{\\s*'+mask+'\\s*\\}\\}\\}','g');
                    // console.log(regex);
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
                if (isString(content)) {
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
            if (!nonEmptyString(table)) { throw new TypeError("Argument must be a non-empty String.");}
            set(this, "table", table.trim());
        };

        // Methods:
        if (aa.Storage.prototype.hydrate === undefined) {

            // General:
            aa.Storage.prototype.clear       = function () {
                this.data = {};
                register.call(this);
            };
            aa.Storage.prototype.destroy     = function () {
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }

                const name = "aa_DB_"+get(this, "table");
                reset.apply(this);
                if (localStorage.getItem(name)) {
                    localStorage.removeItem(name);
                }
            };
            aa.Storage.prototype.insert      = function (key, value) {
                if (!nonEmptyString(key)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }
                
                key = key.trim();
                this.data[key] = value;
                register.call(this);
            };
            aa.Storage.prototype.isValid     = function () {

                return (get(this, "table") !== null);
            };
            aa.Storage.prototype.load        = function () {
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }

                const data = getStorage.apply(this);
                if (data) {
                    this.data = data;
                }
            };
            aa.Storage.prototype.remove      = function (key) {
                if (!nonEmptyString(key)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }

                key = key.trim();
                if (this.data.hasOwnProperty(key)) {
                    delete this.data[key];
                    register.call(this);
                }
            };
            aa.Storage.prototype.select      = function (key) {
                if (!nonEmptyString(key)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!this.isValid()) { throw new TypeError("Invalid DB."); }

                key = key.trim();
                return (
                    this.data.hasOwnProperty(key)
                    ? this.data[key]
                    : undefined
                );
            };
        }

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
                if (!nonEmptyString(name)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!isFunction(myClass)) { throw new TypeError("Second argument must be a Class."); }

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
    aa.actionManager            = new (function () {

        // Variables:
        let actions = {}; // collection
        let appName = 'aaFramework';
        const verifier = {
            action: (a) => { return (a instanceof aa.Action && a.isValid()); },
            actionName: nonEmptyString,
            appName: nonEmptyString,
            add: (a) => { return (verifier.action(a) || verifier.arrayOfActions(a)); },
            arrayOfActions: (arr) => { return (isArray(arr) && arr.reduce((ok, a) => { return (!verifier.action(a) ? false : ok); }, true)); },
            remove: (p) => { return (verifier.actionName(p) || verifier.action(p)); },
            spec: isObject
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
            } else if(isArray(a)) {
                let res = true;
                a.forEach(function (action) {
                    if (!this.add(action)) {
                        res = false;
                    }
                },this);
                return res;
            }
        };
        this.remove = function (p) {
            verify('remove', p);

            if (isString(p)) {
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
        Object.defineProperty(this, 'actions', {get: function () { return actions; }});
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
                if (!isNode(node)) { throw new TypeError("First argument must be a Node."); }
                const resolve = (arguments && arguments.length > 1 && isFunction(arguments[1]) ? arguments[1] : undefined);
                const reject = (arguments && arguments.length > 2 && isFunction(arguments[2]) ? arguments[2] : undefined);

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
                if (!nonEmptyString(s)) { throw new TypeError("Argument must be a non-empty String."); }
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
                if (!isNode(node)) { throw new TypeError("First argument must be a Node."); }
                if (!isNumber(value)) { throw new TypeError("Second argument must be a Number."); }

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
                    if (isNumber(window.innerHeight)) {
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
                    if (isNumber(window.innerWidth)) {
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
                
                switch (e.which) {
                    case 1: // clic gauche
                    case 3: // clic droit
                        result = aa.events.execute(chaine[e.which], e);
                        break;
                    default:
                        break;
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

                // log(window.event);
                
                e = window.event || e;
                // let mouseWheel = e.wheelDelta || -e.detail;
                
                //let touche=(window.Event)?_event_.which:_event_.keyCode;//pour savoir s'il s'agit de Msie ou de Netscape
                // test("Vous avez appuyé la touche "+"\" "+(touche)+" \"");
                
                // --- Retrieve event object from current web explorer
                //let winObj = checkEventObj(_event_);
                
                // log(e.keyCode);
                this.which          = e.which;
                this.intKeyCode     = e.keyCode;
                this.intAltKey      = e.altKey;
                this.intCtrlKey     = e.ctrlKey;
                this.intShiftKey    = e.shiftKey;
                this.intCmdKey      = e.metaKey;

                // log(String.fromCharCode(this.intKeyCode));

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
                        if (inbetween(this.intKeyCode,65,90)) {
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
                // log('preventDefault:',result.isPreventDefault());
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
                    delete(storage.privates.loadOnce);

                    this.apps.forEach((app, appName) => {
                        app.events.forEach((list, evtName) => {
                            list.forEach((event) => {
                                const action = event.action;
                                if (action && action.isValid() && action.accessible) {
                                    if (storage.privates.shortcuts.default[appName] === undefined) {
                                        storage.privates.shortcuts.default[appName] = {};
                                    }
                                    if (storage.privates.shortcuts.default[appName][action.name] === undefined) {
                                        storage.privates.shortcuts.default[appName][action.name] = [];
                                    }
                                    if (!storage.privates.shortcuts.default[appName][action.name].has(evtName)) {
                                        storage.privates.shortcuts.default[appName][action.name].push(evtName);
                                    }
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
        this.fire = function (eventName /*, *args */) {
            const args = arguments.reduce((args, arg, i) => {
                if (i > 0) {
                    args.push(arg);
                }
                return args;
            }, []);
            if (!nonEmptyString(eventName)) { throw new TypeError("First argument must be a non-empty String."); }

            eventName = eventName.trim();
            const event = new CustomEvent(eventName, {detail: args});
            document.dispatchEvent(event);
        };
        this.on = function (eventName, callback) {
            if (isObject(eventName)) {
                eventName.forEach((callback, evtName) => {
                    this.on(evtName, callback);
                });
                return this;
            }
            if (!nonEmptyString(eventName)) { throw new TypeError("First argument must be a non-empty String."); }
            if (!isFunction(callback)) { throw new TypeError("Second argument must be a Function."); }

            document.on(eventName.trim(), function (e) {
                const args = e.detail || undefined;
                callback.apply(null, e.detail);
            });
            return this;
        };
        this.app                = function () {

            let app = "";
            if (arguments && arguments.length) {
                if (nonEmptyString(arguments[0])) {
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
            if (!nonEmptyString(evtName)) { throw new TypeError("First argument must be a non-empty String."); }
            const e = arguments && arguments.length>1 && arguments[1] instanceof Event ? arguments[1] : undefined;

            let app, evt, evts;
            let response = new aa.EventResponse((e ? e.type : undefined));
            let returnValues = null;

            evtName = aa.shortcut.cmdOrCtrl(evtName);

            if (this.appNames.length) {
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
                        evts.forEach(function (evt,i) {
                            if (i < evts.length-1) {
                                if (evt instanceof aa.Event && evt.isValid() && evt.hasOption("always")) {
                                    getReturnValues(evt, e);
                                }
                            }
                        });
                        evt = evts.getLast();
                        if (evt instanceof aa.Event && evt.isValid()) {
                            getReturnValues(evt, e);
                        }
                    }
                }
            }

            switch (evtName) {
                case "bodyload":
                    storage.privates.loadOnce.apply(this);
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
            if (!nonEmptyString(app)) {
                throw new TypeError("Argument must be a non-empty String.");
                return false;
            }
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
            deprecated("aa.events.getShortcut");
            return aa.shortcut.get(e);
        };
        this.shortcutToString   = function (s) { // abstract 
            deprecated("aa.events.shortcutToString");
            return aa.shortcut.format(s);
        };
    })();
    aa.file                     = Object.freeze(new (function () {
        const verifier = {
            content:        p => (isObject(p) || isString(p)),
            lastModified:   p => isInt(p),
            name:           p => isString(p),
            size:           p => isInt(p),
            type:           p => isString(p)
        };
        this.isValid    = function (file) {
            if (!isObject(file)) { throw new TypeError("Argument must be an Object."); }
            const valid = (!file.find((v, k) => {
                return (
                    !verifier.hasOwnProperty(k)
                    || !verifier[k](v)
                );
            }));
            return (valid
                && (
                    (file.type === "application/json" && isObject(file.content))
                    || isString(file.content)
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
                if (isFunction(arg)) {
                    if (functions.length < 2) {
                        functions.push(arg);
                    } else {
                        throw new TypeError("Reject callback argument has already been given.");
                    }
                } else if(isObject(arg)) {
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
                base64: ((isObject(options)
                    && options.base64 !== undefined
                    && isBool(options.base64)
                ) ?
                    options.base64
                    : false
                ),
                json: ((isObject(options)
                    && options.json !== undefined
                    && isBool(options.json)
                ) ?
                    options.json
                    : false
                ),
                multiple: ((isObject(options)
                    && options.multiple !== undefined
                    && isBool(options.multiple)
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

            aa.arg.test(fileName, nonEmptyString, `'fileName'`);
            aa.arg.test(content, isString, `'content'`);
            const options = aa.arg.optional(arguments, 2, {}, verifyObject({
                base64: isBool,
                mimetype: value => isString(value) && !!value.match(/^[a-z0-9\-]+\/[a-z0-9\-]+$/i),
                utf8: isBool
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
                event.initEvent("click", true, true); // deprecated
                a.dispatchEvent(event);
            } else {
                // Don't know...
            }

            // Revoke URL Object:
            window.URL.revokeObjectURL(url);

            return;
        };
    })());
    aa.gui                      = Object.freeze(new (function () {
    
        // Attributes:
        const dialogs = []; // liste des <aa.gui.Dialog> ouvertes
        const dialogTypes   = Object.freeze(["information", "warning", "critical", "confirm", "prompt", "win", "loading", "shortcut"]);
        const reminders     = {};
        const transitionDuration = .2; // (s)
        const verify        = aa.prototypes.verify({
            appName: nonEmptyString,
            boolean: isBool,
            dialogType: (type) => { return (nonEmptyString(type) && dialogTypes.has(type.trim().toLowerCase())); },
            message: nonEmptyString,
            spec: isObject
        });

        const Reminders = function () {

            // Private attributes:
            const attr = {
                app: "undefined"
            }

            // Methods:
            aa.deploy(Reminders.prototype, {
                add:    function (id, message) {
                    if (!nonEmptyString(id)) { throw new TypeError("First argument must be a non-empty String."); }
                    if (!nonEmptyString(message)) { throw new TypeError("Second argument must be a non-empty String."); }

                    this.app(attr.app);
                    reminders[attr.app][id] = message;
                    return this;
                },
                app:    function (app) {
                    if (!nonEmptyString(app)) { throw new TypeError("Argument must be a non-empty String."); }

                    app = app.trim();
                    attr.app = app;
                    if (!reminders.hasOwnProperty(app)) {
                        reminders[app] = {};
                    }
                    return this;
                },
                edit:   function () {
                    const apps = reminders.keys();
                    apps.sortNatural();
                    const content = $$("div");
                    const db = new aa.Storage("aaDialog");
                    db.load();
                    const remindersInDB = db.select("reminders") || [];

                    apps.forEach((app) => {
                        const fieldset = $$("fieldset", {
                            legend: app
                        });
                        content.appendChild(fieldset);
                        fieldset.appendChild($$("div", "Ask for my confirmation before:"));
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
                        on: {submit: (data) => {
                            data.doNotRemind = data.doNotRemind || [];
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
            aa.arg.test(arr, isArray, 0);
            aa.arg.test(shortcut, isFunction, 1);
            const callback = aa.arg.optional(arguments, 2, undefined);

            if (callback !== undefined && !isFunction(callback)) { throw new TypeError("Third argument must be a Function."); }

            let tops = [];

            const explore = function (arr, shortcut, callback, top) {
                const menu = $$("ul");
                let index = (top === true ? undefined : top);
                arr.forEach((entry, i) => {
                    if (entry instanceof aa.ActionGroup && entry.isValid()) {
                        const item = $$("li", $$("button", '<span class="icon fa fa-fw"></span> '+entry.label));
                        item.classList.add("expand");
                        item.classList.add("shortcut");
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
                    } else if (nonEmptyString(entry) || entry instanceof aa.Action) {
                        const action = (nonEmptyString(entry) ?
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
                                deprecated("action.callbacks");
                            }
                            const span = $$("span"+".icon.fa.fa-fw"+icon+type);
                            const btn = $$("button", span);
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
            
            const construct = function () {
                this.setTheme(aa.settings.theme);
                aa.events.on('themechange', (theme) => {
                    this.setTheme(theme);
                });
                if (arguments && arguments.length) {
                    this.hydrate(arguments[0]);
                }
                aa.prototypes.initGetters.call(this, ["theme", "appName", "items"]);
            };
            const Menu      = function () {

                // Attributes:
                set(this, "theme", null);
                set(this, "appName", null);

                // Lists:
                set(this, "items", []);

                // Instanciate:
                construct.apply(this, arguments);
            };

            // Public methods:
            Menu.prototype.hydrate      = aa.prototypes.hydrate;

            // Setters:
            Menu.prototype.addActions   = function (list) {
                if (!isArray(list)) { throw new TypeError("Argument must be a collection of actions."); }

                return list.forEach(function (a) {
                    return this.addAction(a);
                }, this);
            };
            Menu.prototype.addAction    = function (p) {
                if (nonEmptyString(p)) {
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
            };
            Menu.prototype.addSep       = function () {

                get(this, "items").push(null);
            };
            Menu.prototype.reset        = function () {

                set(this, "items", []);
            };
            Menu.prototype.setAction    = function (a) {
                this.reset();
                this.addAction(a);
            };
            Menu.prototype.setActions   = function (list) {
                this.reset();
                this.addActions(list);
            };
            Menu.prototype.setAppName   = function (str) {
                verify("appName", str);
                set(this, "appName", str.trim());
            };
            Menu.prototype.setTheme     = function (p) {
                if (!nonEmptyString(p)) { throw new TypeError("Argument must be a non-empty String."); }

                p = p.trim();
                if (ENV.THEMES.has(p)) {
                    set(this, "theme", p);
                }
            }

            // Getters:
            Menu.prototype.getNode      = function () {
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
            };
            Menu.prototype.toObject     = function () {
                const o = ["appName", "theme", "items"].reduce((o, key) => {
                    o[key] = get(this, key);
                    return o;
                }, {});
                // o.actions = get(this, "items");
                return Object.freeze(o);
            };
            return Object.freeze(Menu);
        })();
        this.ContextMenu    = (function () {

            // Closure private methods:
            const construct     = function () {
                set(this, "theme", aa.settings.theme);
                aa.events.on('themechange', (theme) => {
                    set(this, "theme", theme);
                });
                if (arguments && arguments.length) {
                    set(this, "menu", new aa.gui.Menu(arguments[0]));
                }
                aa.prototypes.initGetters.call(this, ["theme", "appName", "items"]);
            };
            const ContextMenu   = function () {

                // Attributes:
                set(this, "menu");

                // Instanciate:
                construct.apply(this, arguments);
            };

            // Methods:
            ContextMenu.prototype.hide       = function () {
                aa.events.removeApp("aaContextMenu");
                let dom = document.getElementById("aaContextMenuBG");
                if (isDom(dom)) {
                    dom.parentNode.removeChild(dom);
                }
            };
            ContextMenu.prototype.show       = function () {
                const menu = get(this, "menu");
                const shortcut = shortcutMaker(get(this, "appName"));

                const dom = $$("div#aaContextMenuBG.aa.bg");
                const menuNode = $$("div#aaContextMenu", parse(menu.items, shortcut, this.hide));
                
                this.hide();
                dom.on("contextmenu", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!aa.isOver(e,"#aaContextMenu")) {
                        this.hide();
                    }
                    return false;
                });
                dom.on("click", (e) => {
                    if (!aa.isOver(e,"#aaContextMenu")) {
                        e.stopPropagation();
                        this.hide();
                    }
                });
                dom.style.zIndex = aa.getMaxZIndex();
                document.body.appendChild(dom);

                // Theme:
                const theme = get(this, 'theme');
                menuNode.classList.add(theme);
                aa.events.on('themechange', (theme, previous) => {
                    menuNode.classList.remove(previous);
                    menuNode.classList.add(theme);
                });

                menuNode.style.display = "block";
                menuNode.style.top = aa.mouse.y+"px";
                menuNode.style.left = (aa.mouse.x+4)+"px";
                dom.appendChild(menuNode);
                
                aa.events.app("aaContextMenu").listen({"<Esc>": new aa.Event(new aa.Action({on: {execute: (function (that) {return function () {that.hide();};})(this)}}), ["preventDefault"])});
                aa.events.app("aaContextMenu").suspend([
                    "<Down>",
                    "<Up>",
                    "<Home>",
                    "<End>",
                    "moletteBas",
                    "moletteHaut"
                ]);

                if (aa.mouse.y + menuNode.offsetHeight > aa.browser.height) {
                    if (menuNode.offsetHeight <= (aa.browser.height-2)) {
                        menuNode.style.top = (aa.browser.height - menuNode.offsetHeight-2)+"px";
                        // menuNode.style.top = "auto";
                        // menuNode.style.bottom = "2px";
                    } else {
                        menuNode.style.top = "2px";
                    }
                }
                if (aa.mouse.x + menuNode.offsetWidth > aa.browser.width) {
                    if (menuNode.offsetWidth <= (aa.browser.width-2)) {
                        menuNode.style.left = (aa.browser.width-menuNode.offsetWidth-2)+"px";
                        // menuNode.style.left = "auto";
                        // menuNode.style.right = "2px";
                    } else {
                        menuNode.style.left = "2px";
                    }
                }
            };
            return Object.freeze(ContextMenu);
        })();
        this.Dialog         = (function () {
            const db = new aa.Storage("aaDialog");
            let dialogCollection = {}; // liste des <aa.gui.Dialog> ouvertes

            const Dialog = function (type /* , spec */) {
                /**
                 * @param {String} type
                 * @param {Object} spec (optional)
                 *
                 * @return {aa.gui.Dialog}
                 */
                
                // Public attributes:
                this.id             = aa.uid();
                this.defaultValue   = null;
                this.details        = null;
                this.fullscreen     = false;
                this.height         = null;
                this.maxWidth       = null;
                this.maxHeight      = null;
                this.placeholder    = null;
                this.text           = null;
                this.theme          = null;
                this.title          = null;
                this.type           = null;
                this.width          = null;
                this.validation     = null;
                const publics = {
                };

                // Private attributes:
                const privates = {
                    buttons:    true,
                    lastFocus:  null,
                    noButton:   null,
                    node:       null,
                    reminder:   null,
                    yesButton:  null
                };
                privates.forEach((v, k) => {
                    set(this, k, v);
                });

                // Lists:
                set(this, "listeners", {
                    cancel: [],
                    hide:   [],
                    resize: [],
                    show:   [],
                    submit: []
                });
                this.suspendedModules   = [];
                this.toolbar            = [];

                // Construct:
                construct.apply(this, arguments);
            };
            aa.deploy(Dialog.prototype, {

                // Methods:
                checkValidation:  function () {
                    let form = undefined;
                    let isValid = true;
                    el("aaDialog-"+this.getID(), (node) => {
                        const forms = node.getElementsByTagName("form");
                        if (forms.length === 1) {
                            form = forms[0];
                            const validation = this.validation || (() => { return true; });
                            const checkElements = () => {
                                return form.elements.reduce((bool, elt) => {
                                    const validation = get(elt, "validation");
                                    if (isFunction(validation)) {
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
                                    .filter(elt => elt.nodeName && ["input", "textarea"].has(elt.nodeName.toLowerCase()))
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
                                    .filter(elt => elt.nodeName && ["input", "textarea"].has(elt.nodeName.toLowerCase()))
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
                    const btn = get(this, "yesButton");
                    if (btn) {
                        btn.disabled = !isValid;
                    }
                    // get(this, "yesButton").disabled = (!validation(getPOST.call(this)) || !checkPatterns() || !checkrequired());
                    return isValid;
                },
                hydrate:            aa.prototypes.hydrate,
                hide:               function () {
                    // warn("hide.id:", this.id);
                    el("aaDialogBG-"+this.id, (dom) => {
                        dom.classList.remove("fade");
                        dom.classList.add("fadeOut");
                    });
                    fire.call(this, "hide");
                    pop.call(this);
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
                    return (
                        this.text !== null
                        || this.type === "loading"
                        || this.type === "shortcut"
                    );
                },
                on:                 function (spec) {
                    const verify = aa.prototypes.verify({
                        spec: isObject,
                        listener: (name) => { return get(this, "listeners").keys().has(name); }
                    });
                    verify("spec", spec);

                    let ok = undefined;
                    // "on.ok" is deprecated. Use "submit" instead:
                    if (spec.hasOwnProperty("ok")) {
                        deprecated("aa.gui.Dialog::on.ok");
                        ok = spec.ok;
                        delete(spec.ok);
                    }
                    spec.forEach((callback, evtName) => {
                        verify("listener", evtName);
                        if (!isFunction(callback)) { throw new TypeError("Callback argument must be a Function."); }

                        if (get(this, "listeners").evtName === undefined) {
                            get(this, "listeners")[evtName] = [];
                        }
                        get(this, "listeners")[evtName].push(callback);
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
                                if (!isNode(elt)) { throw new TypeError("Invalid node."); }

                                const v = window.getComputedStyle(elt)[dimension];
                                if (isString(v)) {
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
                    // warn("show.id:", this.id);
                    if (this.isValid()) {
                        // Directly do stuff if no need to confirm:
                        if (doNotConfirm.call(this)) {
                            fire.call(this, "submit");
                            return;
                        }

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
                                            const reminder = get(this, "reminder");
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
                                    if (get(this, "buttons")) {
                                        View.addSubmitButtonTo.call(this, buttons);
                                        View.addCancelButtonTo.call(this, buttons);

                                        if (this.validation) {
                                            get(this, "btn-submit").disabled = true;
                                        } else {
                                            get(this, "btn-submit").focus();
                                        }
                                    } else {
                                        set(this, "btn-submit", null);
                                        set(this, "btn-cancel", null);
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
                    deprecated("aa.gui.Dialog::yes");

                    switch (this.type) {
                        case "information":
                        case "warning":
                        case "critical":

                        case "confirm":
                        case "prompt":
                        case "win":
                        case "shortcut":
                            // Action alias:
                            if (isString(p) && p.trim()) {
                                p = p.trim();
                                let a = aa.actionManager.get(p);
                                if (a instanceof aa.Action && a.isValid()) {
                                    get(this, "listeners").submit.push(p);
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
                                get(this, "listeners").submit.push(p);
                                return true;
                            }

                            // Function:
                            else if(isFunction(p)) {
                                get(this, "listeners").submit.push(p);
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
                    deprecated("aa.gui.Dialog::no");

                    switch (this.type) {
                        case "confirm":
                        case "prompt":
                        case "win":
                        case "shortcut":
                            // Action alias:
                            if (isString(p) && p.trim()) {
                                p = p.trim();
                                let a = aa.actionManager.get(p);
                                if (a instanceof aa.Action && a.isValid()) {
                                    get(this, "listeners").cancel.push(p);
                                    return true;
                                }
                            }
                            // Action:
                            else if(p instanceof aa.Action && p.isValid()) {
                                get(this, "listeners").cancel.push(p);
                                return true;
                            }
                            // Function:
                            else if(isFunction(p)) {
                                get(this, "listeners").cancel.push(p);
                                return true;
                            }
                            throw new TypeError("Action argument not valid.");
                            break;
                    }
                    return false;
                },
                setApp:             function (app) {
                    // deprecated("aa.gui.Dialog::app");
                    verify("appName", app);

                    set(this, "appName", app.trim());
                },
                setButtons:         function (b) {
                    if (!isBool(b)) { throw new TypeError("Argument must be a Boolean."); }
                    set(this, "buttons", b);
                },
                setCallback:        function (f) {

                    deprecated("aa.gui.Dialog::callback");
                },
                setDefaultValue:    function (s) {
                    if (!nonEmptyString(s)) {
                        throw new TypeError("Dialog text must be a non-empty String.");
                        return false;
                    }
                    this.defaultValue = s.trim();
                    return (!!this.defaultValue);
                },
                setDetails:         function (p) {
                    deprecated("gui.dialog.details");
                    if (isElement(p)) {
                        this.details = p;
                        return true;
                    } else if(!nonEmptyString(p)) {
                        throw new TypeError("Dialog details must be a non-empty String.");
                        return false;
                    }
                    this.details = p.trim();
                    return (!!this.details);
                },
                setFullscreen:      function (b) {

                    this.fullscreen = (b === true);
                },
                setId:              function (id) {
                    if (isString(id) && id.trim()) {
                        this.id = id;
                    }
                },
                setMaxWidth:        function (n) {
                    if (isInt(n) && n>0) {
                        n += '';
                    }
                    if (isString(n)) {
                        if (n.match(/^[0-9]+$/)) {
                            n += 'px';
                        }
                        if (n.match(/^[0-9]+(px|\%)$/)) {
                            this.maxWidth = n;
                        }
                    }
                },
                setMaxHeight:       function (n) {
                    if (isInt(n) && n>0) {
                        n += '';
                    }
                    if (isString(n)) {
                        if (n.match(/^[0-9]+$/)) {
                            n += 'px';
                        }
                        if (n.match(/^[0-9]+(px|\%)$/)) {
                            this.maxHeight = n;
                        }
                    }
                },
                setMessage:         function (s) {

                    return this.setText(s);
                },
                setNo:              function (p) {
                    if (isArray(p) && p.length) {
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
                    if (!nonEmptyString(s)) {
                        throw new TypeError("Dialog text must be a non-empty String.");
                        return false;
                    }
                    this.placeholder = s.trim();
                    return (!!this.placeholder);
                },
                setReminder:        function (reminder) {
                    if (nonEmptyString(reminder)) {
                        set(this, "reminder", reminder.trim());
                    }
                },
                setSuspend:         function (s) {
                    deprecated("aa.gui.Dialog::suspend");

                    if (!nonEmptyString(s)) { throw new TypeError("Argument must be a non-empty String."); }

                    // s = s.trim();
                    // if (this.suspendedModules.has(s)) {
                    //     return true;
                    // } else {
                    //     return this.suspendedModules.push(s);
                    // }
                },
                setText:            function (p) {
                    if (isElement(p)) {
                        this.text = p;
                    } else if(nonEmptyString(p)) {
                        this.text = p.trim();
                    } else if (isArray(p)) {
                        const isOk = p.reduce((bool, elt) => {
                            return (!nonEmptyString(elt) && !isElement(elt) ?
                                false
                                : bool
                            );
                        }, true);
                        if (isOk) {
                            this.text = p;
                        }
                    }
                    return (!!this.text);
                },
                setTheme:           function (s) {
                    if (!nonEmptyString(s)) {
                        throw new TypeError("Theme argument must be a non-empty String.");
                        return false;
                    }
                    s = s.trim();
                    if (ENV.THEMES.has(s)) {
                        this.theme = s;
                        return true;
                    }
                    return false;
                },
                setTitle:           function (s) {
                    if (!nonEmptyString(s)) { throw new TypeError("Dialog title must be a non-empty String."); }

                    this.title = s.trim();
                    return !!this.title;
                },
                setType:            function (type) {
                    verify("dialogType", type);

                    this.type = type.trim().toLowerCase();
                    return !!this.type;
                },
                setToolbar:         function (item) {
                    if (isArray(item)) {
                        item.forEach((a) => {
                            this.setToolbar(a);
                        });
                    } else {
                        if (isDom(item) || (item instanceof aa.Action && item.isValid()) || nonEmptyString(item)) {
                            this.toolbar.push(item);
                        }
                    }
                },
                setValidate:        function (callback) {
                    if (!isFunction(callback)) { throw new TypeError("Dialog validation must be a Function."); }

                    this.validation = callback;
                    return !!this.validation;
                },
                setWidth:           function (n) {
                    if (isInt(n) && n>0) {
                        n += '';
                    }
                    if (isString(n)) {
                        if (n.match(/^[0-9]+$/)) {
                            n += 'px';
                        }
                        if (n.match(/^[0-9]+(px|\%)$/)) {
                            this.width = n;
                        }
                    }
                },
                setYes:             function (p) {
                    if (isArray(p) && p.length) {
                        p.forEach(function (a) {
                            this.addYes(a);
                        },this);
                    } else {
                        this.addYes(p);
                    }
                },

                // Getters:
                getID:              function () {
                    if (!this.id) {
                        this.id = aa.newID();
                    }
                    return this.id;
                },
                getNode:            function (/* resolve, reject */) {
                    /**
                     * @param {function} resolve (optional)
                     * @param {function} reject (optional)
                     */
                    const resolve = (arguments && arguments.length > 0 && isFunction(arguments[0]) ? arguments[0] : undefined);
                    const reject = (arguments && arguments.length > 1 && isFunction(arguments[1]) ? arguments[1] : undefined);

                    const node = get(this, "node");
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
                    if (!this.id) {
                        this.id = aa.newID();
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
                    no: {string} ActionAlias | Array (String ActionAlias | Function callbacks) | Function callback, // (deprecated)
                    on: {object} of functions (submit, cancel),
                    placeholder: {string} placeholder, // for 'prompt' dialog
                    text: {string} message,
                    theme: {string} theme,
                    title: {string} title,
                    type: {string} type ("information", "warning", "critical", "confirm", "prompt", "win", "shortcut"),
                    validation: {function},
                    width: {number}, // values in pixels only
                    width: {string} width='100%',
                    yes: {string} ActionAlias | Array (String ActionAlias | Function callbacks) | Function callback, // (deprecated)
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
                const reminders = db.select("reminders");
                if (!reminders) {
                    db.insert("reminders", []);
                }
            };
            const doNotConfirm      = function () {
                const reminder = get(this, "reminder");

                if (this.type === "confirm") {
                    if (reminder) {
                        initRemindersDB.call(this);
                        const reminders = db.select("reminders");
                        return isArray(reminders) && reminders.has(reminder);
                    }
                } else {
                    set(this, "reminder", null);
                }
                return false;
            };
            const doNotRemind       = function (checked) {
                if (!isBool(checked)) { throw new TypeError("Argument must be a Boolean."); }

                const reminder = get(this, "reminder");
                if (this.type === "confirm" && reminder) {
                    initRemindersDB.call(this);
                    const reminders = db.select("reminders");
                    if (checked) {
                        if (!reminders.has(reminder)) {
                            reminders.push(reminder);
                        }
                    } else {
                        if (reminders.has(reminder)) {
                            reminders.splice(reminders.indexOf(reminder), 1);
                        }
                    }
                    db.insert("reminders", reminders);
                }
            };
            const fire              = function (str) {
                aa.prototypes.verify({str: (str) => { return get(this, "listeners").keys().has(str); }})("str", str);
                
                get(this, "listeners")[str].forEach((item) => {
                    const data = str === "submit" ?
                        getPOST.call(this)
                        : undefined
                    ;

                    // String:
                    if (isString(item)) {
                        aa.action(item, (action) => {
                            action.execute(data);
                        })
                    }

                    // Action:
                    else if (item instanceof aa.Action && item.isValid()) {
                        item.execute(data);
                    }

                    // Function:
                    else if (isFunction(item)) {
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
                    const delay = ((arguments && arguments.length>1 && isBool(arguments[1]) ? arguments[1] : false) ? 500 : 0);

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
                if (isDom(el("aaDialog-"+this.id))) {
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
                    switch (this.type) {
                        case "information":
                        case "warning":
                        case "critical":
                        case "confirm":
                        case "prompt":
                            const icon = (this.type === "prompt" ? "confirm" : this.type);
                            node.appendChild($$("div.fa-icon", $$("span.icon."+icon+".fa.fa-"+
                                ({
                                    information: "info-circle",
                                    warning: "warning",
                                    critical: "remove",
                                    confirm: "question-circle"
                                })[icon]
                            +".fa-3x")));
                            break;
                    }
                },
                addCancelButtonTo:  function (node) {
                    set(this, "btn-cancel", $$("input#aaDialog-"+this.getID()+"-cancelButton.reset", {
                        type: "reset",
                        on: {
                            click: () => {
                                fire.call(this, "cancel");
                                this.hide();
                            }
                        }
                    }));
                    get(this, "btn-cancel").value = aa.lang.get("action.no");
                    node.appendChild(get(this, "btn-cancel"));
                },
                addInputTo:         function (node) {
                    const input = $$("input#aaDialog-"+this.getID()+"DialogInput", {
                        type: "text"
                    });
                    if (this.defaultValue !== null) {
                        input.value = this.defaultValue;
                    }
                    if (this.placeholder !== null) {
                        input.placeholder = this.placeholder;
                    }
                    get(this, "listeners").forEach((list, evtName) => {
                        list.forEach((callback) => {
                            input.on(evtName, callback);
                        });
                    });
                    node.appendChild(input);
                },
                addReminderTo:       function (node) {
                    const reminder = get(this, "reminder");
                    if (reminder) {
                        node.appendChild($$("br"));
                        node.appendChild(aa.cook("checkbox", {
                            label: "Don't show this message again",
                            name: "doNotRemind",
                            value: true
                        }));
                    }
                },
                addSubmitButtonTo:  function (node) {
                    set(this, "btn-submit", $$("input#aaDialog-"+this.getID()+"-submitButton", {
                        type: "submit",
                        on: {click: (e) => {
                            fire.call(this, "submit");
                            this.hide();
                        }}
                    }));
                    get(this, "btn-submit").value = aa.lang.get("action.yes");
                    node.appendChild(get(this, "btn-submit"));
                    get(this, "btn-submit").focus();
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
                    if (isArray(this.text)) {
                        this.text.forEach((txt) => {
                            if (isString(txt)) {
                                node.appendChild($$("div", txt));
                            } else if (isElement(txt)) {
                                node.appendChild(txt);
                            }
                        });
                    } else if (isString(this.text)) {
                        node.appendChild($$("div", this.text));
                    } else if (isElement(this.text)) {
                        node.appendChild(this.text);
                    }
                },
                addTitleTo:         function (node) {
                    if (this.title) {
                        node.appendChild($$("h2.title", this.title));
                    }
                },
                addToolbarTo:       function (node) {
                    if (this.toolbar.length) {
                        this.toolbar.forEach((item) => {
                            let tool = null;
                            if (isDom(item)) {
                                tool = item;
                            } else if (isString(item)) {
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
                    walkChildrenElements(document.body, function (node) {
                        node.classList.add("aaBlur");
                    }, {except: ["script", "style"]});
                    return true;
                },
                freezeBody:         function () {

                    document.body.classList.add("aaFrameworkFreeze");
                },
                focus:              function () {
                    if (this.type.toLowerCase() === "prompt") {
                        el("aaDialog-"+this.id+"DialogInput", (input) => {
                            input.select();
                        });
                    } else {
                        const btn = get(this, "btn-submit");
                        if (btn) {
                            btn.focus();
                        }
                    }
                },
                followFocus:        function (form) {
                    form.elements.forEach((elt) => {
                        elt.on("focus", () => {
                            set(this, "lastFocus", elt);
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
                    set(this, "node", dom);
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
                    const form = $$("form", {
                        method: "POST",
                        action: "javascript:;",
                        on: {
                            submit: (e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const btn = get(this, "yesButton");
                                if (btn) {
                                    // btn.click();
                                }
                            }
                        }
                    });
                    // form.on("submit", (e) => {
                    //     e.stopPropagation();
                    //     e.preventDefault();
                    //     const btn = get(this, "yesButton");
                    //     if (btn) {
                    //         btn.click();
                    //     }
                    // });
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
                    aa.events.app("aaDialog-"+this.getID()).on("windowresize", (e) => {
                        this.resize();
                        get(this, "listeners").resize.forEach((callback) => { callback(e); });
                    }, ["preventDefault", "always"]);
                },
                setShortcuts:       function () {
                    ({
                        // "<Enter>": () => {
                        //     if (get(this, "btn-submit")) {
                        //         get(this, "btn-submit").click();
                        //     }
                        // },
                        "<Esc>": () => {
                            switch (this.type) {
                                case "information":
                                case "warning":
                                case "critical":
                                    if (get(this, "btn-submit")) {
                                        get(this, "btn-submit").click();
                                    }
                                    break;
                                case "confirm":
                                case "prompt":
                                case "win":
                                    if (get(this, "btn-cancel")) {
                                        get(this, "btn-cancel").click();
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
                            // "moletteBas",
                            // "moletteHaut",
                            // "<Down>",
                            // "<Up>",
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
                        walkChildrenElements(document.body,function (node) {
                            node.classList.remove("aaBlur");
                        },{except: ["script","style"]});
                    }
                    return true;
                },
                listenValidation:   function (form) {
                    const verify = () => {
                        this.checkValidation();
                    };
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
        this.Notification   = (function () {
            const Notification = function () {
                /*
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
                // Attributes:
                aa.defineAccessors.call(this, {
                    publics: {
                        id: null,
                        message: null,
                        title: null,
                        type: null,
                    }
                });
                // this.id         = null;
                // this.message    = null;
                // this.title      = null;
                // this.type       = null;

                // Lists:
                this.actions = [];

                let notifsLength = 0;
            
                // Closure private variables:
                const types = ["information", "warning", "critical", "confirm"];

                // Closure private methods:
                const construct = function () {
                    this.type = types[0];
                    if (arguments && arguments.length) {
                        this.setMessage(arguments[0]);
                        if (arguments.length > 1) {
                            this.hydrate(arguments[1]);
                        }
                    }
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
                };

                aa.deploy(aa.gui.Notification.prototype, {

                    // Methods:
                    hydrate:    aa.prototypes.hydrate,
                    isValid:    function () {

                        return (this.text !== null);
                    },
                    push:       function () {
                        let notifs = document.getElementById("aaNotifs");
                        if (notifs) {
                            notifs.style.zIndex = 1+aa.getMaxZIndex();
                            let dom = this.getHTML();
                            if (dom) {
                                if (notifs.firstChild) {
                                    notifs.insertBefore(dom, notifs.firstChild);
                                } else {
                                    notifs.appendChild(dom);
                                }
                                notifsLength++;
                            }
                        }
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
                    addAction:  function (o) {
                        if (!isObject(o)) {
                            throw new TypeError("Options argument must be an object.");
                            return false;
                        }
                        let action = new aa.Action(o);
                        if (action.isValid()) {
                            this.actions.push(action);
                            return true;
                        }
                        return false;
                    },
                    setId:      function (p) {
                        if (!nonEmptyString(p)) { throw new Error("Argument must be a non-empty String."); }
                        
                        set(this, 'id', p.trim());
                    },
                    setMessage: function (p) {
                        if (!nonEmptyString(p)) { throw new Error("Argument must be a non-empty String."); }

                        set(this, 'message', p.trim());
                    },
                    setTitle:   function (p) {
                        if (!nonEmptyString(p)) { throw new Error("Argument must be a non-empty String."); }

                        set(this, 'title', p.trim());
                    },
                    setType:    function (p) {
                        if (!nonEmptyString(p)) { throw new Error("Argument must be a non-empty String."); }

                        p = p.trim().toLowerCase();
                        if (types.has(p)) {
                            set(this, 'type', p);
                        }
                    },

                    // Getters:
                    getHTML:    function () {
                        const dom = aa.html("div.notif."+this.type+"#aaNotif_"+notifsLength);

                        if (this.type !== null) {
                            let icon = aa.html("div.icon");
                            dom.appendChild(icon);
                            // icon.classList.add(this.type);
                            switch (this.type) {
                                case "information":
                                    icon.classList.add("information");
                                    icon.appendChild(aa.html("span.fa.fa-2x.fa-info-circle"));
                                    break;
                                case "warning":
                                    icon.classList.add("warning");
                                    icon.appendChild(aa.html("span.fa.fa-2x.fa-warning"));
                                    break;
                                case "critical":
                                    icon.classList.add("critical");
                                    icon.appendChild(aa.html("span.fa.fa-2x.fa-remove"));
                                    break;
                                case "confirm":
                                    icon.classList.add("confirm");
                                    icon.appendChild(aa.html("span.fa.fa-2x.fa-question-circle"));
                                    break;
                                case "prompt":
                                    icon.classList.add("prompt");
                                    icon.appendChild(aa.html("span.fa.fa-2x.fa-question-circle"));
                                    break;
                                default:
                                    break;
                            }
                        }
                        let message = aa.html('div.message',this.message);
                        dom.appendChild(message);

                        if (this.actions.length > 0) {
                            let remove = (function (that,id) {
                                return function () {
                                    that.remove(id);
                                };
                            })(this, notifsLength);
                            let bs = document.createElement("div");
                            bs.classList.add("buttons");
                            
                            this.actions.forEach(function (action) {
                                let b = aa.html("input",{
                                    type: "button",
                                    value: action.text || "Ok"
                                });
                                if (action.callbacks.length > 0) {
                                    action.callbacks.forEach(function (callback) {
                                        deprecated("action.callback");
                                        return b.on("click",callback);
                                    });
                                }
                                b.on("click", () => { action.execute(); });
                                b.on("click", remove);
                                bs.appendChild(b);
                                switch (action.type) {
                                    case "reset":
                                        b.classList.add("reset");
                                        break;
                                    default:
                                        break;
                                }
                                return true;
                            });
                            message.appendChild(bs);
                        }
                        else {
                            dom.classList.add("waitAndFadeOut");
                            dom.on("animationend",(function (dom) {return function () {
                                dom.style.display = "none";
                                dom.removeNode();
                            };})(dom));
                        }
                        
                        return dom;
                    }
                }, {
                    force: true,
                    condition: aa.gui.Notification.prototype.hydrate === undefined
                });

                // Init:
                construct.apply(this, arguments);
            };

            return Object.freeze(Notification);
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
                        }
                    }
                });

                const construct = function () {
                    const id = get(this, 'id');
                    collection[id] = this;
                    this.hydrate.apply(this, arguments);
                };
                const view = {
                    percent: function (index, value) {
                        if (!nonEmptyString(index)) { throw new TypeError("Argument must be a non-empty String."); }

                        index = index.trim();
                        const nodes = get(this, 'nodes').collection;
                        if (nodes.hasOwnProperty(index)) {
                            nodes[index].percent.innerHTML = value*100;
                        }
                    }
                };
                const addNode   = function (index) {
                    if (!nonEmptyString(index)) { throw new TypeError("Argument must be a non-empty String."); }

                    index = index.trim();
                    const container = get(this, 'nodes').container;
                    if (container) {
                        const nodes = get(this, 'nodes').collection;
                        if (!nodes.hasOwnProperty(index)) {
                            nodes[index] = {
                                label: $$('div', index.getFilename()),
                                range: $$('range', {
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    disabled: true,
                                    value: get(this, 'indexes')[index]+''
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
                    if (!nonEmptyString(index)) { throw new TypeError("First argument must be a non-empty String."); }
                    if (!isNumber(value) || !value.between(0, 1)) { throw new TypeError("Second argument must be a Number between 0 and 1."); }

                    const nodes = get(this, 'nodes');
                    if (nodes.collection[index]) {
                        nodes.collection[index].range.value = value*100;
                        nodes.collection[index].percent.innerHTML = Math.floor(value*100);
                    }
                };

                aa.deploy(Progress.prototype, {
                    
                    // Methods:
                    hydrate: aa.prototypes.hydrate,
                    add:        function (index) {
                        if (!nonEmptyString(index)) { throw new TypeError("Argument must be a non-empty String."); }

                        index = index.trim();
                        set(this, 'tasks', 1+get(this, 'tasks'));
                        get(this, 'indexes')[index] = 0;
                        addNode.call(this, index);
                    },
                    complete:   function (index) {
                        if (!nonEmptyString(index)) { throw new TypeError("Argument must be a non-empty String."); }

                        index = index.trim();
                        const indexes = get(this, 'indexes');
                        const nodes = get(this, 'nodes').collection;
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
                        el('aaProgress-'+get(this, 'id'), (node) => {
                            node.removeNode();
                        });
                        delete collection[this.id];
                    },
                    show:       function () {
                        el('aaProgress', () => {}, () => {
                            const nodes = get(this, 'nodes');
                            nodes.container = $$('div.message');
                            if (this.title) {
                                nodes.container.appendChild($$('h2.title', this.title));
                            }
                            const dialog = $$('div.aaDialog.progress.'+aa.settings.theme,
                                nodes.container
                            );
                            const node = $$('div#aaProgress-'+get(this, 'id')+'.aa.bg.shade'+(this.visible ? '' : '.hidden'),
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

                            get(this, 'indexes').forEach((value, index) => {
                                addNode.call(this, index);
                            });
                        });
                    },

                    // Getters:
                    // Setters:
                    move:       function (index, value) {
                        if (!nonEmptyString(index)) { throw new TypeError("First argument must be a non-empty String."); }
                        if (!isNumber(value) || !value.between(0, 1)) { throw new TypeError("Second argument must be a Number between 0 and 1."); }

                        index = index.trim();
                        const indexes = get(this, 'indexes');
                        if (indexes.hasOwnProperty(index)) {
                            indexes[index] = value;
                        }
                        moveRange.call(this, index, value);
                    },
                    setTitle:   function (title) {
                        if (!nonEmptyString(title)) { throw new TypeError("First argument must be a non-empty String."); }

                        set(this, 'title', title.trim());
                    },
                    setVisible: function (visible) {
                        if (!isBool(visible)) { throw new TypeError("Argument must be a Boolean."); }

                        set(this, 'visible', visible);
                        el('aaProgress-'+get(this, 'id'), (node) => {
                            node.classList[visible ? 'remove' : 'add']('hidden');
                        })
                    }
                }, {
                    force: true,
                    condition: Progress.prototype.hydrate === undefined
                });

                construct.apply(this, arguments);
            };
            return Object.freeze(Progress);
        })();

        // Simplified aliases:
        this.contextmenu    = function (/* spec */) {
            const spec = arguments && arguments.length ? arguments[0] : undefined;
            let cm;
            if (spec) {
                cm = new aa.gui.ContextMenu(spec);
            } else {
                cm = new aa.gui.ContextMenu();
            }
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
            if (!isFunction(callback)) { throw new TypeError("First argument must be a Function."); }

            const resolve = arguments && arguments.length > 1 && isFunction(arguments[1]) ? arguments[1] : undefined;
            const reject = arguments && arguments.length > 2 && isFunction(arguments[2]) ? arguments[2] : undefined;
            const spec = arguments && arguments.length && isObject(arguments.last) ? arguments.last : {};

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
        this.notification   = function (message /*, spec */) {
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
                        // callback: function(){}, // deprecated
                        on: {
                            execute: () => {}
                        }
                    },
                    actions: [ // action builders...
                        {
                            text:   'Non',
                            name:   'action2_name',
                            type:   'reset', // optional
                            // callback: function(){}, // deprecated
                            on: {
                                execute: () => {}
                            }
                        },
                        {
                            text:   'Annuler',
                            name:   'action3_name',
                            type:   'reset', // optional
                            // callback: function(){}, // deprecated
                            on: {
                                execute: () => {}
                            }
                        }
                    ]
                });
                // ----------------------------
             */
             const spec = (arguments && arguments.length>1 ? arguments[1] : {});
            if (!isObject(spec)) {
                throw new Error("Options argument should be an Object.");
            }

            let notif = new aa.gui.Notification(message, spec);
            if (spec.action !== undefined) {
                notif.addAction(spec.action);
            }
            if (spec.actions !== undefined && isArray(spec.actions)) {
                spec.actions.forEach(function (action) {
                    notif.addAction(action);
                });
            }
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
            verify("message", message);
            const show = (arguments && arguments.length>1 && verify("boolean", arguments[1]) ? arguments[1] : false);

            if (!aa.settings.production) {
                const spec = { type: "warning" };
                if (show) {
                    spec.action = {name: aa.uid()};
                }
                this.notif("<h2 style=\"margin: 0;\">Todo:</h2>"+message, spec);
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
    aa.icon                     = Object.freeze(function (which, ...args) {
        /**
         * @param {string} which
         *
         * @return {DOMElement}
         */

        const FontAwesome4 = function () {
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
                if (!nonEmptyString(className)) { throw new TypeError("Argument must be a non-empty String."); }
                return 'fa-'+className.trim();
            },
            getNode:    function (id, classes, args) {
                /**
                 * @param {array} classes
                 *
                 * @return {array}
                 */
                if (!isArray(classes)) { throw new TypeError("Argument must be an Array."); }

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
                if (!nonEmptyString(className)) { throw new TypeError("Argument must be a non-empty String."); }
                className = className.trim();

                return this.data.has(className);
            },
            keys:       function () {

                return Object.freeze(this.data);
            }
        }, {
            condition: FontAwesome4.prototype.format === undefined,
            force: true
        });
        const GoogleIconfont = function () {
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
                if (!nonEmptyString(className)) { throw new TypeError("Argument must be a non-empty String."); }
                className = className.trim();
            },
            getNode:    function (id, classes, args) {
                /**
                 * @param {array} classes
                 *
                 * @return {array}
                 */
                if (!isArray(classes)) { throw new TypeError("Argument must be an Array."); }

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
                if (!nonEmptyString(className)) { throw new TypeError("Argument must be a non-empty String."); }
                className = className.trim();

                return this.data.hasOwnProperty(className);
            },
            keys:       function () {

                return Object.freeze(this.data.keys());
            }
        }, {
            condition: GoogleIconfont.prototype.format === undefined,
            force: true
        });
        const fonts = [FontAwesome4, GoogleIconfont /* */];

        // Display GUI:
        if (which === "gui" && !aa.settings.production) {
            let searchValue = '';
            let win;
            const spec = {
                onglets: []
            };
            aa.gui.loading(() => {
                fonts.forEach((font) => {
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
                    const search = $$("input", {
                        placeholder: "Search for a class name...",
                        on: {
                            input: aa.debounce(filter, 200),
                            click: filter
                        }
                    });
                    spec.onglets.push({
                        name: "aafw-fonts",
                        label: obj.constructor.name,
                        text: (() => {
                            obj.keys().forEach((key) => {
                                grid.appendChild($$("div.row", {dataset: {key: key}},
                                    $$("div.cell", {style: "min-width: fit-content;"},
                                        $$("icon.fa-fw."+key, {style: "margin: 2px;", title: key}),
                                    ),
                                    $$("div.cell",
                                        $$("span", key),
                                    ),
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
                    title: "Fonts",
                    text: $$("div", spec)
                });
            }, () => {
            });
            return;
        }
        const extracts = aa.extractClassNameAndID(which);
        const {id, tagName} = extracts;
        let {classes} = extracts;
        let node = undefined;
        fonts.forEach((font) => {
            const obj = new font();
            const result = obj.getNode(id, classes, args);
            if (result && !node) {
                node = result;
            }
        });
        return node;
    });
    /* aa.Selectable */ (() => {
        aa.Selectable               = function (/* dimensions */) {
            const dimensions = aa.arg.optional(arguments, 0, 1, isInt);
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
        const spec = arguments && arguments.length && isObject(arguments[0]) ? Object.assign(defaultSpec, arguments[0]) : defaultSpec;
        if (!isObject(spec)) { throw new TypeError("Argument must be an Object."); }

        spec.verify({
            getter: isFunction,
            setter: isFunction
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
                if (!nonEmptyString(id)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!nonEmptyString(className)) { throw new TypeError("Second argument must be a non-empty String."); }
                if (!isArray(args)) { throw new TypeError("Third argument must be an Array."); }

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
                if (!nonEmptyString(id)) { throw new TypeError("ID must be a non-empty String."); }

                const index = getter(this, 'index');
                index[id] = instance;
                setter(this, 'index', index);
            };

            // Public methods:
            aa.deploy(Instancer.prototype, {
                declare:    function (className, cls) {
                    if (!nonEmptyString(className)) { throw new TypeError("First argument must be a non-empty String."); }
                    if (!isFunction(cls)) { throw new TypeError("Second argument must be a Function or a Class."); }

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
                    if (!nonEmptyString(id)) { throw new TypeError("First argument must be a non-empty String."); }

                    id = id.trim();
                    return getter(this, 'index')[id];
                },
                remove:     function (id) {
                    if (!nonEmptyString(id)) { throw new TypeError("First argument must be a non-empty String."); }

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
            if (!nonEmptyString(p)) {
                throw new TypeError("Lang argument must be a non-empty String.");
                return false;
            }
        },
        get: function (p) {
            if (!nonEmptyString(p)) {
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
                    if (isString(lang)) {
                        return lang;
                    }
                }
            }
            return undefined;
        },
    };
    aa.mouse = {
        x: 0,
        y: 0,
        absoluteX: 0,
        absoluteY: 0,
        getX: function () {

            return aa.mouse.x;
        },
        getY: function () {

            return aa.mouse.y;
        },
        onMove: function (e) {

            if (arguments.length) {
                // let evt = arguments[0];
                
                let evt = window.event || arguments[0];
                
                if (!aa.browser.is('ie')) {
                    aa.mouse.x = evt.clientX;
                    aa.mouse.y = evt.clientY;
                    aa.mouse.absoluteX = evt.pageX;
                    aa.mouse.absoluteY = evt.pageY;
                } else {
                    aa.mouse.x = event.clientX;
                    aa.mouse.y = event.clientY;
                    aa.mouse.absoluteX = event.clientX + document.body.scrollLeft;
                    aa.mouse.absoluteY = event.clientY + document.body.scrollTop;
                }
                
                aa.events.execute("mousemove", e);
                
                return {
                    x: aa.mouse.x,
                    y: aa.mouse.y,
                    absoluteX: aa.mouse.absoluteX,
                    absoluteY: aa.mouse.absoluteY
                };
            }
        }
    };
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
            appName: nonEmptyString,
            callback: isFunction,
            defaultValue: (v) => { return (!v || nonEmptyString(v)); },
            evtName: nonEmptyString,
            shortcut: (str) => { return (nonEmptyString(str) && str.match(re)); }
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
                            node.appendChild(aa.html("tr#aaShortcuts-actionNotFound", aa.html("td.gris", "<i>No action matches the request.</i>")));
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
            show:       function (appName) {

                // Display window:
                dialog = aa.gui.window({
                    buttons: false,
                    width: 720,
                    title: "Edit shortcuts",
                    text: gui.getNode(appName),
                    on: {
                        resize: () => {
                        },
                        hide: () => {
                            gui.reset();
                            isGuiOpened = false;
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
                if (!isArray(arguments[1])) { throw new TypeError("Second argument must be an Array."); }
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
            // log({str: str, prefix: prefix, key: key});
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
        this.gui        = function (appName) {
            verify("appName", appName);

            if (!isGuiOpened) {
                isGuiOpened = true;

                aa.gui.loading(
                    
                    // loading:
                    () => {
                        gui.reset();
                        gui.reload(appName);
                    },
                    
                    // Resolved:
                    () => { gui.show(appName); },
                    
                    // Rejected:
                    () => { aa.gui.warn("An error occured."); }
                );
            }
        };
        this.isValid    = function (str) {

            return (nonEmptyString(str) ? !!this.cmdOrCtrl(str).match(re) : false);
        };
        this.rename     = function (str) {
            if (!nonEmptyString(str)) { throw new TypeError("Argument must be a non-empty String."); }

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
                        
                        if (inbetween(event.keyCode, 65, 90)) {
                            key = String.fromCharCode(event.keyCode).toUpperCase();
                        } else
                        if(inbetween(event.keyCode, 112, 123)) {
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
                } else if (event.constructor.name === "MouseEvent" || event.constructor.name === "Event") {
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
        if (!nonEmptyString(name)) { throw new TypeError("Argument must be a non-empty String."); }
        const resolve = arguments && arguments.length > 1 && isFunction(arguments[1]) ? arguments[1] : undefined;
        const reject = arguments && arguments.length > 2 && isFunction(arguments[2]) ? arguments[2] : undefined;

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
    aa.cook                     = Object.freeze(function (name /*, spec */) {
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
                id:         string,
                label:      string,
                mixable:    boolean,
                mixed:      boolean,
                name:       string,
                value:      string,
                on: {
                    mix:    function,
                    click: function
                }
            });
         */
        if (!nonEmptyString(name)) { throw new TypeError("First argument must be a non-empty String."); }
        const spec = (arguments && arguments.length > 1 ? arguments[1] : {});
        if (!isObject(spec)) { throw new TypeError("Second argument must be an Object."); }
        if (spec.mixed !== undefined && !isBool(spec.mixed)) { throw new TypeError("Spec 'mixed' must be a Boolean."); }
        if (spec.mixable !== undefined && !isBool(spec.mixable)) { throw new TypeError("Spec 'mixable' must be a Boolean."); }

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
            let mixed = undefined;
            let editStarted = false;
            let input = undefined;
            let node = undefined;
            
            const getInput = () => {
                if (!node) {
                    let span = null;
                    node = $$("label");
                    if (spec.label && isString(spec.label)) {
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
                                input[(tagName === "input" ? "select" : "focus")]();
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
                return getMixed();
            } else {
                return getInput();
            }
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
                        if (spec.label && isString(spec.label)) {
                            txt = $$("span", spec.label);
                        } else if (spec.value && isString(spec.value)) {
                            txt = $$("span", spec.value);
                        }
                        return txt;
                    };
                    const getInput = () => {
                        if (!node) {
                            node = node || $$("label.cooked"+(spec.disabled ? ".disabled" : ''));
                            const input = $$(tagName+(!!id ? '#'+id : '')+(classes.length ? '.'+classes.join('.') : ''),
                                spec.ignoreKeys("label", "mixable", "mixed")
                            );
                            input.on("input", (e) => {
                                if (spec.mixable && spec.mixable === true && input.checked === true) {
                                    if (events.onmix) {
                                        events.onmix.call();
                                    }
                                    spec.mixed = true;
                                    temp.appendChild(getTxt());
                                    getInput().insertAfter(getMixed());
                                    temp.appendChild(getInput());
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
                            node.appendChild($$("button.text",
                                $$("span.unchecked.fa.fa-fw.fa-"+(tagName.toLowerCase() === "checkbox" ? "square-o" : "circle-thin")),
                                $$("span.checked.fa.fa-fw.fa-"+(tagName.toLowerCase() === "checkbox" ? "check-square" : "circle")),
                                {
                                    disabled: !!spec.disabled,
                                    on: {click: (e) => {
                                        e.preventDefault();
                                        input.click();
                                    }}
                                }
                            ));
                            const txt = getTxt();
                            if (txt) {
                                node.appendChild(txt);
                            }
                        }
                        return node;
                    };
                    const getMixed = () => {
                        if (spec.hasOwnProperty("on") && spec.on.some((callback, evtName)=> !isFunction(callback))) { throw new TypeError("Spec 'on' must be an Array of Functions."); }

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
                                    style: "display: block; width: fit-content;",
                                    dataset: {value: spec.value},
                                    on: {click: () => {
                                        if (events.oncheck) {
                                            events.oncheck.call();
                                        }
                                        spec.checked = true;
                                        temp.appendChild(getTxt());
                                        getMixed().insertAfter(getInput());
                                        temp.appendChild(getMixed());
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
                        elt = getMixed();
                    } else {
                        elt = getInput();
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
    aa.extractClassNameAndID    = Object.freeze(function (str) {
        if (!nonEmptyString(str)) { throw new TypeError("Argument must be a non-empty String."); }

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
    aa.html                     = Object.freeze(function (nodeName) {
        /*
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
        let i,elt,res,rest,table,value,type,
            id = null,
            classes = [],
            htmlAttributes = [
                // Attributes to include as themselves:
                "action",
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
                "type",
                "value",
                "width",
                
                // Attributes to transform before including:
                // "css",
                "colspan",
                "checked",
                "class",
                "dataset",
                "default",
                "disabled",
                "draggable",
                "legend",
                "max",
                "min",
                "multiple",
                "on",
                "onglets",
                "options",
                "pattern",
                "prefix",
                "readonly",
                "required",
                "rowspan",
                "selected",
                "step",
                "suffix",
                "text",
                "validation"
            ];

        if (nonEmptyString(nodeName)) {
            const extracts = aa.extractClassNameAndID(nodeName);
            nodeName = extracts.tagName;

            switch (nodeName) {
                case "icon":
                    return aa.icon.apply(undefined, arguments);
                    break;
                case "text":
                    return (arguments && arguments.length > 1 && isString(arguments[1]) ?
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
                default:
                    break;
            }

            elt = document.createElement(nodeName);
            if (extracts.id) {
                elt.id = extracts.id;
            }
            if (type) {
                elt.type = type;
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
                arguments.forEach(function (param,i) {
                    let option,resID,resClass;

                    if (i > 0) {
                        if (isDom(param) || isNode(param)) {
                            elt.appendChild(param);
                        } else if(isString(param)) {
                            option = param.trim();

                            resID = option.match(/^\#(.*)$/);
                            resClass = option.match(/^\.(.*)$/);
                            
                            if (resID) {
                                option = resID[1].trim();
                                elt.id = option;
                                return true;
                            } else if(resClass) {
                                option = resClass[1].trim();
                                try{
                                    elt.classList.add(option);
                                    return true;
                                }
                                catch(e) {
                                    throw new Error("className doesn't allow space caracter.");
                                    return false;
                                }
                            } else {
                                switch (nodeName) {
                                    case "textarea":
                                        elt.innerText += option;
                                        break;
                                    default:
                                        elt.innerHTML += option;
                                        break;
                                }
                            }
                        } else if(isObject(param)) {
                            param.forEach(function (option, key) {
                                let classes;
                                if (isString(key)) {
                                    key = key.trim();
                                    if (htmlAttributes.has(key.toLowerCase())) {
                                        switch (key.toLowerCase()) {
                                            case "onglets":
                                                if (!isArray(option)) { throw new TypeError("'onglets' option must be an Array."); }
                                                const onglets = aa.html("legend.onglets");
                                                const container = aa.html("fieldset.onglets", onglets);
                                                let checkedRadio = null;
                                                elt.appendChild(container);

                                                option.forEach((spec, i) => {
                                                    if (!isObject(spec)) { throw new TypeError("'onglets' option must be an Array of spec Object."); }
                                                    if (!spec.verify({
                                                        checked:    p => isBool(p),
                                                        disabled:   p => isBool(p),
                                                        id:         p => nonEmptyString(p),
                                                        label:      p => nonEmptyString(p),
                                                        name:       p => nonEmptyString(p),
                                                        on:         p => isObject(p),
                                                        text:       p => (nonEmptyString(p) || isElement(p)),
                                                        title:      p => nonEmptyString(p),
                                                        value:      p => nonEmptyString(p)
                                                    })) { throw new TypeError("'onglets' spec not valid."); }
                                                    spec.checked = !!spec.checked;

                                                    // DOM:
                                                    option[i].id = spec.id ? spec.id.trim() : aa.uid();
                                                    const radio = aa.html("radio", {
                                                        dataset: {id: spec.id},
                                                        disabled: (spec.disabled !== undefined && spec.disabled)
                                                    });
                                                    const span = aa.html("span");
                                                    const label = aa.html("label.onglet",
                                                        radio,
                                                        span
                                                    );
                                                    onglets.appendChild(label);

                                                    if (spec.checked) {
                                                        checkedRadio = radio;
                                                    }
                                                    if (spec.label) {
                                                        spec.label = spec.label.trim();
                                                        span.innerHTML = spec.label;
                                                    }
                                                    if (spec.name) {
                                                        spec.name = spec.name.trim();
                                                        radio.name = spec.name;
                                                    }
                                                    if (spec.on) {
                                                        spec.on.forEach((callback, evtName) => {
                                                            if (!isFunction(callback)) { throw new TypeError("Onglets 'on' spec must be an Object of Functions."); }
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
                                                        spec.text = isString(spec.text) ? spec.label.trim() : spec.text;
                                                        const content = aa.html("div#"+spec.id+".aaDialogOngletContent", spec.text);
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
                                            
                                            case "legend":
                                                if (nodeName === "fieldset") {
                                                    if (nonEmptyString(option)) {
                                                        const legend = aa.html("legend", option.trim());
                                                        elt.insertAtFirst(legend);
                                                    }
                                                }
                                                break;
                                            
                                            case "dataset":
                                                if (isObject(option)) {
                                                    option.forEach((v, k) => {
                                                        if (nonEmptyString(v)) {
                                                            elt.dataset[k] = v;
                                                        } else {
                                                            warn("Dataset argument should be an Object of non-empty Strings only.");
                                                        }
                                                    });
                                                }
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
                                                elt.innerHTML = option;
                                                break;
                                            
                                            case "draggable":
                                                elt.draggable = (
                                                    isBool(option)
                                                    ? option
                                                    : false
                                                );
                                                break;
                                            
                                            case "checked":
                                                elt.defaultChecked = ((isString(option) && option.toLowerCase() === key.toLowerCase()) || option === true);
                                                elt[key] = elt.defaultChecked;
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
                                                elt[key] = ((isString(option) && option.toLowerCase() === key.toLowerCase()) || option === true);
                                                break;
                                            
                                            case "class":
                                                if (isString(option) && option.trim()) {
                                                    option = option.trim().replace(/\s+/,' ');
                                                    classes = option.split(' ');
                                                    classes.forEach(function (classe) {
                                                        return (elt.classList.add(classe));
                                                    });
                                                }
                                                break;
                                            
                                            case "on":
                                                // log(nodeName);
                                                if (isArray(option)) {
                                                    if (option.length > 1 && !isArray(option[0])) {
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
                                                            if (isArray(listener) && listener.length > 1) {
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
                                                } else if (isObject(option)) {
                                                    option.forEach(function (callback,evt) {
                                                        if (typeof callback === 'function') {
                                                            return elt.on(evt,callback);
                                                        } else if(isArray(callback)) {
                                                            callback.forEach(function (func) {
                                                                return elt.on(evt,func);
                                                            });
                                                        }
                                                    });
                                                }
                                                break;
                                            
                                            case "options":
                                                if (!isArray(option)) {
                                                    throw new Error("'Options' argument should be an Array.");
                                                }
                                                option.forEach(function (opt) {
                                                    if (!isDom(opt)) {
                                                        throw new Error("<option> should be a DOM Element.");
                                                    }
                                                    elt.appendChild(opt);
                                                });
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

                                            case "validation":
                                                switch (nodeName) {
                                                    case "input":
                                                    case "button":
                                                    case "textarea":
                                                    case "select":
                                                        if (!isFunction(option)) { throw new TypeError("Option must be a Function."); }
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
                                                if (isString(option)) {
                                                    return (elt.setAttribute(key,option.trim()));
                                                } else if(isNumber(option)) {
                                                    return (elt.setAttribute(key,option));
                                                }
                                                break;
                                        }
                                    } else {
                                        warn("Attribute '"+key+"' not implemented yet. (aa.aaFramework.create)");
                                    }
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
    aa.img                      = Object.freeze(new (function () {
        const o = {
            convertUriToJpg: (uri, resolve /*, reject */) => {
                if (!nonEmptyString(uri)) { throw new TypeError("First argument must be a non-empty String."); }
                if (!isFunction(resolve)) { throw new TypeError("Second argument must be a Function."); }
                const reject = (arguments && arguments.length > 2 ? arguments[2] : undefined);
                if (reject !== undefined && !isFunction(reject)) { throw new TypeError("Third argument must be a Function."); }

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

        return (isString(str) && ENV.THEMES.has(str));
    }
    aa.ClassFactory             = function () {
        aa.ClassFactory.group("Classify");
        if (this["__abstract"]) {
            aa.ClassFactory.continueIfEmpty(this["__abstract"]);
        }
        if (this.construct && isFunction(this.construct)) {
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
            if (list && isArray(list) && list.length) {
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
                if (isString(ns) && ns.trim()) {
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
                    } else if(isString(methodName) && methodName.trim()) {
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
                if (methodName && isString(methodName) && methodName.trim()) {
                    if (isArray(getNS(ns,methodName)) && isFunction(callback)) {
                        getNS(ns,methodName).push(callback);
                    } else if(isArray(getNS(ns))) {
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
                if (options.attributes && isObject(options.attributes)) {
                    if (options.attributes.self) {
                        if (isFunction(options.attributes.self)) {
                            // options.attributes.self.apply(this);
                            let Temp = function () {};
                            Temp.prototype.self = options.attributes.self;
                            let temp = new Temp();
                            temp.self();
                            aa.ClassFactory.log(temp);
                            temp.forEach(function (v,k) {
                                if (!isFunction(v)) {
                                    if (!this.hasOwnProperty(k)) {
                                        this[k] = v;
                                    }
                                }
                            },this);
                        } else if(isObject(options.attributes.self)) {
                            aa.ClassFactory.log("(object) self");
                            options.attributes.self.forEach(function (v,k) {
                                if (!isFunction(v)) {
                                    if (!this.hasOwnProperty(k)) {
                                        this[k] = v;
                                    }
                                }
                            },this);
                        }
                    }
                    if (options.attributes.get) {
                        if (!isObject(options.attributes.get)) {
                            throw new TypeError("GET argument should be an Object.");
                        }
                        options.attributes.get.forEach(function (f,k) {
                            if (!isFunction(f)) {
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

            if (options.attributes && isObject(options.attributes)
            && options.attributes.proto && isObject(options.attributes.proto)) {

                options.attributes.proto.forEach(function (value,key) {
                    aaClass.prototype[key] = value;
                });
            }

            // Methods:
            if (options.methods && isObject(options.methods)) {
                options.methods.forEach(function (value,key) {
                    switch (key) {
                        case '__abstract':
                            if (isArray(value)) {
                                value.forEach(function (methodName,i) {
                                    // aa.ClassFactory.log({abstract:methodName});
                                    addToNS('__abstract',methodName);
                                });
                            }
                            break;
                        case '__static':
                            if (isObject(value)) {
                                value.forEach(function (callback,methodName) {
                                    if (isFunction(callback)) {
                                        // aa.ClassFactory.log({static:methodName});
                                        addToNS('__static',methodName,callback);
                                    }
                                });
                            }
                            break;
                        default:
                            if (isFunction(value)) {
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
            if (typeof aaClass.prototype['__static'] !== 'undefined' && isObject(aaClass.prototype['__static'])) {
                aaClass.prototype['__static'].forEach(function (list,methodName) {
                    if (isArray(list) && list.length && isFunction(list.getLast())) {
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
    aa.manufacture              = function (Instancer, blueprint /*, accessors */) {
        aa.arg.test(blueprint, aa.verifyObject({
            accessors:          aa.verifyObject({
                publics:        aa.isObject,
                privates:       aa.isObject,
                read:           aa.isObject,
                execute:        aa.isObject
            }),
            construct:          aa.isFunction,
            startHydratingWith: aa.isArrayOf(key => blueprint.accessors && blueprint.accessors.publics.hasOwnProperty(key)),
            methods:            aa.verifyObject({
                publics:        aa.isObjectOfFunctions,
                setters:        aa.isObjectOfFunctions
            }),
            statics:            aa.isObject,
            verifiers:          aa.isObject,
        }), `'blueprint'`);
        blueprint.sprinkle({
            accessors: {
                publics: {
                },
                privates: {
                    listeners: {}
                },
                read: {},
                execute: {},
            },
            construct: function () {},
            startHydratingWith: [],
            methods: {
                publics: {},
                setters: {}
            },
            statics: {},
            verifiers: {}
        });
        const accessors = aa.arg.optional(arguments, 2, {}, aa.verifyObject({
            get: aa.isFunction,
            set: aa.isFunction,
        }));
        accessors.sprinkle({ get, set });

        const getter = accessors.get;
        const setter = accessors.set;

        const emit = aa.prototypes.events.getEmitter(getter, `listeners`);

        // Constructor:
        setter(Instancer, `construct`, function (/* spec */) {
            const spec = aa.arg.optional(arguments, 0, {});

            // Define setters:
            Object.keys(blueprint.accessors.publics)
            .forEach(key => {
                if (blueprint.accessors.publics.hasOwnProperty(key)) {
                    const method = `set${key.firstToUpper()}`;
                    Instancer.prototype[method] = function (value) {
                        aa.arg.test(
                            value,
                            value =>
                                blueprint.verifiers
                                && blueprint.verifiers.hasOwnProperty(key)
                                && blueprint.verifiers[key].call(this, value),
                            `'${key}' setter`
                        );
                        const isDifferent = (value !== getter(this, key));

                        if (isDifferent) { emit.call(this, `${key}change`, value); }
                        if (blueprint.methods.setters[key]) {
                            blueprint.methods.setters[key].call(this, value);
                        } else {
                            setter(this, key, value);
                        }
                        if (isDifferent) { emit.call(this, `${key}changed`, value); }
                    }
                }
            });
            
            aa.defineAccessors.call(this, blueprint.accessors, { getter, setter });

            blueprint.construct.apply(this, arguments);
            
            this.hydrate(spec, blueprint.startHydratingWith);
        });

        // Public:
        aa.deploy(Instancer.prototype, Object.assign({
            hydrate:    function (spec /*, order */) {
                aa.arg.test(spec, aa.verifyObject(blueprint.verifiers), `'spec'`);
                const order = aa.arg.optional(arguments, 1, [], list => isArray(list) && list.every(key => Object.keys(blueprint.verifiers).has(key)));


                // First assign with starting keys:
                order.forEach((key) => {
                    if (spec.hasOwnProperty(key)) {
                        const method = `set${key.firstToUpper()}`;
                        if (isFunction(this[method])) {
                            this[method](spec[key]);
                        }
                    }
                });

                // Then assign remaining keys:
                Object.keys(spec)
                .filter(key => !order.has(key))
                .forEach(key => {
                    const method = `set${key.firstToUpper()}`;
                    if (isFunction(this[method])) {
                        this[method](spec[key]);
                    }
                });
            },
            on:         aa.prototypes.events.getListener(getter, `listeners`),
        }, blueprint.methods.publics), {force: true});

        // Static:
        aa.deploy(Instancer, blueprint.statics, {force: true});

        return Instancer;
    };
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
    aa.settings                 = (function () {

        // Class:
        const Settings  = function () {

            aa.defineAccessors.call(this, {
                publics: {
                    production: ENV.PRODUCTION,
                    theme:      ENV.DEFAULT_THEME
                },
                write: {
                    script: null,
                    scripts: []
                },
                privates: {
                }
            });
        };

        // Public methods:
        aa.deploy(Settings.prototype, {
            setProduction:  function (isProd) {
                if (!isBool(isProd)) { throw new TypeError("Argument must be a Boolean."); }
                set(this, 'production', isProd);
            },
            setScript:      function (path) {
                if (!nonEmptyString(path)) { throw new TypeError("Argument must be a non-empty String."); }
                path = path.trim();
                if (!get(this, 'scripts').has(path)) {
                    get(this, 'scripts').push(path);
                    addScriptToDOM(path);
                }
            },
            setScripts:     function (scripts) {
                if (!isArray(scripts) || scripts.find(path => !nonEmptyString(path))) { throw new TypeError("Argument must be an Array of non-empty Strings."); }
                scripts.forEach((path) => {
                    this.setScript(path);
                });
            },
            setTheme:       function (theme) {
                if (theme !== undefined && !nonEmptyString(theme)) { throw new TypeError("'theme' spec must be a non-empty String."); }
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
        if (isObject(options)
        && isString(method) && method.trim()
        && isString(src) && src.trim()) {
            
            // Default options:
            if (typeof options.callback === 'undefined') {
                options.callback = function () {};
            }
            if (typeof options.default === 'undefined') {
                options.default = true;
            }
            
            // Test options:
            if (typeof options.callback !== 'function') { throw new Error("Invalid callback in 'aa.XHR'."); }
            if (typeof options.resolve !== 'function') { throw new Error("Invalid callback in 'aa.XHR'."); }
            if (!isBool(options.default)) { throw new Error("Invalid default in 'aa.XHR'."); }

            if (options.callback) {
                deprecated("options.callback");
                // console.warn("Deprecated")
                options.resolve = options.callback;
            }

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
                                                options.callback.call(null, undefined, json.dialog);
                                            }
                                            else if(json.dialog && json.dialog.warning && json.dialog.warning.length) {
                                                (new aa.gui.Dialog('warning',{
                                                    text: "- "+json.dialog.warning.join('<br>- ')
                                                })).show();
                                                options.callback.call(null, json.response, json.dialog);
                                            }
                                            else if(json.dialog && json.dialog.information && json.dialog.information.length) {
                                                (new aa.gui.Dialog('information',{
                                                    text: "- "+json.dialog.information.join('<br>- ')
                                                })).show();
                                                options.callback.call(null,json.response);
                                            } else if(typeof json.response !== 'undefined') {
                                                options.callback.call(null, json.response, json.dialog);
                                            }
                                        } else if(json.response && json.dialog) {
                                            options.callback.call(null, json.response, json.dialog);
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
                    && isDom(options.form) && options.form.tagName.toLowerCase() === 'form') {
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
                                                // console.log(json);
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
                case 'FILE':{
                    if (typeof options.form !== 'undefined'
                    && isDom(options.form) && options.form.tagName.toLowerCase() === 'form') {
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
                                                // console.log(json);
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
        } else {
            console.warn("Invalid 'aa.XHR' arguments.");
        }
    };

    // Getters:
    aa.getLang                  = function () {
        let html,lang;

        html = document.getElementsByTagName('html');

        if (html && html.length) {
            html = html[0];
            lang = html.getAttribute('lang') || html.getAttribute('xml:lang') || undefined;
            if (nonEmptyString(lang)) {
                return lang.trim().toLowerCase();
            }
        }
        return aa.defaultLang;
    };
    aa.getLorem                 = function () {
        let i,
            times = [],
            lorem = 'Lorem ipsum <b><i>dolor</i> sit</b> amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        if (arguments && arguments.length && isInt(arguments[0]) && arguments[0]>0) {
            for(i=0; i<arguments[0]; i++) {
                times.push(lorem);
            }
            return times.join('\n\n');
        } else {
            return lorem;
        }
    };
    aa.getMaxZIndex             = function () {
        let dom = document.body;
        let highest = 0;
        let i = 0;

        if (arguments && arguments.length) {
            if (isElement(arguments[0])) {
                dom = arguments[0];
            } else {
                throw new TypeError("First argument must be a DOM element.");
                return false;
            }
        }

        walkTheDOM(dom, function (node) {
            // log(i,node);
            // i++;
            switch (node.nodeName.toLowerCase()) {
                case 'script':
                case 'style':
                case 'iframe':
                    // log(node.nodeName);
                    break;
                default:
                    if (isElement(node)) {
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
    window.deprecated = function (txt) {
        txt = "Deprecated: '"+txt+"'. This feature is no longer recommended. Avoid using it, and update existing code if possible.";
        aa.gui.notif(txt, {type: "warning"});
        console.warn(txt);
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
