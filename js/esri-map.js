/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function esriMapScopeWrapper($) {

    require([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/symbols/TextSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/geometry/support/webMercatorUtils',
        'dojo/domReady!'
    ], function (
        Map, MapView,
        Graphic, Point, TextSymbol,
        PictureMarkerSymbol, webMercatorUtils
    ) {

        var wrMap = WildRydes.map;

        // ✅ Base map
        var map = new Map({
            basemap: 'gray-vector'
        });

        // ✅ Map view
        var view = new MapView({
            container: 'map',
            map: map,
            center: [-122.31, 47.60],
            zoom: 12
        });

        // ✅ Pin symbol
        var pinSymbol = new TextSymbol({
            color: '#ff2b7a',
            text: '\ue61d',
            font: {
                size: 22,
                family: 'CalciteWebCoreIcons'
            }
        });

        // ✅ Unicorn icon (relative path safe for GitHub deploy)
        var unicornSymbol = new PictureMarkerSymbol({
            url: 'images/unicorn-icon.png',
            width: '28px',
            height: '28px'
        });

        var pinGraphic = null;
        var unicornGraphic = null;

        // ---------------------------
        // Map watchers
        // ---------------------------

        function updateCenter(center) {
            wrMap.center = {
                latitude: center.latitude,
                longitude: center.longitude
            };
        }

        function updateExtent(extent) {
            var min = webMercatorUtils.xyToLngLat(extent.xmin, extent.ymin);
            var max = webMercatorUtils.xyToLngLat(extent.xmax, extent.ymax);

            wrMap.extent = {
                minLng: min[0],
                minLat: min[1],
                maxLng: max[0],
                maxLat: max[1]
            };
        }

        view.watch('center', updateCenter);
        view.watch('extent', updateExtent);

        view.when(function () {
            updateCenter(view.center);
            updateExtent(view.extent);
        });

        // ---------------------------
        // Click handler
        // ---------------------------

        view.on('click', function (event) {
            wrMap.selectedPoint = event.mapPoint;

            if (pinGraphic) view.graphics.remove(pinGraphic);

            pinGraphic = new Graphic({
                geometry: wrMap.selectedPoint,
                symbol: pinSymbol
            });

            view.graphics.add(pinGraphic);

            $(wrMap).trigger('pickupChange');
        });

        // ---------------------------
        // Unicorn animation
        // ---------------------------

        wrMap.animate = function animate(origin, dest, callback) {

            var startTime;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;

                var progress = timestamp - startTime;
                var pct = Math.min(progress / 2000, 1);

                var lat = origin.latitude + (dest.latitude - origin.latitude) * pct;
                var lon = origin.longitude + (dest.longitude - origin.longitude) * pct;

                var point = new Point({
                    latitude: lat,
                    longitude: lon
                });

                if (unicornGraphic) view.graphics.remove(unicornGraphic);

                unicornGraphic = new Graphic({
                    geometry: point,
                    symbol: unicornSymbol
                });

                view.graphics.add(unicornGraphic);

                if (pct < 1) {
                    requestAnimationFrame(step);
                } else if (callback) {
                    callback();
                }
            }

            requestAnimationFrame(step);
        };

        // ---------------------------
        // Remove pin
        // ---------------------------

        wrMap.unsetLocation = function () {
            if (pinGraphic) view.graphics.remove(pinGraphic);
        };

    });

}(jQuery));
