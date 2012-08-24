widgets.ZoomSlider = (function () {

    function makeWidget(documentObject, callback) {
        require(["dijit/form/HorizontalSlider", "dijit/form/NumberTextBox", "dojo"], function (HorizontalSlider, NumberTextBox, dojo) {
            var widget = {};

            widget = new HorizontalSlider({
                    name: 'zoomSlider',
                    value: 100,
                    minimum: 30,
                    maximum: 150,
                    discreteValues: 100,
                    intermediateChanges: true,
                    style: {
                        width: '150px',
                        height: '27px',
                        float: 'right'
                    }
                });

            var canvas = dojo.byId('canvas');
            widget.onChange = function (value) {
                var zoomlevel = value / 100.0;
                canvas.style.zoom = zoomlevel;
                canvas.style.MozTransform = 'scale(' + zoomlevel + ')';
                canvas.style.OTransform = 'scale(' + zoomlevel + ')'
            }

            return callback(widget);
        });
    }

    widgets.ZoomSlider = function ZoomSlider(documentObject, callback) {
        makeWidget(documentObject, function (widget) {
            return callback(widget);
        });
    };

    return widgets.ZoomSlider;
}());