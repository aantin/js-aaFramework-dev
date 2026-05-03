"use strict"; // é

const Percent = (() => {
    // --------------------------------
    // Aliases:
    const $$ = aa.html;
    // --------------------------------
    const sheet = new CSSStyleSheet();
    load_CSS: {
        const jsSrc = (
            Array.from(document.querySelectorAll("script"))
            .find(script => script.src.match(/\/percent\.component\.js$/) !== null)
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
    // Functions:
    const percentTo100 = percent => `${Math.floor(100 * percent)}`;
    // --------------------------------
    const {cut, get, set} = aa.mapFactory();
    function _ (that) { return aa.getAccessor.call(that, {cut, get, set}); }
    class Percent extends HTMLElement {
        constructor () {
            super();
            get(Percent, "construct").apply(this, arguments);
        }
    }
    const privates = {
        propTypes: {
            boolean: [
                "disabled",
                "readonly",
                "withThumb",
            ],
            number: [
                "percent",
            ],
            object: [
            ],
            string: [
            ],
        },
        getPropType: prop => Object.keys(privates.propTypes).find(key => privates.propTypes[key].includes(prop)),
        types: ["information", "critical", "warning", "success"],
    };
    const blueprint = {
        accessors: {
            publics: {
                disabled:           false,
                percent:            0, // float; between 0 and 1
                readonly:           false,
                tooltip:            null,
                type:               privates.types[0],
                withThumb:          false,
            },
            privates: {
                shadow:             null,
                nodes:              null,
                tooltip:            null,
            },
        },
        construct () {
            const that = _(this);
            that.shadow = this.attachShadow({mode: "closed"});
            that.shadow.adoptedStyleSheets = [sheet];
            that.initNodes(that);
        },
        methods: {
            privates: {
                // zz
                initNodes (that) {
                    that.initNodes = null;

                    const previous = {
                        type: that.type,
                        tooltip: that.tooltip,
                    };

                    that.nodes ??= {
                        container: $$("span.container", {
                        }),
                        cursor: $$("span.cursor", {
                            style: `width: ${percentTo100(that.percent)}%;`
                        }),
                        range: $$("span.range"),
                        text: $$("span.text", `${percentTo100(that.percent)}%`, {
                            style: "padding-left: .4em;"
                        }),
                        thumb: $$(`span.thumb${that.withThumb ? '' : '.hidden'}`),
                    };
                    const {
                        cursor,
                        container,
                        range,
                        text,
                        thumb,
                    } = that.nodes;
                    range.append(
                        cursor,
                        thumb,
                    );
                    container.append(
                        range,
                        text, 
                    );
                    that.shadow.append(container);

                    range.on({
                        click: e => {
                            this.withThumb = !this.withThumb;
                        }
                    });
                    
                    this.on({
                        disabledchanged: (e, disabled) => {
                            container.classList.toggle("disabled", disabled);
                            range.classList.toggle("disabled", disabled);
                            const tooltip = range.querySelector("aa-tooltip");
                            if (tooltip) tooltip.disabled = disabled;
                        },
                        readonlychanged: (e, readonly) => {
                            container.classList.toggle("readonly", readonly);
                        },
                        percentchanged: (e, percent) => {
                            const str = `${percentTo100(percent)}%`;
                            cursor.style.width = str;
                            text.innerHTML = str;
                            thumb.style.left = str;
                            if (previous.tooltip) {
                                previous.tooltip.style.left = str;
                            }
                        },
                        "tooltip-changed": (e, elem) => {
                            if (previous.tooltip !== elem) previous.tooltip?.remove();
                            if (elem) {
                                const str = `${percentTo100(that.percent)}%`;
                                range.append(elem);
                                elem.style.left = str;
                                thumb.style.left = str;
                            }
                            previous.tooltip = elem;
                        },
                        typechanged: (e, type) => {
                            container.classList.remove(previous.type);
                            container.classList.add(type);
                            previous.type = type;
                        },
                        withthumbchanged: (e, withThumb) => {
                            thumb.classList.toggle("hidden", !withThumb);
                        }
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
            disabled:   aa.isBool,
            percent:    arg => aa.isNumber(arg) && arg.between(0, 1),
            readonly:   aa.isBool,
            tooltip:    aa.isNullOr(aa.isElement),
            type:       aa.inArray(privates.types),
            withThumb:  aa.isBool,
        },
    };
    aa.manufacture(Percent, blueprint, {cut, get, set});
    return Percent;
})();
// --------------------------------
customElements.define("aa-percent", Percent);
// zz
