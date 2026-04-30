"use strict"; // é
const Tooltip = (() => {
    // --------------------------------
    // Aliases:
    const $$ = aa.html;
    // --------------------------------
    const sheet = new CSSStyleSheet();
    load_CSS: {
        const jsSrc = (
            Array.from(document.querySelectorAll("script"))
            .find(script => script.src.match(/\/tooltip\.component\.js$/) !== null)
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
    const {cut, get, set} = aa.mapFactory();
    function _ (that) { return aa.getAccessor.call(that, {cut, get, set}); }
    class Tooltip extends HTMLElement {
        constructor () {
            super();
            get(Tooltip, "construct").apply(this, arguments);
        }
    }
    const privates = {
        propTypes: {
            boolean: [
                "disabled",
            ],
            number: [
            ],
            object: [
            ],
            string: [
                "shortcut",
                "text",
                "direction",
            ],
        },
        getPropType: prop => Object.keys(privates.propTypes).find(key => privates.propTypes[key].includes(prop)),
        directions: [
            "bottom",
            "bottom-left",
            "bottom-right",
            "top",
            "top-left",
            "top-right",
            "left",
            "left-top",
            "left-bottom",
            "right",
            "right-top",
            "right-bottom",
        ],
    };
    const blueprint = {
        accessors: {
            publics: {
                direction:  privates.directions[0],
                disabled:   false,
                text:       null,
                shortcut:   null,
            },
            privates: {
                shadow:     null,
                nodes:      null,
            },
        },
        construct () {
            const that = _(this);
            that.shadow = this.attachShadow({mode: "closed"});
            that.shadow.adoptedStyleSheets = [sheet];
            that.initNodes?.(that);
        },
        methods: {
            privates: {
                // zz
                initNodes (that) {
                    that.initNodes = null;

                    const previous = {
                        type: that.type,
                        tooltip: that.tooltip,
                        direction: that.direction,
                    };

                    this.dataset ??= {
                        direction: that.direction,
                    };

                    that.nodes ??= {
                        arrow: $$("div.arrow"),
                        anchor: $$("div.anchor"),
                        tooltip: $$("div.tooltip"),
                        text: $$("div.text", {dataset: {}}),
                        wrapper: $$(`div.wrapper`),
                    };
                    const {nodes} = that;
                    const {
                        arrow,
                        anchor,
                        tooltip,
                        text,
                        wrapper,
                    } = nodes;
                    tooltip.append(
                        arrow,
                        text,
                    );
                    anchor.append(tooltip);
                    wrapper.append(anchor);
                    that.shadow.append(wrapper);

                    this.on({
                        "direction-changed": (e, direction) => {
                            this.dataset.direction = direction;
                            previous.direction = direction;
                        },
                        "disabled-changed": (e, disabled) => {
                            wrapper.classList.toggle("disabled", disabled);
                        },
                        "shortcut-changed": (e, shortcut) => {
                            nodes.text.classList.toggle("with-shortcut", !!shortcut);
                            if (!shortcut) return (delete nodes.text.dataset.shortcut);
                            
                            nodes.text.dataset.shortcut = shortcut;
                        },
                        "text-changed": (e, text) => {
                            nodes.text.innerHTML = text ?? '';
                        },
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
                    value = value === "null" ? null : value;
                    this[name] = value;
                },
                connectedCallback () {
                    const that = _(this);
                    that.emit("connected");
                },
                disconnectedCallback () {
                    const that = _(this);
                    that.emit("disconnected");
                },
            },
            setters: {
                // zz
            },
        },
        statics: {
            get observedAttributes () {
                return Object.keys(blueprint.accessors.publics);
            }
        },
        verifiers: {
            shortcut:   aa.isNullOrNonEmptyString,
            text:       aa.isNullOrNonEmptyString,
            direction:  aa.inArray(privates.directions),
            disabled:   aa.isBool,
        },
    };
    aa.manufacture(Tooltip, blueprint, {cut, get, set});
    return Tooltip;
})();
// --------------------------------
customElements.define("aa-tooltip", Tooltip);
// zz
