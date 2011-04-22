/*global runtime document odf window Ext*/
var odfcanvas;

function fixExtJSCSS() {
    // look through all stylesheets to change the selector
    // ".x-viewport, .x-viewport body"
    // to
    // ".x-viewport, .x-viewport > body"
    // The normal selector os not specific enough, office|body is also affected
    // by it. To avoid this, the selector is changed so that is only applies to
    // a director parent child relationship with '>'
    var i, cssRules, j, rule;
    for (i = 0; i < document.styleSheets.length; i += 1) {
        cssRules = document.styleSheets[i].cssRules;
        for (j = 0; j < cssRules.length; j += 1) {
            rule = cssRules[j];
            if (rule.selectorText === ".x-viewport, .x-viewport body") {
                rule = rule.cssText.replace(".x-viewport, .x-viewport body",
                        ".x-viewport, .x-viewport > body");
                document.styleSheets[i].deleteRule(j);
                document.styleSheets[i].insertRule(rule, j);
                return;
            }
        }
    }
}

function updateStyleComboBox() {
    var paragraphStylesBox = document.getElementById("paragraphStyleBox");
}

function initCanvas(odfelement) {
    runtime.loadClass("odf.OdfCanvas");
    // if the url has a fragment (#...), try to load the file it represents
    var location = String(document.location),
        pos = location.indexOf('#');
    odfelement.style.overflow = 'auto';
    odfcanvas = new odf.OdfCanvas(odfelement);
    if (pos === -1 || !window) {
        return;
    }
    location = location.substr(pos + 1);
    odfcanvas.onstatereadychange = function () {
//        odfelement.style.height = odfcanvas.getHeight();
        /*
        updateStyleComboBox();
        odfcanvas.save(function (err) {
            alert(err);
        });
        */
    };
    odfcanvas.load(location);
}
function save() {
    odfcanvas.odfContainer().save(function (err) {
        if (err) {
            alert(err);
        }
    });
}
function reload() {
    initCanvas();
}
Ext.onReady(function () {
    var toolbar, canvas, viewport;

    Ext.QuickTips.init();

    toolbar = new Ext.TabPanel({
        region: 'north'
    });

    canvas = new Ext.BoxComponent({
        closable: true,
        autoEl: {
            tag: 'div',
            name: 'canvas',
            frameBorder: 0,
            style: {
                border: '0 none'
            }
        },
        region: 'center',
        autoScroll: true,
        scroll: true
    });

    viewport = new Ext.Viewport({
        layout: 'border',
        items: [ toolbar, canvas ]
    });

    fixExtJSCSS();
    initCanvas(canvas.getEl().dom);
});
