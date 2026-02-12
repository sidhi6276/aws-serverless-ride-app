/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};

(function esriMapScopeWrapper() {
    
    // ESRI Map Setup
    require([
        'esri/Map',
        'esri/views/MapView',
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/symbols/PictureMarkerSymbol'
    ], function(Map, MapView, Graphic, Point, SimpleMarkerSymbol, PictureMarkerSymbol) {

        // Create the map
        var map = new Map({
            basemap: 'streets-navigation-vector'
        });

        // Create the view - DELHI, INDIA
        var view = new MapView({
            container: 'map',
            map: map,
            center: [77.2090, 28.6139], // Delhi coordinates
            zoom: 11
        });

        var pinSymbol = new SimpleMarkerSymbol({
            color: [226, 119, 40],
            outline: {
                color: [255, 255, 255],
                width: 2
            }
        });

        var unicornSymbol = new PictureMarkerSymbol({
            url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCI+PHRleHQgeD0iMCIgeT0iNTAiIGZvbnQtc2l6ZT0iNTAiPvCfpow8L3RleHQ+PC9zdmc+',
            width: '48px',
            height: '48px'
        });

        WildRydes.map = {
            selectedPoint: null,
            center: {
                latitude: 28.6139,
                longitude: 77.2090
            },
            extent: {
                minLng: null,
                minLat: null,
                maxLng: null,
                maxLat: null
            },

            updateExtent: function updateExtent() {
                var extent = view.extent;
                WildRydes.map.extent.minLng = extent.xmin;
                WildRydes.map.extent.minLat = extent.ymin;
                WildRydes.map.extent.maxLng = extent.xmax;
                WildRydes.map.extent.maxLat = extent.ymax;
            },

            handleClick: function handleClick(event) {
                // Remove existing graphics
                view.graphics.removeAll();

                // Create a point at the clicked location
                var point = new Point({
                    longitude: event.mapPoint.longitude,
                    latitude: event.mapPoint.latitude
                });

                // Create graphic for the point
                var graphic = new Graphic({
                    geometry: point,
                    symbol: pinSymbol
                });

                // Add the graphic to the view
                view.graphics.add(graphic);

                // Store the selected point
                WildRydes.map.selectedPoint = {
                    latitude: event.mapPoint.latitude,
                    longitude: event.mapPoint.longitude
                };

                // Enable the request button
                document.getElementById('request').disabled = false;
                document.getElementById('request').textContent = 'Request Unicorn';
                
                console.log('📍 Location selected:', event.mapPoint.latitude, event.mapPoint.longitude);
            },

            animate: function animate(origin, dest, callback) {
                var originPoint = new Point({
                    longitude: origin.longitude,
                    latitude: origin.latitude
                });

                var unicornGraphic = new Graphic({
                    geometry: originPoint,
                    symbol: unicornSymbol
                });

                view.graphics.add(unicornGraphic);

                var step = 0;
                var steps = 50;
                var deltaLat = (dest.latitude - origin.latitude) / steps;
                var deltaLng = (dest.longitude - origin.longitude) / steps;

                function animateStep() {
                    if (step < steps) {
                        var newLat = origin.latitude + (deltaLat * step);
                        var newLng = origin.longitude + (deltaLng * step);
                        
                        unicornGraphic.geometry = new Point({
                            longitude: newLng,
                            latitude: newLat
                        });

                        step++;
                        setTimeout(animateStep, 25);
                    } else {
                        view.graphics.remove(unicornGraphic);
                        if (callback) {
                            callback();
                        }
                    }
                }

                animateStep();
            },

            unsetLocation: function unsetLocation() {
                view.graphics.removeAll();
                WildRydes.map.selectedPoint = null;
            }
        };

        // Update extent when view is ready
        view.when(function() {
            console.log('✅ Map view is ready - Delhi, India');
            WildRydes.map.updateExtent();
        });

        // Handle view extent changes
        view.watch('extent', function() {
            WildRydes.map.updateExtent();
        });

        // Handle map clicks
        view.on('click', WildRydes.map.handleClick);

        console.log('🗺️ ESRI Map initialized successfully - India');
    });

}());
