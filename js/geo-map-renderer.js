(function (window, $, _) {
    'use strict';

    var ICON_URL = "http://maps.google.com/mapfiles/kml/paddle/blu-blank.png",
        ICON_URL_PINK = "http://maps.google.com/mapfiles/kml/paddle/pink-blank.png",
        ICON_LABELS = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        ICON_ARROW = "http://www.google.com/mapfiles/arrow.png",
        ICON_ARROW_SHADOW = "http://www.google.com/mapfiles/arrowshadow.png",
        ROUTE_COLORS = ['#C53929', '#0B8043', '#3367D6'],
        infoWindow = null,
        placesServices = null,
        geocoder = null,
        ICON_SIZE_32 = null,
        ICON_SIZE_16 = null,
        ICON_PLACE = "https://maps.gstatic.com/mapfiles/place_api/icons/geocode-71.png";

    window.com = window.com || {};
    window.com.xomena = window.com.xomena || {};

    window.com.xomena.mapRenderer = {
        /*
         * A map of models to render
         */
        instances: {},

        /**
         * Add webservice instance
         * @param {com.xomena.geo.Models.Instance} model Web Service instance model
         * @param {Object} data  Web Service response data (JSON or XML)
         */
        addInstance: function (model, data) {
            var self = this;
            this.instances[model.get("id")] = {
                model: model,
                data: data,
                map: document.querySelector('#t-' + model.get("id")).map
            };
            if (!infoWindow) {
                infoWindow = new google.maps.InfoWindow({
                    pixelOffset: new google.maps.Size(0, -35),
                    disableAutoPan: false
                });
            }
            if (!placesServices) {
                placesServices = new google.maps.places.PlacesService($("<div>").get(0));
            }
            if (!geocoder) {
                geocoder = new google.maps.Geocoder();
            }
            if (!ICON_SIZE_16) {
                ICON_SIZE_16 = new google.maps.Size(16, 16);
            }
            if (!ICON_SIZE_32) {
                ICON_SIZE_32 = new google.maps.Size(32, 32);
            }
            if (this.instances[model.get("id")].map) {
                //Define styles for data layer features
                this.instances[model.get("id")].map.data.setStyle(function (feature) {
                    var style = {};
                    switch (feature.getGeometry().getType()) {
                        case "Point":
                            var m_icon = feature.getProperty("icon"),
                                m_size = feature.getProperty("iconSize"),
                                m_address = feature.getProperty("address"),
                                m_zindex = feature.getProperty("zIndex"),
                                m_name = feature.getProperty("name");
                            
                            var m_iconDef = {
                                url: m_icon ? m_icon : ICON_URL,
                                scaledSize: m_size ? m_size : ICON_SIZE_32
                            };  
                            if (m_icon === ICON_ARROW) {
                                m_iconDef.anchor = new google.maps.Point(12, 34);
                            }

                            style = {
                                icon: m_iconDef,
                                title: m_name? m_name : (m_address ? m_address : ""),
                                visible: true,
                                zIndex: m_zindex ? m_zindex : 0
                            };
                            break;
                        case "LineString":
                            var m_color = feature.getProperty("color"),
                                m_zindex = feature.getProperty("zIndex");

                            style = {
                                strokeColor: m_color ? m_color : "#0000FF",
                                strokeOpacity: 1.0,
                                strokeWeight: 4,
                                zIndex: m_zindex ? m_zindex : 0
                            };
                            break;
                    }

                    return style;
                });
                //Define events handlers for data layer features
                this.instances[model.get("id")].map.data.addListener('click', function (event) {
                    if (event.feature) {
                        switch (event.feature.getGeometry().getType()){
                        case "Point":
                            var m_content = event.feature.getProperty("content");
                            if (m_content) {
                                infoWindow.setPosition(event.feature.getGeometry().get());
                                infoWindow.setContent(m_content);
                                infoWindow.open(self.instances[model.get("id")].map);
                            }
                            break;
                        }
                    }
                });
                //Define a circle to use with places results
                this.instances[model.get("id")].circle = new google.maps.Circle({
                    center: this.instances[model.get("id")].map.getCenter(),
                    map: this.instances[model.get("id")].map,
                    radius: 1000,
                    strokeColor: ROUTE_COLORS[0],
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillOpacity: 0.2,
                    visible: false
                });
            }
        },

        /**
         * Update webservice instance
         * @param {com.xomena.geo.Models.Instance} model Web Service instance model
         * @param {Object} data  Web Service response data (JSON or XML)
         */
        updateInstance: function (model, data) {
            if (!this.instances[model.get("id")]) {
                this.addInstance(model, data);
            } else {
                this.instances[model.get("id")].model = model;
                this.instances[model.get("id")].data = data;
            }
        },

        /**
         * Remove webservice instance
         * @param {String} id The ID of Web Service instance
         */
        removeInstance: function (id) {
            if (this.instances[id]) {
                delete this.instances[id];
            }
        },

        /**
         * Render a map for Web Service instance
         * @param {String} id The ID of Web Service instance
         */
        renderMap: function (id) {
            if (!this.instances[id]) { return; }
            if (!this.instances[id].map) { return; }
            var m_strategy = this.getStrategy(id),
                m_map = this.getMap(id),
                m_data = this.getData(id),
                m_format = this.getFormat(id),
                m_geoJSON = null;
            if (!m_strategy || !m_strategy.isAsync()) {
                this.clearMap(id);
            }
            if (m_strategy && m_map && m_data && m_format) {
                m_geoJSON = m_strategy.getGeoJSON(m_data, m_format, m_map, id);
                if (m_geoJSON) {
                    //Lets add additional features
                    this.addAdditionalFeatures(id, m_geoJSON);
                    m_map.data.addGeoJson(m_geoJSON);
                    if(m_geoJSON.bounds && m_geoJSON.bounds instanceof google.maps.LatLngBounds){
                        m_map.fitBounds(m_geoJSON.bounds);
                    } else {
                        m_adjust_bounds(m_map);
                    }
                }
                var m_div = m_map.getDiv();
                if (!$(m_div).is(":visible")) {
                  this.instances[id].pendingFitBounds = true;
                }
            }
        },

        /**
         * Clear a map for Web Service Instance
         * @param {String} id The ID of Web Service instance
         */
        clearMap: function (id) {
            if (!this.instances[id]) { return; }
            if (!this.instances[id].map) { return; }
            var self = this;
            this.instances[id].map.data.forEach(function (feature) {
                self.instances[id].map.data.remove(feature);
            });
            if(infoWindow) {
                infoWindow.close();
            }
            this.instances[id].circle.setVisible(false);
        },
        
        /**
         * Fit bound of the map related to this web service instance 
         * @param {String} id The ID of Web Service instance
         */
        adjustBounds: function (id) {
            var m_map = this.getMap(id);
            if (m_map) {
              m_adjust_bounds(m_map); 
            }
        },

        /**
         * Returns render strategy for Web Service
         * @param   {String} id The ID of Web Service instance
         * @returns {com.xomena.mapRenderer.Strategy} Implementation of Strategy interface for rendering map
         */
        getStrategy: function (id) {
            var m_strategy = null, m_service, m_services, service, m_strategy_key;
            if (this.instances[id] && this.instances[id].model) {
                m_service = this.instances[id].model.get("webservice");
                if (m_service) {
                    m_services = this.instances[id].model.get("services");
                    service = m_services.filterById(parseInt(m_service, 10));
                    if ($.isArray(service) && service.length) {
                        m_strategy_key = service[0].get("render");
                        if (window.com.xomena.strategies[m_strategy_key]) {
                            m_strategy = window.com.xomena.strategies[m_strategy_key];
                        }
                    }
                }
            }
            return m_strategy;
        },

        /**
         * Returns format for instance data (JSON or XML?)
         * @param   {String} id The ID of Web Service instance
         * @returns {String} Format ("json", "xml")
         */
        getFormat: function (id) {
            var m_format = null;
            if (this.instances[id] && this.instances[id].model) {
                m_format = this.instances[id].model.get("output");
                if (!m_format && this.instances[id].model.isImageryInstance()) {
                    m_format = "image";
                }
            }
            return m_format;
        },

        /**
         * Returns data associated with given object
         * @param   {String} id The ID of Web Service instance
         * @returns {Object} Data from the web service (JSON object or XML string)
         */
        getData: function (id) {
            var m_data = null;
            if (this.instances[id] && this.instances[id].data) {
                m_data = this.instances[id].data;
            }
            return m_data;
        },

        /**
         * Returns corresponding map instance
         * @param   {String} id The ID of Web Service instance
         * @returns {google.maps.Map} Map instance
         */
        getMap: function (id) {
            var m_map = null;
            if (this.instances[id] && this.instances[id].map) {
                m_map = this.instances[id].map;
            }
            return m_map;
        },

        /**
         * Strategy class
         * @param {String} type Type of the strategy
         */
        Strategy: function (type) {
            this.type = type;
        },

        /**
         * Allows to add additional features like location for reverse geocoding or places searches
         * @param {String} id The ID of Web Service instance
         * @param {Object} geoJSON GeoJSON object obtained from response
         */
        addAdditionalFeatures: function (id, geoJSON) {
            if (this.instances[id] && this.instances[id].model) {
                var m_service = this.instances[id].model.get("webservice");
                if(m_service){
                    var m_services = this.instances[id].model.get("services");
                    var service = m_services.filterById(parseInt(m_service));
                    if($.isArray(service) && service.length){
                        switch(service[0].get("name")){
                            case "Reverse geocoding":
                                var m_latlng = this.instances[id].model.getParameterValue("latlng");
                                if($.isArray(m_latlng) && m_latlng.length) {
                                    var m_arr = m_latlng[0].split(",");
                                    m_add_arrow_point("arrow-"+id, parseFloat(m_arr[0]), parseFloat(m_arr[1]), geoJSON);
                                }
                                break;
                            case "Places Nearby Search":
                            case "Places Text Search":
                                var m_latlng = this.instances[id].model.getParameterValue("location");
                                if($.isArray(m_latlng) && m_latlng.length) {
                                    var m_arr = m_latlng[0].split(",");
                                    m_add_arrow_point("arrow-"+id, parseFloat(m_arr[0]), parseFloat(m_arr[1]), geoJSON);
                                    var m_radius = this.instances[id].model.getParameterValue("radius");
                                    if($.isArray(m_radius) && m_radius.length && m_radius[0]) {
                                        this.instances[id].circle.setCenter(new google.maps.LatLng(parseFloat(m_arr[0]), parseFloat(m_arr[1])));
                                        this.instances[id].circle.setRadius(parseInt(m_radius[0]));
                                        this.instances[id].circle.setVisible(true);
                                    }
                                }
                                break;
                        }
                    }
                }
            }
        },
        
        showAdditionalInfo: function (placeId) {
          if (placesServices) {
            placesServices.getDetails({
              placeId: placeId
            }, function(place_res, status){
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    var m_res = ["<ul>"];
                    m_res.push('<li><b>Address:</b> ' + place_res.formatted_address + '</li>');
                    m_res.push('<li><b>Types:</b> ' + place_res.types.join(", ") + '</li>');
                    if (place_res.vicinity) {
                        m_res.push('<li><b>Vicinity:</b> ' + place_res.vicinity + '</li>');
                    }
                    m_res.push("</ul>");
                    $("#infowindow-moreinfo").html(m_res.join(""));
                }
            });
          }      
        }
    };

    /**
     * Prototype function of the Strategy to get GeoJSON
     * @param   {Object} data  Data from the web service (JSON object or XML string)
     * @param   {String} format Format ("json", "xml")
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    window.com.xomena.mapRenderer.Strategy.prototype.getGeoJSON = function (data, format, map, id) {
        switch (format) {
            case "json":
                return this.m_getGeoJSON_JSON(data, map, id);
            case "xml":
                return this.m_getGeoJSON_XML(data, map, id);
            case "image":
        }       return this.m_getGeoJSON_Image(data, map, id);
    };

    /**
     * Prototype function of the Strategy to get GeoJSON from JSON data
     * @param   {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    window.com.xomena.mapRenderer.Strategy.prototype.m_getGeoJSON_JSON = function (data, map, id) {
        switch (this.type) {
        case "geocode":
            return m_parseGeocodeJSON(data, map, id);
        case "directions":
            return m_parseDirectionsJSON(data, map, id);
        case "distancematrix":
            return m_parseDistanceMatrixJSON(data, map, id);
        case "elevation":
            return m_parseElevationJSON(data, map, id);
        case "timezone":
            return m_parseTimezoneJSON(data, map, id);
        case "places_search":
            return m_parsePlacesSearchJSON(data, map, id);
        case "places_radar":
            return m_parsePlacesRadarJSON(data, map, id);
        case "places_detail":
            return m_parsePlacesDetailJSON(data, map, id);
        case "places_autocomplete":
            return m_parsePlacesAutocompleteJSON(data, map, id);
        case "roads":
            return m_parseSnapToRoadsJSON(data, map, id);
        case "speed":
            return m_parseSpeedLimitsJSON(data, map, id);
        }
        return null;
    };

    /**
     * Prototype function of the Strategy to get GeoJSON from XML string
     * @param   {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    window.com.xomena.mapRenderer.Strategy.prototype.m_getGeoJSON_XML = function (data, map, id) {
        switch (this.type) {
        case "geocode":
            return m_parseGeocodeXML(data, map, id);
        case "directions":
            return m_parseDirectionsXML(data, map, id);
        case "distancematrix":
            return m_parseDistanceMatrixXML(data, map, id);
        case "elevation":
            return m_parseElevationXML(data, map, id);
        case "timezone":
            return m_parseTimezoneXML(data, map, id);
        case "places_search":
            return m_parsePlacesSearchXML(data, map, id);
        case "places_radar":
            return m_parsePlacesRadarXML(data, map, id);
        case "places_detail":
            return m_parsePlacesDetailXML(data, map, id);
        case "places_autocomplete":
            return m_parsePlacesAutocompleteXML(data, map, id);
        case "roads":
            break;
        case "speed":
            break;
        }
        return null;
    };

    /**
     * Prototype function of the Strategy to get GeoJSON for Imagery API
     * @param   {Object} data Data from render map call of the instance view
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    window.com.xomena.mapRenderer.Strategy.prototype.m_getGeoJSON_Image = function (data, map, id) {
        switch (this.type) {
        case "staticmap":
            return m_parseStaticMap(data, map, id);
        }
        return null;
    };

    /**
     * Defines if the strategy has asynchronous nature
     * @returns {Boolean} True if nature is acync, false otherwise
     */
    window.com.xomena.mapRenderer.Strategy.prototype.isAsync = function () {
        switch (this.type) {
            case "places_radar":
            case "places_autocomplete":
            case "roads":
            case "speed":
            case "distancematrix":  
                return true;
            default:
                return false;
        }
    }

    window.com.xomena.strategies = {
        GeocodeRender:  new window.com.xomena.mapRenderer.Strategy("geocode"),
        DirectionsRender: new window.com.xomena.mapRenderer.Strategy("directions"),
        DistanceMatrixRender: new window.com.xomena.mapRenderer.Strategy("distancematrix"),
        ElevationRender: new window.com.xomena.mapRenderer.Strategy("elevation"),
        TimezoneRender: new window.com.xomena.mapRenderer.Strategy("timezone"),
        PlacesSearchRender: new window.com.xomena.mapRenderer.Strategy("places_search"),
        PlacesRadarRender: new window.com.xomena.mapRenderer.Strategy("places_radar"),
        PlacesDetailRender: new window.com.xomena.mapRenderer.Strategy("places_detail"),
        PlacesAutocompleteRender: new window.com.xomena.mapRenderer.Strategy("places_autocomplete"),
        RoadsRender: new window.com.xomena.mapRenderer.Strategy("roads"),
        SpeedRender: new window.com.xomena.mapRenderer.Strategy("speed"),
        StaticMapsRender: new window.com.xomena.mapRenderer.Strategy("staticmap")
    };

    /**
     * Parse JSON data from Geocoding API
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseGeocodeJSON (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        }, bounds = new google.maps.LatLngBounds();
        if (_.isObject(data) && data.status && data.status === "OK") {
            if (data.results && _.isArray(data.results)) {
                _.each(data.results, function (elem, index) {
                    res.features.push({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [elem.geometry.location.lng, elem.geometry.location.lat]
                        },
                        "properties": {
                            "address": elem.formatted_address,
                            "types": elem.types.join(","),
                            "location_type": elem.geometry.location_type,
                            "place_id": elem.place_id,
                            "partial_match": elem.partial_match ? elem.partial_match : false, 
                            "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                            "content": m_info_window_content_address(elem),
                            "zIndex": 2
                        },
                        "id": elem.place_id
                    });
                    if (index < 3) {
                        bounds.extend(new google.maps.LatLng(elem.geometry.location.lat, elem.geometry.location.lng));
                        if (elem.geometry.viewport) {
                            bounds.extend(new google.maps.LatLng(elem.geometry.viewport.northeast.lat, elem.geometry.viewport.northeast.lng));
                            bounds.extend(new google.maps.LatLng(elem.geometry.viewport.southwest.lat, elem.geometry.viewport.southwest.lng));
                        }
                    }
                });
                res.bounds = bounds;
            }
        }
        return res;
    }

    /**
     * Parse JSON data from Directions API
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseDirectionsJSON (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        },
        bounds = new google.maps.LatLngBounds();
        if (_.isObject(data) && data.status && data.status === "OK") {
            if (data.routes && _.isArray(data.routes) && data.routes.length) {
                _.each(data.routes, function (route, index) {
                    var arr1 = google.maps.geometry.encoding.decodePath(route.overview_polyline.points),
                        m_coord = [];
                    _.each(arr1, function (p, ind1) {
                        m_coord.push([p.lng(), p.lat()]);
                    });
                    res.features.push({
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": m_coord
                        },
                        "properties": {
                            "color": ROUTE_COLORS[index],
                            "summary": route.summary,
                            "warnings": route.warnings,
                            "waypoint_order": route.waypoint_order,
                            "zIndex": data.routes.length - index
                        },
                        "id": data.geocoded_waypoints[0].place_id + "-" + index
                    });
                    if (route.bounds) {
                        bounds.extend(new google.maps.LatLng(route.bounds.northeast.lat, route.bounds.northeast.lng));
                        bounds.extend(new google.maps.LatLng(route.bounds.southwest.lat, route.bounds.southwest.lng));
                    }
                });
                res.bounds = bounds;
            }
        }
        if (data.geocoded_waypoints && _.isArray(data.geocoded_waypoints) && data.geocoded_waypoints.length) {
            var count = 0;
            _.each(data.geocoded_waypoints, function (wp, index) {
                placesServices.getDetails({
                    placeId: wp.place_id
                }, function(place_res, status){
                    count++;
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                       m_add_place_to_map (place_res, map, true);
                    }
                    if (count === data.geocoded_waypoints.length && data.status !== "OK") {
                        m_adjust_bounds(map);
                    }
                });
            });
        }
        return res;
    }
    
    /**
     * Parse JSON data from Distance Matrix API
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} null (features will be added asyncronously on map)
     */
    function m_parseDistanceMatrixJSON (data, map, id) {
        var total = 0;
        var respCount = 0;
      
        function m_callback_o (results, status) {
          respCount++;
          if (status === google.maps.GeocoderStatus.OK) {
            m_add_address_to_map(results[0], map, ICON_URL);
          }
          if (respCount === total) {
            m_adjust_bounds(map);            
          }
        }
        
        function m_callback_d (results, status) {
          respCount++;
          if (status === google.maps.GeocoderStatus.OK) {
            m_add_address_to_map(results[0], map, ICON_URL_PINK);
          }
          if (respCount === total) {
            m_adjust_bounds(map);            
          }
        }
      
        window.com.xomena.mapRenderer.clearMap(id);  
        if (_.isObject(data) && data.status && data.status === "OK") {
            var counter = 0;
            if (data.origin_addresses && _.isArray(data.origin_addresses) && data.origin_addresses.length) {
                total += data.origin_addresses.length;
                _.each(data.origin_addresses, function (addr, index) {
                    var m_req = {
                      address: addr
                    };
                    if (counter < 10) {
                      geocoder.geocode(m_req, m_callback_o);
                    } else {
                      window.setTimeout(function () {
                        geocoder.geocode(m_req, m_callback_o);
                      }, (counter-9)*1000);
                    }
                    counter++;
                });
            }
            if (data.destination_addresses && _.isArray(data.destination_addresses) && data.destination_addresses.length) {
                total += data.destination_addresses.length;
                _.each(data.destination_addresses, function (addr, index) {
                    var m_req = {
                      address: addr
                    };
                    if (counter < 10) {
                      geocoder.geocode(m_req, m_callback_d);
                    } else {
                      window.setTimeout(function () {
                        geocoder.geocode(m_req, m_callback_d);
                      }, (counter-9)*1000);
                    }
                    counter++;
                });
            }
        }
        return null;
    }
    
    /**
     * Parse JSON data from Elevation API
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseElevationJSON (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        };
        if (_.isObject(data) && data.status && data.status === "OK") {
            if (data.results && _.isArray(data.results) && data.results.length) {
                _.each(data.results, function (elem, index) {
                    res.features.push({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [elem.location.lng, elem.location.lat]
                        },
                        "properties": {
                            "elevation": elem.elevation,
                            "resolution": elem.resolution ? elem.resolution : null,
                            "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                            "content": m_info_window_content_elevation(elem),
                            "zIndex": 2
                        },
                        "id": id + "-elevation-" + index
                    });
                });
            }
        }
        return res;
    }
    
    /**
     * Parse JSON data from Timezone API
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseTimezoneJSON (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        };
        if (_.isObject(data) && data.status && data.status === "OK") {
            if (window.com.xomena.mapRenderer.instances[id] && window.com.xomena.mapRenderer.instances[id].model) {
                var m_service = window.com.xomena.mapRenderer.instances[id].model.get("webservice");
                if(m_service){
                    var m_services = window.com.xomena.mapRenderer.instances[id].model.get("services");
                    var service = m_services.filterById(parseInt(m_service));
                    if($.isArray(service) && service.length){
                        if(service[0].get("name") === "Timezone"){
                            var m_latlng = window.com.xomena.mapRenderer.instances[id].model.getParameterValue("location");
                            if($.isArray(m_latlng) && m_latlng.length) {
                                var m_arr = m_latlng[0].split(",");
                                res.features.push({
                                  "type": "Feature",
                                  "geometry": {
                                    "type": "Point",
                                    "coordinates": [parseFloat(m_arr[1]), parseFloat(m_arr[0])]
                                  },
                                  "properties": {
                                    "timeZoneName": data.timeZoneName,
                                    "timeZoneId": data.timeZoneId,
                                    "rawOffset": data.rawOffset,
                                    "dstOffset": data.dstOffset,
                                    "icon": ICON_URL,
                                    "content": m_info_window_content_timezone(data, parseFloat(m_arr[0]), parseFloat(m_arr[1])),
                                    "zIndex": 2
                                  },
                                  "id": id + "-timezone"
                                });                
                            }
                        }
                    }
                }
            }
        }
        return res;
    }

    /**
     * Parse JSON data from Places search (nearby and text searches)
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parsePlacesSearchJSON (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        };
        if (_.isObject(data) && data.status && data.status === "OK") {
            if (data.results && _.isArray(data.results) && data.results.length) {
                _.each(data.results, function (place, index) {
                    m_add_place_to_geojson(place, res, false);
                });
            }
        }
        return res;
    }

    /**
     * Parse JSON data from Places radar search
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} null (features will be added asyncronously on map)
     */
    function m_parsePlacesRadarJSON (data, map, id) {
        window.com.xomena.mapRenderer.clearMap(id);
        if (_.isObject(data) && data.status && data.status === "OK") {
            if (data.results && _.isArray(data.results) && data.results.length) {
                var m_batch = [];
                _.each(data.results, function (place, index) {
                    m_batch.push(place.place_id);
                });
                m_add_places_in_batch(m_batch, map, id);
            }
        }
        return null;
    }

    /**
     * Parse JSON data from Places detail
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parsePlacesDetailJSON (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        };
        if (_.isObject(data) && data.status && data.status === "OK" && data.result) {
            m_add_place_to_geojson(data.result, res, false);
        }
        return res;
    }

    /**
     * Parse JSON data from Places autocomplete
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} null (features will be added asyncronously on map)
     */
    function m_parsePlacesAutocompleteJSON (data, map, id) {
        window.com.xomena.mapRenderer.clearMap(id);
        if (_.isObject(data) && data.status && data.status === "OK") {
            if (data.predictions && _.isArray(data.predictions) && data.predictions.length) {
                var m_batch = [];
                _.each(data.predictions, function (place, index) {
                    m_batch.push(place.place_id);
                });
                m_add_places_in_batch(m_batch, map, id);
            }
        }
        return null;
    }

    /**
     * Parse JSON data from Snap to Roads
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} null (features will be added asyncronously on map)
     */
    function m_parseSnapToRoadsJSON (data, map, id) {
        window.com.xomena.mapRenderer.clearMap(id);
        m_add_original_points_for_snap(id, map);
        if (_.isObject(data) && data.snappedPoints && _.isArray(data.snappedPoints) && data.snappedPoints.length) {
            var m_batch = [];
            _.each(data.snappedPoints, function (place, index) {
                m_batch.push({
                    placeId: place.placeId,
                    location: new google.maps.LatLng(place.location.latitude, place.location.longitude),
                    originalIndex: ("originalIndex" in place && place.originalIndex>=0) ? place.originalIndex : null
                });
            });
            m_add_snappedpoints_in_batch(m_batch, map, id);
        }
        return null;
    }

     /**
     * Parse JSON data from Speed Limits
     * @param {Object} data Data from the web service (JSON object)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} null (features will be added asyncronously on map)
     */
    function m_parseSpeedLimitsJSON (data, map, id) {
        window.com.xomena.mapRenderer.clearMap(id);
        if (_.isObject(data)) {
            var m_hash = {};
            if (data.speedLimits && _.isArray(data.speedLimits) && data.speedLimits.length) {
              _.each(data.speedLimits, function (speed, index) {
                m_hash[speed.placeId] = speed.speedLimit + ' ' + speed.units;
              });
            }
            if (data.snappedPoints && _.isArray(data.snappedPoints) && data.snappedPoints.length) {
                m_add_original_points_for_snap(id, map);
                var m_batch = [];
                _.each(data.snappedPoints, function (place, index) {
                    var m_obj = {
                        placeId: place.placeId,
                        location: new google.maps.LatLng(place.location.latitude, place.location.longitude),
                        originalIndex: ("originalIndex" in place && place.originalIndex>=0) ? place.originalIndex : null
                    };
                    if (m_hash[place.placeId]) {
                      m_obj.speedLimit = m_hash[place.placeId];
                    }
                    m_batch.push(m_obj);
                });
                m_add_snappedpoints_in_batch(m_batch, map, id);
            } else if (data.speedLimits && _.isArray(data.speedLimits) && data.speedLimits.length) {
                m_add_speedlimits_in_batch(data.speedLimits, map, id);
            }
        }
        return null;
    }


    /**
     * Parse XML data from Geocoding API
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseGeocodeXML (data, map, id) {
        var xmlDoc = m_getXMLDoc($.trim(data)),
            res = {
                "type": "FeatureCollection",
                "features": []
            },
            bounds = new google.maps.LatLngBounds();
        if (xmlDoc) {
            var s = xmlDoc.getElementsByTagName("status");
            if (s && s.length && s[0].firstChild.nodeValue === "OK") {
                var r = xmlDoc.getElementsByTagName("result");
                if(r && r.length) {
                    _.each(r, function (node, index) {
                        var m_address, m_types, m_location_type, m_place_id, m_lat, m_lng,
                            m_sw_lat, m_sw_lng, m_ne_lat, m_ne_lng, m_partial_match,
                            fa_node = node.getElementsByTagName("formatted_address"),
                            t_nodes = node.getElementsByTagName("type"),
                            pl_node = node.getElementsByTagName("place_id"),
                            pm_node = node.getElementsByTagName("partial_match"),
                            geo_node = node.getElementsByTagName("geometry");

                        if (fa_node && fa_node.length) {
                            m_address = fa_node[0].firstChild.nodeValue;
                        }
                        if (t_nodes && t_nodes.length) {
                            var tt = [];
                            _.each(t_nodes, function (t_node, ii) {
                                if (t_node.parentNode.tagName === "result") {
                                    tt.push(t_node.firstChild.nodeValue);
                                }
                            });
                            m_types = tt.join(",");
                        }
                        if (pl_node && pl_node.length) {
                            m_place_id = pl_node[0].firstChild.nodeValue;
                        }
                        if (pm_node && pm_node.length) {
                            m_partial_match = Boolean(pm_node[0].firstChild.nodeValue);  
                        }
                        if (geo_node && geo_node.length) {
                            var loc_node = geo_node[0].getElementsByTagName("location"),
                                vp_node = geo_node[0].getElementsByTagName("viewport");

                            if(loc_node && loc_node.length) {
                                m_lat = parseFloat(loc_node[0].getElementsByTagName("lat")[0].firstChild.nodeValue);
                                m_lng = parseFloat(loc_node[0].getElementsByTagName("lng")[0].firstChild.nodeValue);
                            }

                            if (vp_node && vp_node.length) {
                                m_sw_lat = parseFloat(vp_node[0].getElementsByTagName("southwest")[0].getElementsByTagName("lat")[0].firstChild.nodeValue);
                                m_sw_lng = parseFloat(vp_node[0].getElementsByTagName("southwest")[0].getElementsByTagName("lng")[0].firstChild.nodeValue);
                                m_ne_lat = parseFloat(vp_node[0].getElementsByTagName("northeast")[0].getElementsByTagName("lat")[0].firstChild.nodeValue);
                                m_ne_lng = parseFloat(vp_node[0].getElementsByTagName("northeast")[0].getElementsByTagName("lng")[0].firstChild.nodeValue);
                            }

                            m_location_type = geo_node[0].getElementsByTagName("location_type")[0].firstChild.nodeValue;
                        }

                        if (m_lat && m_lng) {
                            res.features.push({
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [m_lng, m_lat]
                                },
                                "properties": {
                                    "address": m_address ? m_address : "",
                                    "types": m_types ? m_types : "",
                                    "location_type": m_location_type ? m_location_type : "",
                                    "place_id": m_place_id,
                                    "partial_match": m_partial_match ? m_partial_match : false,
                                    "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                        (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                    "content": m_info_window_content_address({
                                        formatted_address: m_address ? m_address : "",
                                        geometry: {
                                            location_type: m_location_type ? m_location_type : "",
                                            location: {
                                                lat: m_lat,
                                                lng: m_lng
                                            }
                                        },
                                        types: [m_types ? m_types : ""],
                                        place_id: m_place_id,
                                        partial_match: m_partial_match ? m_partial_match : false
                                    })
                                },
                                "id": m_place_id
                            });
                            if (index < 3) {
                                bounds.extend(new google.maps.LatLng(m_lat, m_lng));
                                if (m_sw_lat && m_sw_lng) {
                                    bounds.extend(new google.maps.LatLng(m_sw_lat, m_sw_lng));
                                }
                                if (m_ne_lat && m_ne_lng) {
                                    bounds.extend(new google.maps.LatLng(m_ne_lat, m_ne_lng));
                                }
                            }
                        }
                    });
                    res.bounds = bounds;
                }
            }
        }
        return res;
    }

    /**
     * Parse XML data from Directions API
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseDirectionsXML (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        },
        bounds = new google.maps.LatLngBounds(),
        xmlDoc = m_getXMLDoc($.trim(data));
        if (data && xmlDoc) {
            var m_status = $(xmlDoc).find("status").text();
            if(m_status === "OK") {
                $(xmlDoc).find("route").each(function(index, elem){
                    var arr1 = google.maps.geometry.encoding.decodePath($(this).find("overview_polyline > points").text()),
                        m_coord = [];
                    _.each(arr1, function (p, ind1) {
                        m_coord.push([p.lng(), p.lat()]);
                    });
                    res.features.push({
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": m_coord
                        },
                        "properties": {
                            "color": ROUTE_COLORS[index],
                            "summary": $(this).find(" > summary").text(),
                            "zIndex": $(xmlDoc).find("route").length - index
                        },
                        "id": $(xmlDoc).find("geocoded_waypoint > place_id").text() + "-" + index
                    });
                    if ($(xmlDoc).find("bounds").length) {
                        bounds.extend(new google.maps.LatLng(parseFloat($(xmlDoc).find("bounds > northeast > lat").text()), parseFloat($(xmlDoc).find("bounds > northeast > lng").text())));
                        bounds.extend(new google.maps.LatLng(parseFloat($(xmlDoc).find("bounds > southwest > lat").text()), parseFloat($(xmlDoc).find("bounds > southwest > lng").text())));
                    }
                });
                res.bounds = bounds;
            }
            if ($(xmlDoc).find("geocoded_waypoint").length) {
                var count = 0;
                $(xmlDoc).find("geocoded_waypoint").each(function (index, wp) {
                    placesServices.getDetails({
                        placeId: $(wp).find("place_id").text()
                    }, function(place_res, status){
                        count++;
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            m_add_place_to_map (place_res, map, true);
                        }
                        if (count === $(xmlDoc).find("geocoded_waypoint").length && m_status !== "OK") {
                            m_adjust_bounds(map);
                        }
                    });
                });
            }
        }
        return res;
    }
    
    /**
     * Parse XML data from Distance Matrix API
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} null (features will be added asyncronously on map)
     */
    function m_parseDistanceMatrixXML (data, map, id) {
        var total = 0, respCount = 0, xmlDoc = m_getXMLDoc($.trim(data));
        
        function m_callback_o (results, status) {
          respCount++;
          if (status === google.maps.GeocoderStatus.OK) {
            m_add_address_to_map(results[0], map, ICON_URL);
          }
          if (respCount === total) {
            m_adjust_bounds(map);            
          }
        }
        
        function m_callback_d (results, status) {
          respCount++;
          if (status === google.maps.GeocoderStatus.OK) {
            m_add_address_to_map(results[0], map, ICON_URL_PINK);
          }
          if (respCount === total) {
            m_adjust_bounds(map);            
          }
        }

        window.com.xomena.mapRenderer.clearMap(id);  
        if (data && xmlDoc) {
            var m_status = $(xmlDoc).find("DistanceMatrixResponse > status").text();
            var counter = 0;
            total = $(xmlDoc).find("DistanceMatrixResponse > origin_address").length + $(xmlDoc).find("DistanceMatrixResponse > destination_address").length;
            if(m_status === "OK") {
                $(xmlDoc).find("DistanceMatrixResponse > origin_address").each(function(index, elem){
                    var m_req = {
                      address: $(elem).text()
                    };
                    if (counter < 10) {
                      geocoder.geocode(m_req, m_callback_o);
                    } else {
                      window.setTimeout(function () {
                        geocoder.geocode(m_req, m_callback_o);
                      }, (counter-9)*1000);
                    }
                    counter++;
                });
                $(xmlDoc).find("DistanceMatrixResponse > destination_address").each(function(index, elem){
                    var m_req = {
                      address: $(elem).text()
                    };
                    if (counter < 10) {
                      geocoder.geocode(m_req, m_callback_d);
                    } else {
                      window.setTimeout(function () {
                        geocoder.geocode(m_req, m_callback_d);
                      }, (counter-9)*1000);
                    }
                    counter++;
                });
            }
        }
        return null;
    }
    
    /**
     * Parse XML data from Elevation API
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseElevationXML (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        }, xmlDoc = m_getXMLDoc($.trim(data));

        if (data && xmlDoc) {
            var m_status = $(xmlDoc).find("ElevationResponse > status").text();
            if(m_status === "OK") {
                $(xmlDoc).find("ElevationResponse > result").each(function(index, elem){
                    res.features.push({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [parseFloat($(elem).find("location > lng").text()), parseFloat($(elem).find("location > lat").text())]
                        },
                        "properties": {
                            "elevation": $(elem).find("elevation").text(),
                            "resolution": $(elem).find("resolution").text(),
                            "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                            "content": m_info_window_content_elevation({
                              elevation: $(elem).find("elevation").text(),
                              location: {
                                lat: parseFloat($(elem).find("location > lat").text()),
                                lng: parseFloat($(elem).find("location > lng").text())
                              },
                              resolution: $(elem).find("resolution").text()
                            }),
                            "zIndex": 2
                        },
                        "id": id + "-elevation-" + index
                    });
                });
            }
        }
        return res;
    }
    
    /**
     * Parse XML data from Timezone API
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseTimezoneXML (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        }, xmlDoc = m_getXMLDoc($.trim(data));
        if (data && xmlDoc) {
          var m_status = $(xmlDoc).find("TimeZoneResponse > status").text();
          if (m_status === "OK") {
              if (window.com.xomena.mapRenderer.instances[id] && window.com.xomena.mapRenderer.instances[id].model) {
                  var m_service = window.com.xomena.mapRenderer.instances[id].model.get("webservice");
                  if(m_service){
                      var m_services = window.com.xomena.mapRenderer.instances[id].model.get("services");
                      var service = m_services.filterById(parseInt(m_service));
                      if($.isArray(service) && service.length){
                          if(service[0].get("name") === "Timezone"){
                              var m_latlng = window.com.xomena.mapRenderer.instances[id].model.getParameterValue("location");
                              if($.isArray(m_latlng) && m_latlng.length) {
                                  var m_arr = m_latlng[0].split(",");
                                  res.features.push({
                                    "type": "Feature",
                                    "geometry": {
                                      "type": "Point",
                                      "coordinates": [parseFloat(m_arr[1]), parseFloat(m_arr[0])]
                                    },
                                    "properties": {
                                      "timeZoneName": $(xmlDoc).find("TimeZoneResponse > time_zone_name").text(),
                                      "timeZoneId": $(xmlDoc).find("TimeZoneResponse > time_zone_id").text(),
                                      "rawOffset": $(xmlDoc).find("TimeZoneResponse > raw_offset").text(),
                                      "dstOffset": $(xmlDoc).find("TimeZoneResponse > dst_offset").text(),
                                      "icon": ICON_URL,
                                      "content": m_info_window_content_timezone({
                                        "dstOffset": $(xmlDoc).find("TimeZoneResponse > dst_offset").text(),
                                        "rawOffset": $(xmlDoc).find("TimeZoneResponse > raw_offset").text(),
                                        "timeZoneId": $(xmlDoc).find("TimeZoneResponse > time_zone_id").text(),
                                        "timeZoneName": $(xmlDoc).find("TimeZoneResponse > time_zone_name").text()
                                      }, parseFloat(m_arr[0]), parseFloat(m_arr[1])),
                                      "zIndex": 2
                                    },
                                    "id": id + "-timezone"
                                  });                
                              }
                          }
                      }
                  }
              }
          }
        }  
        return res;
    }

    /**
     * Parse XML data from Places API (nearby and text searches)
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parsePlacesSearchXML (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        },
        xmlDoc = m_getXMLDoc($.trim(data));
        if (data && xmlDoc) {
            var m_status = $(xmlDoc).find("status").text();
            if(m_status === "OK") {
                $(xmlDoc).find("result").each(function(index, elem){
                    var m_place = {
                        geometry: {
                            location: {
                                lat: parseFloat($(this).find("geometry > location > lat").text()),
                                lng: parseFloat($(this).find("geometry > location > lng").text())
                            }
                        },
                        name: $(this).find("name").text(),
                        vicinity: $(this).find("vicinity").text(),
                        types: [],
                        rating: parseFloat($(this).find("rating").text()),
                        icon: $(this).find("icon").text(),
                        place_id: $(this).find("place_id").text(),
                        formatted_address: $(this).find("formatted_address").text()
                    };
                    $(this).find(" > type").each(function () {
                        m_place.types.push($(this).text());
                    });
                    m_add_place_to_geojson(m_place, res, false);
                });
            }
        }
        return res;
    }

    /**
     * Parse XML data from Places API radar search
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} null (features will be added asynchronously on map)
     */
    function m_parsePlacesRadarXML (data, map, id) {
        window.com.xomena.mapRenderer.clearMap(id);
        var xmlDoc = m_getXMLDoc($.trim(data));
        if (data && xmlDoc) {
            var m_status = $(xmlDoc).find("status").text();
            if(m_status === "OK") {
                var m_batch = [];
                $(xmlDoc).find("result").each(function(index, elem){
                    m_batch.push($(this).find("place_id").text());
                });
                m_add_places_in_batch(m_batch, map, id);
            }
        }
        return null;
    }

    /**
     * Parse XML data from Places API details
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parsePlacesDetailXML (data, map, id) {
        return m_parsePlacesSearchXML(data, map, id);
    }

    /**
     * Parse XML data from Places autocomplete
     * @param {String} data Data from the web service (XML string)
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} null (features will be added asynchronously on map)
     */
    function m_parsePlacesAutocompleteXML (data, map, id) {
        window.com.xomena.mapRenderer.clearMap(id);
        var xmlDoc = m_getXMLDoc($.trim(data));
        if (data && xmlDoc) {
            var m_status = $(xmlDoc).find("status").text();
            if(m_status === "OK") {
                var m_batch = [];
                $(xmlDoc).find("prediction").each(function(index, elem){
                    m_batch.push($(this).find("place_id").text());
                });
                m_add_places_in_batch(m_batch, map, id);
            }
        }
        return null;
    }

    /**
     * Parse Static Maps data
     * @param {Object} data Data from render map instance view call
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseStaticMap (data, map, id) {
        var res = {
            "type": "FeatureCollection",
            "features": []
        };
        /*if (_.isObject(data) && data.status && data.status === "OK") {
            if (data.results && _.isArray(data.results)) {
                _.each(data.results, function (elem, index) {
                    res.features.push({
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [elem.geometry.location.lng, elem.geometry.location.lat]
                        },
                        "properties": {
                            "address": elem.formatted_address,
                            "types": elem.types.join(","),
                            "location_type": elem.geometry.location_type,
                            "place_id": elem.place_id,
                            "partial_match": elem.partial_match ? elem.partial_match : false,
                            "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                            "content": m_info_window_content_address(elem),
                            "zIndex": 2
                        },
                        "id": elem.place_id
                    });
                    if (index < 3) {
                        bounds.extend(new google.maps.LatLng(elem.geometry.location.lat, elem.geometry.location.lng));
                        if (elem.geometry.viewport) {
                            bounds.extend(new google.maps.LatLng(elem.geometry.viewport.northeast.lat, elem.geometry.viewport.northeast.lng));
                            bounds.extend(new google.maps.LatLng(elem.geometry.viewport.southwest.lat, elem.geometry.viewport.southwest.lng));
                        }
                    }
                });
                res.bounds = bounds;
            }
        }*/

        var m_center = com.xomena.mapRenderer.instances[id].model.getParameterValue("center");
        if($.isArray(m_center) && m_center.length) {
            //TODO: implement set center.
        }


        return res;
    }

    /**
     * Adds arrow feature to show location (reverse geocoding, places searches)
     * @param {String} id      ID for feature
     * @param {Float} lat     Latitude
     * @param {Float} lng     Longitude
     * @param {Object}   geoJSON GeoJSON object from response
     */
    function m_add_arrow_point (id, lat, lng, geoJSON) {
        if(geoJSON && geoJSON.features) {
            geoJSON.features.unshift({
                "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat]
                    },
                    "properties": {
                        "address": lat + "," + lng,
                        "icon": ICON_ARROW
                    },
                    "id": id
            });
        }
    }

    /**
     * Template for info window content of address
     * @param {Object} elem Objects that represents address in web service response
     */
    function m_info_window_content_address (elem) {
        return  '<div id="infowindow" class="infowindow">' +
                '<h2>' + elem.formatted_address + '</h2>' +
                '<ul>' +
                (elem.geometry.location_type ? '<li><b>Location type:</b> ' + elem.geometry.location_type + '</li>' : '') +
                '<li><b>Types:</b> ' + elem.types.join(", ") + '</li>' +
                '<li><b>Place ID:</b> ' + elem.place_id + '</li>' +
                '<li><b>Location:</b> ' + elem.geometry.location.lat + ',' + elem.geometry.location.lng + '</li>' +
                (elem.partial_match ? '<li><b style="color:red;">Partial match!</b></li>' : '') +
                '</ul>' +
                '</div>';
    }
    
    /**
     * Template for info window content of elevation
     * @param {Object} elem Objects that represents elevation in web service response
     */
    function m_info_window_content_elevation (elem) {
        return  '<div id="infowindow" class="infowindow">' +
                '<ul>' +
                '<li><b>Elevation (in meters):</b> ' + elem.elevation + '</li>' +
                '<li><b>Location:</b> ' + elem.location.lat + ',' + elem.location.lng + '</li>' +
                (elem.resolution ? '<li><b>Resolution (in meters):</b> ' + elem.resolution + '</li>' : '') +
                '</ul>' +
                '</div>';
    }
    
    /**
     * Template for info window content of elevation
     * @param {Object} elem Objects that represents elevation in web service response
     */
    function m_info_window_content_timezone (elem, lat, lng) {
        return  '<div id="infowindow" class="infowindow">' +
                '<ul>' +
                '<h2>' + elem.timeZoneName + '</h2>' +
                '<li><b>Time zone Id:</b> ' + elem.timeZoneId + '</li>' +
                '<li><b>Offset from UTC (in seconds):</b> ' + elem.rawOffset + '</li>' +
                '<li><b>Offset for daylight-savings (in seconds):</b> ' + elem.dstOffset + '</li>' +
                '<li><b>Location:</b> ' + lat + ',' + lng + '</li>' +
                '</ul>' +
                '</div>';
    }

    /**
     * Template for info window content of place
     * @param {Object} place Object that represents place in web service response
     */
    function m_info_window_content_place (place) {
        var m_isJsClass = place.geometry.location instanceof google.maps.LatLng;
        var m_lat = m_isJsClass ? place.geometry.location.lat() : place.geometry.location.lat,
            m_lng = m_isJsClass ? place.geometry.location.lng() : place.geometry.location.lng;
        return  '<div id="infowindow" class="infowindow">' +
                '<h2>' + place.name + '</h2>' +
                '<ul>' +
                (place.formatted_address ? '<li><b>Address:</b> ' + place.formatted_address + '</li>' : '') +
                '<li><b>Types:</b> ' + place.types.join(", ") + '</li>' +
                '<li><b>Place ID:</b> ' + place.place_id + '</li>' +
                (place.vicinity ? '<li><b>Vicinity:</b> ' + place.vicinity + '</li>' : '') +
                (place.rating ? '<li><b>Rating:</b> ' + place.rating + '</li>' : '') +
                '<li><b>Location:</b> ' + m_lat + ',' + m_lng + '</li>' +
                '</ul>' +
                '</div>';
    }

    /**
     * Template for info window content of snapped point
     * @param {Object} point Objects that represents snapped point in web service response
     */
    function m_info_window_content_snappedpoint (point) {
        return  '<div id="infowindow" class="infowindow">' +
                '<h2>' + "Snapped point"+(point.originalIndex!==null ? " ("+(point.originalIndex+1)+")" : "") + '</h2>' +
                '<ul>' +
                (point.speedLimit ? '<li><b>Speed limit:</b> ' + point.speedLimit + '</li>' : '')+
                '<li><b>Place ID:</b> ' + point.placeId + '</li>' +
                '<li><b>Location:</b> ' + point.location.lat() + ',' + point.location.lng() + '</li>' +
                '</ul>' +
                '<div id="infowindow-moreinfo">' +
                '<a href="#" title="More info" onclick="window.com.xomena.mapRenderer.showAdditionalInfo(\'' + point.placeId + '\');">More info</a>' +
                '</div>' +
                '</div>';
    }
    
    /**
     * Template for info window content of speed limit
     * @param {Object} speed limit Object that represents place in web service response
     */
    function m_info_window_content_speedlimit (speedlimit) {
        var m_lat = speedlimit.place.geometry.location.lat(),
            m_lng = speedlimit.place.geometry.location.lng();
        return  '<div id="infowindow" class="infowindow">' +
                '<h2>' + speedlimit.place.name + '</h2>' +
                '<ul>' +
                '<li><b>Speed limit:</b> ' + speedlimit.speedLimit + ' ' + speedlimit.units + '</li>' +
                (speedlimit.place.formatted_address ? '<li><b>Address:</b> ' + speedlimit.place.formatted_address + '</li>' : '') +
                '<li><b>Types:</b> ' + speedlimit.place.types.join(", ") + '</li>' +
                '<li><b>Place ID:</b> ' + speedlimit.placeId + '</li>' +
                (speedlimit.place.vicinity ? '<li><b>Vicinity:</b> ' + speedlimit.place.vicinity + '</li>' : '') +
                '<li><b>Location:</b> ' + m_lat + ',' + m_lng + '</li>' +
                '</ul>' +
                '</div>';
    }

    /**
     * Retrieves an XML doc from the string value
     * @param   {String} txt The XML string
     * @returns {Object} xmlDoc object
     */
    function m_getXMLDoc (txt) {
        var xmlDoc = null, parser;
        if (window.DOMParser) {
            parser=new DOMParser();
            xmlDoc=parser.parseFromString(txt,"text/xml");
        } else {
            // Internet Explorer
            xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async=false;
            xmlDoc.loadXML(txt);
        }
        return xmlDoc;
    }

    /**
     * Creates a feature of type Point in GeoJSON for place
     * @param {google.maps.places.PlaceResult} place   Instance of the google.maps.places.PlaceResult
     * @param {Object} geojson GeoJSON object
     * @param {Boolean} renderAsAddress Render the place like ordinary street address?
     */
    function m_add_place_to_geojson (place, geojson, renderAsAddress) {
        var m_isJsClass = place.geometry.location instanceof google.maps.LatLng;
        var m_lat = m_isJsClass ? place.geometry.location.lat() : place.geometry.location.lat,
            m_lng = m_isJsClass ? place.geometry.location.lng() : place.geometry.location.lng;
        geojson.features.push({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [m_lng, m_lat]
            },
            "properties": {
                "address": place.formatted_address ? place.formatted_address : '',
                "types": place.types.join(","),
                "phone": place.international_phone_number ? place.international_phone_number : '',
                "name": place.name,
                "place_id": place.place_id,
                "price_level": place.price_level ? place.price_level : null,
                "rating": place.rating,
                "url": place.url ? place.url : '',
                "vicinity": place.vicinity ? place.vicinity : '',
                "website": place.website ? place.website : '',
                "icon": place.icon,
                "iconSize": place.icon===ICON_PLACE ? ICON_SIZE_32 : ICON_SIZE_16,
                "content": renderAsAddress ? m_info_window_content_address({
                    formatted_address: place.formatted_address ? place.formatted_address : place.vicinity,
                    geometry: {
                        location: {
                            lat: m_lat,
                            lng: m_lng
                        }
                    },
                    types: place.types,
                    place_id: place.place_id
                }) : m_info_window_content_place(place),
                "zIndex": 2
            },
            "id": place.place_id
        });
    }
    
    /**
     * Adds geocoded address on map as a Point feature
     * @param {google.maps.GeocoderResult}  address Address instance of google.maps.GeocoderResult
     * @param {google.maps.Map}   map   Map instance
     */
    function m_add_address_to_map (address, map, icon) {
        map.data.add(new google.maps.Data.Feature({
            geometry: address.geometry.location,
            id: address.place_id,
            "properties": {
                "address": address.formatted_address,
                "types": address.types.join(", "),
                "partial_match": address.partial_match,
                "place_id": address.place_id,
                "icon": icon ? icon : ICON_URL,
                "iconSize": ICON_SIZE_32,
                "content": m_info_window_content_address({
                    formatted_address: address.formatted_address,
                    geometry: {
                        location: {
                            lat: address.geometry.location.lat(),
                            lng: address.geometry.location.lng()
                        }
                    },
                    types: address.types,
                    place_id: address.place_id
                }),
                "zIndex": 2
            }
        }));
    }

    /**
     * Adds a place on map as a Point feature
     * @param {Object}   place           Place instance of google.maps.places.PlaceResult
     * @param {Object}   map             Map instance
     * @param {boolean} renderAsAddress Would you like to render it as address?
     */
    function m_add_place_to_map (place, map, renderAsAddress) {
        map.data.add(new google.maps.Data.Feature({
            geometry: place.geometry.location,
            id: place.place_id,
            "properties": {
                "address": place.formatted_address,
                "types": place.types.join(","),
                "phone": place.international_phone_number,
                "html_attributions": place.html_attributions,
                "name": place.name,
                "place_id": place.place_id,
                "price_level": place.price_level,
                "rating": place.rating,
                "url": place.url,
                "vicinity": place.vicinity,
                "website": place.website,
                "icon": place.icon,
                "iconSize": place.icon===ICON_PLACE ? ICON_SIZE_32 : ICON_SIZE_16,
                "content": renderAsAddress ? m_info_window_content_address({
                    formatted_address: place.formatted_address,
                    geometry: {
                        location: {
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng()
                        }
                    },
                    types: place.types,
                    place_id: place.place_id
                }) : m_info_window_content_place(place),
                "zIndex": 2
            }
        }));
    }

    /**
     * Adjusts bounds of the map according to the existing features
     * @param {Object} map Map instance
     */
    function m_adjust_bounds (map) {
        var bounds = new google.maps.LatLngBounds();
        map.data.forEach(function (feature) {
            switch (feature.getGeometry().getType()) {
                case "Point":
                    bounds.extend(feature.getGeometry().get());
                    break;
            }
        });
        map.fitBounds(bounds);
    }

    function m_add_center_and_radius (id, map) {
        if (window.com.xomena.mapRenderer.instances[id] &&
            window.com.xomena.mapRenderer.instances[id].model) {
            var m_service = window.com.xomena.mapRenderer.instances[id].model.get("webservice");
            if(m_service){
                var m_services = window.com.xomena.mapRenderer.instances[id].model.get("services");
                var service = m_services.filterById(parseInt(m_service));
                if($.isArray(service) && service.length){
                    switch(service[0].get("name")){
                        case "Places Radar Search":
                        case "Place Autocomplete":
                        case "Query Autocomplete":
                            var m_latlng = window.com.xomena.mapRenderer.instances[id].model.getParameterValue("location");
                            if($.isArray(m_latlng) && m_latlng.length) {
                                var m_arr = m_latlng[0].split(",");
                                var m_loc = new google.maps.LatLng(parseFloat(m_arr[0]), parseFloat(m_arr[1]));
                                map.data.add(new google.maps.Data.Feature({
                                    geometry: m_loc,
                                    id: "arrow-"+id,
                                    "properties": {
                                        "address": m_latlng[0],
                                        "icon": ICON_ARROW
                                    }
                                }));
                                var m_radius = window.com.xomena.mapRenderer.instances[id].model.getParameterValue("radius");
                                if($.isArray(m_radius) && m_radius.length && m_radius[0]) {
                                        window.com.xomena.mapRenderer.instances[id].circle.setCenter(m_loc);
                                        window.com.xomena.mapRenderer.instances[id].circle.setRadius(parseInt(m_radius[0]));
                                        window.com.xomena.mapRenderer.instances[id].circle.setVisible(true);
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    function m_add_original_points_for_snap (id, map) {
        if (window.com.xomena.mapRenderer.instances[id] &&
            window.com.xomena.mapRenderer.instances[id].model) {
            var m_service = window.com.xomena.mapRenderer.instances[id].model.get("webservice");
            if(m_service){
                var m_services = window.com.xomena.mapRenderer.instances[id].model.get("services");
                var service = m_services.filterById(parseInt(m_service));
                if($.isArray(service) && service.length){
                    switch(service[0].get("name")){
                        case "Snap to Road":
                        case "Speed Limits":  
                            var m_latlng = window.com.xomena.mapRenderer.instances[id].model.getParameterValue("path");
                            if($.isArray(m_latlng) && m_latlng.length) {
                                _.each(m_latlng, function(p, ind) {
                                    if (p) {
                                        var m_arr = p.split(",");
                                        var m_loc = new google.maps.LatLng(parseFloat(m_arr[0]), parseFloat(m_arr[1]));
                                        map.data.add(new google.maps.Data.Feature({
                                            geometry: m_loc,
                                            id: "point-" +ind + "-" +id,
                                            "properties": {
                                                "address": p,
                                                "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                                (ind < ICON_LABELS.length ? ICON_LABELS.charAt(ind) : "blu-blank") + ".png"
                                            }
                                        }));
                                    }
                                });
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    /**
     * Adds a batch of places on the map
     *
     * @param {Array} batch Array of place IDs to add to the map
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     */
    function m_add_places_in_batch(batch, map, id) {
        var count = 0, progress = document.querySelector('#progress-' + id);
        
        function m_callback (place_res, status) {
            count++;
            console.log("Status: " + status);
            progress.value = count;
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                m_add_place_to_map (place_res, map, false);
            }
            if (count === batch.length) {
                progress.value = progress.min;
            }
            if (count === Math.min(10, batch.length)) {
                m_adjust_bounds(map);
            }
        }
        
        if (_.isArray(batch) && batch.length) {
            m_add_center_and_radius(id, map);
            progress.min = 0;
            progress.max = batch.length;
            progress.value = progress.min;

            _.each(batch, function(place_id, index) {
                var m_req = {
                    placeId: place_id
                };
                if (index < 10) {
                    placesServices.getDetails(m_req, m_callback);
                } else {
                    window.setTimeout(function () {
                       placesServices.getDetails(m_req, m_callback);
                    }, (index-9)*1000);
                }
            });
        }
    }

    /**
     * Adds a batch of snapped points on the map
     *
     * @param {Array} batch Array of snapped points to add to the map
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     */
    function m_add_snappedpoints_in_batch(batch, map, id) {
        var progress = document.querySelector('#progress-' + id);
        if (_.isArray(batch) && batch.length) {
            progress.min = 0;
            progress.max = batch.length;
            progress.value = progress.min;

            _.each(batch, function(point, index) {
                progress.value = index + 1;
                m_add_snappedpoint_to_map(point, map);
            });
            progress.value = progress.min;
            m_adjust_bounds(map);
        }
    }

    /**
     * Adds a snapped point on a map as a Point feature
     * @param {Object}   point           The snapped point from response
     * @param {Object}   map             Map instance
     */
    function m_add_snappedpoint_to_map (point, map) {
        map.data.add(new google.maps.Data.Feature({
            geometry: point.location,
            id: point.placeId,
            "properties": {
                "address": "Snapped point"+(point.originalIndex!==null ? " ("+(point.originalIndex+1)+")" : ""),
                "name": "Snapped point"+(point.originalIndex!==null ? " ("+(point.originalIndex+1)+")" : ""),
                "place_id": point.placeId,
                "icon": ICON_URL,
                "iconSize": ICON_SIZE_32,
                "content": m_info_window_content_snappedpoint(point),
                "zIndex": 4
            }
        }));
    }

    /**
     * Adds a batch of speed limits on the map
     *
     * @param {Array} batch Array of speed limits to add to the map
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     */
    function m_add_speedlimits_in_batch(batch, map, id) {
        var count = 0, progress = document.querySelector('#progress-' + id),
            m_hash = [];

        function m_callback (place_res, status) {
            console.log("Status: " + status);
            progress.value = count + 1;
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                if (m_hash[count]) {
                    m_hash[count]["place"] = place_res;
                }
            }
            count++;
            if (count === batch.length) {
                progress.value = progress.min;
                _.each(m_hash, function (speedlimit, index) {
                    if(speedlimit.place) {
                        m_add_speedlimit_to_map(speedlimit, map);
                    }
                });
                m_adjust_bounds(map);
            }
        }

        if (_.isArray(batch) && batch.length) {
            progress.min = 0;
            progress.max = batch.length;
            progress.value = progress.min;

            _.each(batch, function(speedlimit, index) {
                var m_req = {
                    placeId: speedlimit.placeId
                };
                m_hash.push(speedlimit);
                window.setTimeout(function () {
                   placesServices.getDetails(m_req, m_callback);
                }, index*1000);
            });
        }
    }

    /**
     * Adds a speed limit on map as a Point feature
     * @param {Object}   place           Place instance of google.maps.places.PlaceResult
     * @param {Object}   map             Map instance
     */
    function m_add_speedlimit_to_map (speedlimit, map) {
        map.data.add(new google.maps.Data.Feature({
            geometry: speedlimit.place.geometry.location,
            id: speedlimit.placeId,
            "properties": {
                "address": speedlimit.place.formatted_address,
                "types": speedlimit.place.types.join(","),
                "name": speedlimit.place.name,
                "place_id": speedlimit.placeId,
                "vicinity": speedlimit.place.vicinity,
                "icon": speedlimit.place.icon,
                "iconSize": speedlimit.place.icon===ICON_PLACE ? ICON_SIZE_32 : ICON_SIZE_16,
                "content": m_info_window_content_speedlimit(speedlimit),
                "zIndex": 6
            }
        }));
    }

})(window, jQuery, _);
