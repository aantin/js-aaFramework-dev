"use strict"; // é

// --------------------------------
const Void = (() => {
    const {cut, get, set} = aa.mapFactory();
    function _ (that) { return aa.getAccessor.call(that, {cut, get, set}); }
    class Void extends HTMLElement {
        constructor () {
            super();
            get(Void, "construct").apply(this, arguments);
        }

    }
    // function Void () { get(Void, "construct").apply(this, arguments); }
    const blueprint = {
        accessors: {
            publics: {
            },
            privates: {
                shadow: null,
            },
        },
        construct () {
            const that = _(this);
            that.shadow = this.attachShadow({mode: "closed"});
        },
        methods: {
            privates: {
            },
            publics: {
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
            },
        },
        verifiers: {
        },
    };
    aa.manufacture(Void, blueprint, {cut, get, set});
    return Void;
})();
// --------------------------------
customElements.define("aa-void", Void);
