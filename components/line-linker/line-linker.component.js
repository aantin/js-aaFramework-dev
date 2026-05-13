"use strict"; // é

const LineLinker = (() => {
    // --------------------------------
    // Aliases:
    const $$ = aa.html;
    // --------------------------------
    const sheet = new CSSStyleSheet();
    load_CSS: {
        const jsSrc = (
            Array.from(document.querySelectorAll("script"))
            .find(script => script.src.match(/\/line\-linker\.component\.js$/) !== null)
            ?.src
        );
        if (!jsSrc) break load_CSS;

        const cssSrc = jsSrc.replace(/\.js$/, '.css');
        fetch(cssSrc)
        .then(response => {
            if (!response.ok) throw new Error("Fetching failed");
            return response.text();
        })
        .then(text => {
            sheet.replace(text);
        })
        .catch(err => {});
    }
    // --------------------------------
    const LineLinkerTarget = (() => {
        class LineLinkerError extends Error {
            constructor (...args) {
                super(...args);
                Object.defineProperty(this, "name", {
                    get: () => "LineLinkerError"
                });
            }
        }
        class LineLinkerTypeError extends TypeError {
            constructor (...args) {
                super(...args);
                Object.defineProperty(this, "name", {
                    get: () => "LineLinkerTypeError"
                });
            }
        }
        const throwIfNot = aa.arg.testerBy(LineLinkerTypeError);
        const {cut, get, set} = aa.mapFactory();
        function _ (that) { return aa.getAccessor.call(that, {cut, get, set}); }
        function LineLinkerTarget () { get(LineLinkerTarget, "construct").apply(this, arguments); }
        const privates = {
            colors: [
                "blue",
                "gold",
                "grey",
                "magenta",
                "orange",
                "purple",
                "red",
            ],
            types: [
                "information",
                "critical",
                "warning",
                "success",
            ],
        };
        const blueprint = {
            accessors: {
                publics: {
                    icon:       null,
                    name:       null,
                    path:       null,
                    message:    null,
                    type:       null,
                    color:      null,
                },
            },
            construct (spec={}) {
                if (spec.hasOwnProperty("on")) {
                    this.on(spec.on);
                    delete spec.on;
                }
            },
            startHydratingWith: ["name"],
            methods: {
                privates: {
                    // zz
                },
                publics: {
                    // zz
                    notify (eventName, data) {
                        throwIfNot(eventName, aa.nonEmptyString, "'eventName'");
                        const that = _(this);

                        that.emit(eventName, data);
                    },
                },
                setters: {
                    // zz
                    message (message) {
                        const that = _(this);
                        that.message = message?.trim() ?? null;
                    },
                    name (name) {
                        const that = _(this);
                        switch (name) {
                            case "accept":
                                if (!that.icon) this.icon = null;
                                if (!that.type) this.type = "information";
                                break;
                            case "reject":
                                if (!that.icon) this.icon = "ban";
                                if (!that.type) this.type = null;
                                break;
                            default:
                                if (!that.icon) this.icon = null;
                                if (!that.type) this.type = null;
                                break;
                        }
                        that.name = name.trim();
                    },
                    path (callback) {
                        const that = _(this);
                        function path (path) {
                            const bool = callback(path);
                            if (typeof bool !== "boolean") throw new LineLinkerTypeError("The 'path' method must return a boolean.");
                            return bool;
                        }
                        that.path = path.bind(this);
                    },
                    type (type) {
                        const that = _(this);
                        that.type = type;
                        switch (type) {
                            case "warning":     this.color = "orange"; break;
                            case "information": this.color = "blue"; break;
                            case "critical":    this.color = "red"; break;
                            case "success":     this.color = "green"; break;
                        }
                    },
                },
            },
            statics: {
                // zz
                types: Object.freeze([...privates.types]),
                colors: Object.freeze([...privates.colors]),
            },
            verifiers: {
                color:      aa.isNullOr(aa.inArray(privates.colors)),
                icon:       aa.isNullOrNonEmptyString,
                name:       aa.nonEmptyString,
                path:       aa.isFunction,
                message:    aa.isNullOrNonEmptyString,
                type:       aa.isNullOr(aa.inArray(privates.types)),
            },
        };
        aa.manufacture(LineLinkerTarget, blueprint, {cut, get, set});
        return LineLinkerTarget;
    })();
    // --------------------------------
    class LineLinkerError extends Error {
        constructor (...args) {
            super(...args);
            Object.defineProperty(this, "name", {
                get: () => "LineLinkerError"
            });
        }
    }
    class LineLinkerTypeError extends TypeError {
        constructor (...args) {
            super(...args);
            Object.defineProperty(this, "name", {
                get: () => "LineLinkerTypeError"
            });
        }
    }
    const throwIfNot = aa.arg.testerBy(LineLinkerTypeError);
    // --------------------------------
    const {cut, get, set} = aa.mapFactory();
    function _ (that) { return aa.getAccessor.call(that, {cut, get, set}); }
    class LineLinker extends HTMLElement {
        constructor () {
            super();
            get(LineLinker, "construct").apply(this, arguments);
        }
    }
    const privates = {
        propTypes: {
            boolean: [
                "disabled",
            ],
            number: [
                "height",
                "width",
            ],
            object: [
            ],
            string: [
            ],
        },
        getPropType: prop => Object.keys(privates.propTypes).find(key => privates.propTypes[key].includes(prop)),
    };
    const blueprint = {
        accessors: {
            publics: {
                disabled:       false,
                height:         0,
                scrollables:    null,
                source:         null,
                targets:        null,
                width:          0,
            },
            privates: {
                nodes:      null,
                shadow:     null,
                stroke:     null,
            },
        },
        construct (spec={}) {
            const that = _(this);
            that.initShadow(that);
            that.initNodes(that);
            that.initTargets(that);

            that.scrollables = [];

            if (spec.hasOwnProperty("on")) {
                this.on(spec.on);
                delete spec.on;
            }
        },
        startHydratingWith: ["source"],
        methods: {
            privates: {
                // zz
                initNodes (that) {
                    that.initNodes = null;

                    const ns = "http://www.w3.org/2000/svg";

                    that.stroke ??= {
                        color: "rgba(0,0,0,.2)",
                        linecap: "round",
                        width: 3,
                    };
                    that.nodes ??= {
                        icon:           $$("span.icon.reject"),
                        line:           document.createElementNS(ns, "line"),
                        textContainer:  $$("aside.message.hidden"),
                        svg:            document.createElementNS(ns, "svg"),
                    };
                    const {
                        icon,
                        line,
                        textContainer,
                        svg,
                    } = that.nodes;
                    svg.append(line);
                    that.shadow.append(
                        svg,
                        textContainer,
                    );
                },
                initShadow (that) {
                    that.initShadow = null;

                    that.shadow = this.attachShadow({mode: "closed"});
                    that.shadow.adoptedStyleSheets = [sheet];
                },
                initTargets (that) {
                    that.initTargets = null;

                    that.targets = new aa.Dictionary({authenticate: {
                        values: item => item instanceof LineLinkerTarget
                    }});

                    that.targets.add("reject", new LineLinkerTarget({
                        name: "reject",
                    }))
                },
                start (that) {
                    const {nodes, source, stroke, targets} = that;
                    const {icon, line, textContainer, svg} = nodes;
                    
                    let currentColor, currentType, posX=0, posY=0;
                    let {top, left} = Object.getFixedPositionOf(source);
                    const style = window.getComputedStyle(source);
                    let {width, height, zIndex} = style;
                    zIndex = {
                        max: aa.getMaxZIndex(),
                        original: zIndex,
                    };
                    height = height.match(/^[0-9].*px$/) !== null ? parseInt(height.replace(/px$/, '')) : that.height;
                    width = width.match(/^[0-9].*px$/) !== null ? parseInt(width.replace(/px$/, '')) : that.width;
                    left = left + (width / 2);
                    top = top + (height / 2) + 8;

                    svg: {
                        svg.setAttribute("width", `0`);
                        svg.setAttribute("height", `0`);
                        svg.setAttribute("viewBox", `0 0 0 0`);
                        svg.setAttribute("style", `z-index: ${zIndex.max + 1}; position: fixed; top: ${top}px; left: ${left}px;`);
                    }
                    line: {
                        line.setAttribute("x1", `${stroke.width}`);
                        line.setAttribute("y1", `${stroke.width}`);
                        line.setAttribute("x2", "100%");
                        line.setAttribute("y2", "100%");
                        // line.setAttribute("stroke", stroke.color);
                        line.setAttribute("stroke-width", `${stroke.width}`);
                        line.setAttribute("stroke-linecap", `${stroke.linecap}`);
                    }

                    const vec = {
                        width: x => `${Math.floor(Math.max(2 * stroke.width, (x < left - stroke.width ? left - x : x - (left)) + stroke.width)) - 1}px`,
                        height: y => `${Math.floor(Math.max(2 * stroke.width, (y < top - stroke.width ? top - y : y - (top)) + stroke.width)) - 1}px`,
                        
                        top: y => `${Math.floor((y < top - stroke.width ? y + 1 : top - stroke.width - 1))}px`,
                        left: x => `${Math.floor((x < left - stroke.width ? x + 1 : left - stroke.width - 1))}px`,
                    };
                    
                    const findTarget = path => {
                        let found = null;
                        if_not_reject: {
                            found = (targets
                                .filter(target => target.name !== "reject")
                                .find(target => target.path?.(path) ?? false)
                            );
                        }
                        else_reject: {
                            if (!found) {
                                const target = targets.get("reject");
                                if (target.path?.(path) ?? true) {
                                    found = target;
                                }
                            }
                        }
                        return found;
                    };
                    const updateIcon = target => {
                        icon.classList.toggle("hidden", !target?.icon);
                        icon.dataset.icon = aa.icon("get", target?.icon ?? '') ?? '';
                    };
                    const updateIconPosition = e => {
                        textContainer.style.zIndex = `${zIndex.max + 2}`;
                        textContainer.style.top = `${e.clientY + 4}px`;
                        textContainer.style.left = `${e.clientX + 0}px`;
                    };
                    const updateMessage = (target) => {
                        const nodes = [];
                        if (target.icon)      nodes.push(icon);
                        if (target.message) nodes.push($$("span", target.message));

                        textContainer.replaceChildren(...nodes);

                        textContainer.classList.toggle("hidden", nodes.length < 1);
                    }
                    const updateNodePosition = () => {
                        const style = window.getComputedStyle(source);
                        width = style.width;
                        height = style.height;
                        height = height.match(/^[0-9].*px$/) !== null ? parseInt(height.replace(/px$/, '')) : that.height;
                        width = width.match(/^[0-9].*px$/) !== null ? parseInt(width.replace(/px$/, '')) : that.width;

                        const pos = Object.getFixedPositionOf(source);
                        top = pos.top;
                        left = pos.left;
                        left = left + (width / 2);
                        top = top + (height / 2) + 8;
                    };
                    const updateSVG = () => {
                        svg: {
                            svg.style.height = vec.height(posY);
                            svg.style.left = vec.left(posX);
                            svg.style.top = vec.top(posY);
                            svg.style.width = vec.width(posX);
                            svg.setAttribute("viewBox", `0 0 ${vec.width(posX).replace(/px$/, '')} ${vec.height(posY).replace(/px$/, '')}`);
                        }
                        line: {
                            if (
                                (
                                    posX < left
                                    && posY < top
                                )
                                || (
                                    posX > left
                                    && posY > top
                                )
                            ) {
                                line.setAttribute("x1", `${stroke.width}`);
                                line.setAttribute("y1", `${stroke.width}`);
                                line.setAttribute("x2", `${parseInt(vec.width(posX).replace(/px$/, '')) - stroke.width}`);
                                line.setAttribute("y2", `${parseInt(vec.height(posY).replace(/px$/, '')) - stroke.width}`);
                            } else {
                                line.setAttribute("x1", `${parseInt(vec.width(posX).replace(/px$/, '')) - stroke.width}`);
                                line.setAttribute("y1", `${stroke.width}`);
                                line.setAttribute("x2", `${stroke.width}`);
                                line.setAttribute("y2", `${parseInt(vec.height(posY).replace(/px$/, '')) - stroke.width}`);
                            }
                        }
                    };
                    const updateType = type => {
                        if (currentType) {
                            svg.classList.remove(currentType);
                            textContainer.classList.remove(currentType);
                        }
                        if (!LineLinkerTarget.types.includes(type)) {
                            return (currentType = null);
                        }

                        if (type) {
                            svg.classList.add(type);
                            textContainer.classList.add(type);
                        }
                        currentType = type;
                    };
                    const updateColor = color => {
                        if (currentColor) {
                            svg.classList.remove(`color-${currentColor}`);
                            textContainer.classList.remove(`color-${currentColor}`);
                        }
                        if (!LineLinkerTarget.colors.includes(color)) {
                            return (currentColor = null);
                        }

                        if (color) {
                            svg.classList.add(`color-${color}`);
                            textContainer.classList.add(`color-${color}`);
                        }
                        currentColor = color;
                    };
                    const hide = () => {
                        aa.events.removeApp("linking");
                        document.body.cancel(listeners.body);
                        that.scrollables.forEach(scrollable => {
                            scrollable.cancel(listeners.scrollable);
                        });
                        this.remove();
                        document.body.classList.remove("line-linking");
                        that.emit("hide");
                    };
                    const listeners = {
                        app: {
                            "<Esc>": e => {
                                that.emit("cancel");
                                hide();
                            },
                        },
                        body: {
                            pointerdown: e => {
                                e.preventDefault();
                                e.stopPropagation();

                                that.emit("start", e.composedPath());
                            },
                            pointermove: e => {
                                posX = e.clientX;
                                posY = e.clientY;
                                updateNodePosition();
                                updateIconPosition(e);

                                const path = e.composedPath();
                                const target = findTarget(path);

                                update: {
                                    updateSVG();
                                    updateMessage(target);
                                    updateIcon(target);
                                    updateType(target?.type ?? null);
                                    updateColor(target?.color ?? null);
                                    target?.notify("move", path);
                                }

                                that.emit("move", path);
                            },
                            pointerup: e => {
                                e.preventDefault();
                                e.stopPropagation();

                                const path = e.composedPath();
                                
                                const target = findTarget(path);
                                target?.notify("resolve", path);
                                
                                reject_every_other_targets: {
                                    targets
                                    .filter(other => other !== target)
                                    .forEach(other => {
                                        other?.notify("reject", path);
                                    });
                                }
                                if (target?.name === "reject") {
                                    that.emit("reject", path);
                                }
                                that.emit("finish", path);
                                hide();
                            }
                        },
                        scrollable: {
                            scroll: e => {
                                updateNodePosition();
                                updateSVG();
                            },
                        }
                    };
                    aa.events.app("linking").on(listeners.app);
                    document.body.on(listeners.body);
                    that.scrollables.forEach(scrollable => {
                        scrollable.on(listeners.scrollable);
                    });
                },
            },
            publics: {
                // zz
                attributeChangedCallback (name, oldValue, value) {
                    const that = _(this);
                    switch (privates.getPropType(name)) {
                        case "boolean": {
                            value = value === null || value !== "false";
                        } break;
                        case "number": {
                            value = parseFloat(value);
                        } break;
                        case "object": {
                            value = JSON.parse(value);
                        } break;
                    }
                    this[name] = value;
                },
                connectedCallback () {
                    const that = _(this);
                    that.start(that);
                    that.emit("connected");
                },
                disconnectedCallback () {
                    const that = _(this);
                    that.emit("disconnected");
                },
            },
            setters: {
                // zz
                targets (specs) {
                    const that = _(this);
                    const {targets} = that;
                    specs.forEach(spec => {
                        const {name} = spec;
                        delete spec.name;
                        throwIfNot(name, aa.nonEmptyString, "'name'");

                        const target = targets.get(name) ?? new LineLinkerTarget({name});
                        if (spec.hasOwnProperty("on")) {
                            target.on(spec.on);
                            delete spec.on;
                        }
                        target.hydrate(spec);
                        targets.add(name, target);
                    });
                },
            },
        },
        statics: {
            // zz
            run (spec={}) {
                /**
                 * Cycle of events:
                 * - linker: 'start'                // emitted at pointerdown
                 * - targets.each: 'move'           // emitted at each pointermove tick
                 * - linker: 'move'                 // emitted at each pointermove tick
                 * - linker: 'cancel'               // emitted at <Esc> keyboard shortcut
                 * - targets.matching: 'resolve'    // emitted only if a target.path returns true
                 * - targets.every_other: 'reject'  
                 * - linker: 'reject'               // emitted if the 'reject' named target has been resolved
                 * - linker: 'finish'               // emmitted at resolved or rejected target(s), only when pointer is up
                 * - linker: 'hide'                 // emitted at pointerup or <Esc> keyboard shortcut

                 * Usage:
                    LineLinker.run({
                        height:         number,
                        scrollables:    [element],
                        source:         element,
                        width:          number,
                        
                        targets: [
                            {
                                name:       string, // mandatory
                                icon:       string,
                                type:       enum:types,
                                color:      enum:colors,
                                message:    string,
                                path:       path => boolean,
                                on: {
                                    move: (e, path) => {},
                                    reject: (e, path) => {},
                                    resolve: (e, path) => {},
                                }
                            },
                        ],
                        on: {
                            cancel: e => {},
                            finish: (e, path) => {},
                            hide: e => {},
                            move: (e, path) => {},      
                            reject: (e, path) => {},
                            start: (e, path) => {},
                        }
                    });
                 */
                const linker = new LineLinker(spec);
                const that = _(linker);
                document.body.append(linker);
                document.body.classList.add("line-linking");
                return linker;
            },
            get observedAttributes () {
                return Object.keys(blueprint.accessors.publics);
            }
        },
        verifiers: {
            disabled:       aa.isBool,
            height:         aa.isNumber,
            scrollables:    aa.isArrayOf(arg => arg === window || aa.isElement(arg)),
            source:         aa.isElement,
            targets:        aa.isArrayOfObjects,
            width:          aa.isNumber,
        },
    };
    aa.manufacture(LineLinker, blueprint, {cut, get, set}, {TypeError: LineLinkerTypeError});
    return LineLinker;
})();
// --------------------------------
customElements.define("aa-line-linker", LineLinker);
// zz
