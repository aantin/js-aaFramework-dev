"use strict"; // é

dev_test: {
    break dev_test;
    const grid = $$("div", {
        style: {
            "margin": "8em 16em 0 16em",
            "display": "grid",
            "grid-template-columns": "1fr 1fr 1fr",
        }
    });
    document.body.append(grid);
    [
        "top-left",
        "top",
        "top-right",
        "left-top",
        null,
        "right-top",
        "left",
        null,
        "right",
        "left-bottom",
        null,
        "right-bottom",
        "bottom-left",
        "bottom",
        "bottom-right",
    ].forEach(direction => {
        grid.append(!direction ? $$("div") : $$("div", $$("text", direction), $$("br"), $$("text", "..."), $$("aa-tooltip", {
            text: direction,
            direction: direction,
        }), {style: "margin: 1em; padding: 1em; background: var(--color-grey-lighter); text-align: center; border-radius: .4em;"}));
    });
}
// --------------------------------
// zz
