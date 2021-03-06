(function (window, $, _) {
    'use strict';

    var ICON_URL = "http://maps.google.com/mapfiles/kml/paddle/blu-blank.png",
        ICON_URL_PINK = "http://maps.google.com/mapfiles/kml/paddle/pink-blank.png",
        ICON_LABELS = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        ICON_ARROW = "http://www.google.com/mapfiles/arrow.png",
        ICON_ARROW_SHADOW = "http://www.google.com/mapfiles/arrowshadow.png",
        ROUTE_COLORS = ['#C53929', '#0B8043', '#3367D6', '#455A64'],
        infoWindow = null,
        placesServices = null,
        geocoder = null,
        directions = null,
        ICON_SIZE_32 = null,
        ICON_SIZE_24 = null,
        ICON_SIZE_16 = null,
        ICON_SIZE_8 = null,
        ICON_PLACE = "https://maps.gstatic.com/mapfiles/place_api/icons/geocode-71.png",
        reLatLng = /^[-+]?\d{1,2}([.]\d+)?,\s*[-+]?\d{1,3}([.]\d+)?$/;

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
            if (!directions) {
                directions = new google.maps.DirectionsService();
            }
            if (!ICON_SIZE_8) {
                ICON_SIZE_8 = new google.maps.Size(8, 8);
            }
            if (!ICON_SIZE_16) {
                ICON_SIZE_16 = new google.maps.Size(16, 16);
            }
            if (!ICON_SIZE_24) {
                ICON_SIZE_24 = new google.maps.Size(24, 24);
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
                                m_name = feature.getProperty("name"),
                                m_visible = feature.getProperty("visible");
                            
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
                                visible: typeof m_visible !== undefined ? m_visible : true,
                                zIndex: m_zindex ? m_zindex : 0
                            };
                            break;
                        case "LineString":
                            var m_color = feature.getProperty("color"),
                                m_opacity = feature.getProperty("opacity"),
                                m_zindex = feature.getProperty("zIndex"),
                                m_weight = feature.getProperty("weight");

                            style = {
                                strokeColor: m_color ? m_color : "#0000FF",
                                strokeOpacity: m_opacity ? m_opacity : 1.0,
                                strokeWeight: m_weight ? m_weight : 4,
                                zIndex: m_zindex ? m_zindex : 0
                            };
                            break;
                        case "Polygon":
                            var m_color = feature.getProperty("color"),
                                m_opacity = feature.getProperty("opacity"),
                                m_zindex = feature.getProperty("zIndex"),
                                m_weight = feature.getProperty("weight"),
                                m_fillColor = feature.getProperty("fillcolor"),
                                m_fillOpacity = feature.getProperty("fillopacity");

                            style = {
                                strokeColor: m_color ? m_color : "#0000FF",
                                strokeOpacity: m_opacity ? m_opacity : 1.0,
                                strokeWeight: m_weight ? m_weight : 4,
                                fillColor: m_fillColor ? m_fillColor : "#00FF00",
                                fillOpacity: m_fillOpacity ? m_fillOpacity : 1.0,
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
                        case "LineString":
                            var m_summary = event.feature.getProperty("summary");
                            if (m_summary) {
                                infoWindow.setPosition(event.latLng);
                                infoWindow.setContent(m_summary);
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
                //Listen to paper-radio-group events
                $("#radiogrp-" + model.get("id")).on("paper-radio-group-changed", "paper-radio-group",  function (ev) {
                    //console.log(ev);
                    if (ev.target) {
                        var m_selected = ev.target.selected;
                        var m_common, m_index;
                        if (m_selected) {
                            var m_arr = m_selected.split("-");
                            m_index = m_arr.pop();
                            m_common = m_arr.join("-");
                        } else {
                            m_common = ev.target.getAttribute("id");
                            m_index = null;
                        }
                        window.com.xomena.mapRenderer.toggleMapFeatures(model.get("id"), m_common, m_index);
                    }
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
            this.instances[id].map.getStreetView().setVisible(false);
            this.instances[id].map.setOptions({styles: []});
            $("#radiogrp-"+id).html("");
        },

        /**
         * Show features according to selection in radio group
         * @param {String} id The ID of Web Service instance
         * @param {String} commonPart The string feature ID must start with
         * @param {String} selectedIndex The selected index in radio group, if any.
         */
        toggleMapFeatures: function (id, commonPart, selectedIndex) {
            if (!this.instances[id]) { return; }
            if (!this.instances[id].map) { return; }
            var self = this;
            this.instances[id].map.data.forEach(function (feature) {
                var m_id = feature.getId();
                if (m_id && m_id.startsWith(commonPart)) {
                    if(infoWindow) {
                        infoWindow.close();
                    }
                    if (selectedIndex) {
                        if (m_id.startsWith(commonPart + "-" + selectedIndex)) {
                            self.instances[id].map.data.overrideStyle(feature, {visible: true});
                        } else {
                            self.instances[id].map.data.overrideStyle(feature, {visible: false});
                        }
                    } else {
                        self.instances[id].map.data.overrideStyle(feature, {visible: true});
                    }
                }
            });
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
                return this.m_getGeoJSON_Image(data, map, id);
        }
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
            case "streetview":
                return m_parseStreetView(data, map, id);
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
            case "staticmap":
            case "streetview":
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
        StaticMapsRender: new window.com.xomena.mapRenderer.Strategy("staticmap"),
        StreetViewRender: new window.com.xomena.mapRenderer.Strategy("streetview")
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
        var m_mode_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("mode");
        var m_mode = m_mode_arr.length ? m_mode_arr[0] : "driving";
        var addedStartFinish = false;
        if (_.isObject(data) && data.status && data.status === "OK") {
            if (data.routes && _.isArray(data.routes) && data.routes.length) {
                var m_radio_content = "";
                _.each(data.routes, function (route, index) {
                    var m_coord = [];
                    var m_descr = "";
                    if (route.legs && _.isArray(route.legs) && route.legs.length) {
                        route.legs.forEach(function (leg, indleg) {
                            if (m_mode !== 'transit') {
                                m_descr += "<li><b>" + leg.start_address + " - " + leg.end_address + "</b><br/>" +
                                    "Distance: " + (leg.distance && leg.distance.text ? leg.distance.text : 'unknown') +
                                    '<br/>' +
                                    "Duration: " + (leg.duration && leg.duration.text ? leg.duration.text : 'unknown') +
                                    (leg.duration_in_traffic && leg.duration_in_traffic.text ? "<br/>Duration in traffic: " + leg.duration_in_traffic.text : "") + "</li>";
                            }
                            if (leg.steps && _.isArray(leg.steps) && leg.steps.length) {
                                leg.steps.forEach(function (step, indstep) {
                                     if (step.polyline && step.polyline.points) {
                                         var arr_s =  google.maps.geometry.encoding.decodePath(step.polyline.points);
                                         if (m_mode !== 'transit') {
                                             arr_s.forEach(function (p) {
                                                  m_coord.push([p.lng(), p.lat()]);
                                             });
                                         } else {
                                             //Transit stuff
                                             var m_coord_trans = [];
                                             var m_summary_trans = step.html_instructions ? '<h3>' + step.html_instructions + '</h3>' : '';
                                             if (step.distance || step.duration) {
                                                 m_summary_trans += '<ul>';
                                                 if (step.travel_mode === 'TRANSIT' && step.transit_details) {
                                                     m_summary_trans += "<li><b>" +
                                                     (step.transit_details.line && step.transit_details.line.vehicle ? "<img src='" + step.transit_details.line.vehicle.icon + "' title='" + step.transit_details.line.vehicle.name +"' width='16' height='16' />&nbsp;&nbsp;" : "") +
                                                     step.transit_details.departure_stop.name + " - " + step.transit_details.arrival_stop.name + "</b></li>";
                                                     m_summary_trans += "<li><b>Departure:</b> " + step.transit_details.departure_time.text + " (" + step.transit_details.departure_time.time_zone + ")</li>";
                                                     m_summary_trans += "<li><b>Arrival:</b> " + step.transit_details.arrival_time.text + " (" + step.transit_details.arrival_time.time_zone + ")</li>";
                                                 }
                                                 m_summary_trans += "<li><b>Distance:</b> " + (step.distance && step.distance.text ? step.distance.text : 'unknown') + '</li>';
                                                 m_summary_trans += "<li><b>Duration:</b> " + (step.duration && step.duration.text ? step.duration.text : 'unknown') + "</li>";
                                                 if (step.travel_mode === 'TRANSIT' && step.transit_details && step.transit_details.line) {
                                                     var agency_link = step.transit_details.line.short_name ? step.transit_details.line.short_name : "";
                                                     if (step.transit_details.line.url) {
                                                         agency_link = "<a href='" + step.transit_details.line.url + "' title='" + agency_link + "' target='_blank'>" + agency_link + "</a>";
                                                     }
                                                     if (step.transit_details.line.name) {
                                                        m_summary_trans += "<li><b>Line:</b> " + step.transit_details.line.name + "</li>";
                                                     }
                                                     if (agency_link) {
                                                        m_summary_trans += "<li><b>Agency:</b> " + agency_link + "</li>";
                                                     }
                                                 }
                                                 m_summary_trans += '</ul>';
                                             }
                                             arr_s.forEach(function (p) {
                                                  m_coord_trans.push([p.lng(), p.lat()]);
                                             });
                                             res.features.push({
                                                "type": "Feature",
                                                "geometry": {
                                                    "type": "LineString",
                                                    "coordinates": m_coord_trans
                                                },
                                                "properties": {
                                                    "color": ROUTE_COLORS[index],
                                                    "summary": m_summary_trans,
                                                    "warnings": route.warnings,
                                                    "waypoint_order": [],
                                                    "zIndex": data.routes.length - index
                                                },
                                                "id": "route-" + id + "-" + index + "-" +
                                                        indleg + "-" + indstep
                                            });
                                            if (step.start_location && step.travel_mode === 'TRANSIT') {
                                                var m_address_1 = step.transit_details && step.transit_details.departure_stop && step.transit_details.departure_stop.name ? step.transit_details.departure_stop.name : '';
                                                res.features.push({
                                                    "type": "Feature",
                                                    "geometry": {
                                                        "type": "Point",
                                                        "coordinates": [step.start_location.lng, step.start_location.lat]
                                                    },
                                                    "properties": {
                                                        "address": m_address_1,
                                                        "types": "transit_station",
                                                        "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                                        "content": '<div id="infowindow" class="infowindow"><h3>' + m_address_1 + '</h3></div>',
                                                        "zIndex": data.routes.length - index
                                                    },
                                                    "id": "route-" + id + "-" + index + "-" +
                                                        indleg + "-" + indstep + "-start"
                                                });
                                            }
                                            if (step.start_location && step.travel_mode === 'WALKING' && indstep === 0) {
                                                var m_arr_0 = com.xomena.mapRenderer.instances[id].model.getParameterValue("origin");
                                                var m_a_0 = m_arr_0.length ? m_arr_0[0] : "";
                                                res.features.push({
                                                    "type": "Feature",
                                                    "geometry": {
                                                        "type": "Point",
                                                        "coordinates": [step.start_location.lng, step.start_location.lat]
                                                    },
                                                    "properties": {
                                                        "address": m_a_0,
                                                        "types": "transit_station",
                                                        "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                                        "content": '<div id="infowindow" class="infowindow"><h3>' + m_a_0 + '</h3></div>',
                                                        "zIndex": data.routes.length - index
                                                    },
                                                    "id": "route-" + id + "-" + index + "-" +
                                                        indleg + "-" + indstep + "-start"
                                                });
                                            }
                                            if (step.end_location && step.travel_mode === 'TRANSIT') {
                                                var m_address_2 = step.transit_details && step.transit_details.arrival_stop && step.transit_details.arrival_stop.name ? step.transit_details.arrival_stop.name : '';
                                                res.features.push({
                                                    "type": "Feature",
                                                    "geometry": {
                                                        "type": "Point",
                                                        "coordinates": [step.end_location.lng, step.end_location.lat]
                                                    },
                                                    "properties": {
                                                        "address": m_address_2,
                                                        "types": "transit_station",
                                                        "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                                        "content": '<div id="infowindow" class="infowindow"><h3>' + m_address_2 + '</h3></div>',
                                                        "zIndex": data.routes.length - index
                                                    },
                                                    "id": "route-" + id + "-" + index + "-" +
                                                        indleg + "-" + indstep + "-end"
                                                });
                                            }
                                            if (step.end_location && step.travel_mode === 'WALKING' && indstep === leg.steps.length -1) {
                                                var m_arr_1 = com.xomena.mapRenderer.instances[id].model.getParameterValue("destination");
                                                var m_a_1 = m_arr_1.length ? m_arr_1[0] : "";
                                                res.features.push({
                                                    "type": "Feature",
                                                    "geometry": {
                                                        "type": "Point",
                                                        "coordinates": [step.end_location.lng, step.end_location.lat]
                                                    },
                                                    "properties": {
                                                        "address": m_a_1,
                                                        "types": "transit_station",
                                                        "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                                        "content": '<div id="infowindow" class="infowindow"><h3>' + m_a_1 + '</h3></div>',
                                                        "zIndex": data.routes.length - index
                                                    },
                                                    "id": "route-" + id + "-" + index + "-" +
                                                        indleg + "-" + indstep + "-end"
                                                });
                                            }
                                         }
                                     }
                                });
                            }
                        });
                    } else {
                        var arr1 = google.maps.geometry.encoding.decodePath(route.overview_polyline.points);
                        _.each(arr1, function (p, ind1) {
                            m_coord.push([p.lng(), p.lat()]);
                        });
                    }
                    if (m_mode !== 'transit') {
                        res.features.push({
                            "type": "Feature",
                            "geometry": {
                                "type": "LineString",
                                "coordinates": m_coord
                            },
                            "properties": {
                                "color": ROUTE_COLORS[index],
                                "summary": '<h3>' + route.summary + '</h3><ul>' + m_descr + '</ul>',
                                "warnings": route.warnings,
                                "waypoint_order": route.waypoint_order,
                                "zIndex": data.routes.length - index
                            },
                            "id": "route-" + id + "-" + index
                        });
                        if (route.legs && _.isArray(route.legs) && route.legs.length) {
                            res.features.push({
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [route.legs[0].start_location.lng, route.legs[0].start_location.lat]
                                },
                                "properties": {
                                    "icon": "image/icons/start-race-2.png",
                                    "iconSize": ICON_SIZE_32,
                                    "address": route.legs[0].start_address,
                                    "zIndex": 4,
                                    "content": '<div id="infowindow" class="infowindow"><h2>' + route.legs[0].start_address+"</h2><ul>" + ((data.geocoded_waypoints && _.isArray(data.geocoded_waypoints) && data.geocoded_waypoints.length) ? "<li><b>Types:</b>&nbsp;" + data.geocoded_waypoints[0].types.join(", ") + "</li><li><b>Place ID:</b>&nbsp;" + data.geocoded_waypoints[0].place_id + "</li>" : "") + "<li><b>Location:</b>&nbsp;" + route.legs[0].start_location.lat + "," + route.legs[0].start_location.lng + "</li></ul></div>"
                                },
                                "id": "route-" + id + "-" + index + "-start-point"
                            });
                            res.features.push({
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [route.legs[route.legs.length-1].end_location.lng, route.legs[route.legs.length-1].end_location.lat]
                                },
                                "properties": {
                                    "icon": "image/icons/finish2.png",
                                    "iconSize": ICON_SIZE_32,
                                    "address": route.legs[route.legs.length-1].end_address,
                                    "zIndex": 4,
                                    "content": '<div id="infowindow" class="infowindow"><h2>' + route.legs[route.legs.length-1].end_address+"</h2><ul>" + ((data.geocoded_waypoints && _.isArray(data.geocoded_waypoints) && data.geocoded_waypoints.length) ? "<li><b>Types:</b>&nbsp;" + data.geocoded_waypoints[data.geocoded_waypoints.length - 1].types.join(", ") + "</li><li><b>Place ID:</b>&nbsp;" + data.geocoded_waypoints[data.geocoded_waypoints.length - 1].place_id + "</li>" : "") + "<li><b>Location:</b>&nbsp;" + route.legs[route.legs.length-1].end_location.lat + "," + route.legs[route.legs.length-1].end_location.lng + "</li></ul></div>"
                                },
                                "id": "route-" + id + "-" + index + "-end-point"
                            });
                            addedStartFinish = true;
                        }
                    }
                    if (route.bounds) {
                        bounds.extend(new google.maps.LatLng(route.bounds.northeast.lat, route.bounds.northeast.lng));
                        bounds.extend(new google.maps.LatLng(route.bounds.southwest.lat, route.bounds.southwest.lng));
                    }
                    m_radio_content += "<paper-radio-button name='route-" + id + "-" + index +"' class='route" + index + "'>Route " +  (index + 1) + "</paper-radio-button>";
                });
                res.bounds = bounds;
                if (m_radio_content) {
                    $("#radiogrp-" + id).html("<paper-radio-group id='route-" + id +"' allow-empty-selection>" + m_radio_content + "</paper-radio-group>");
                }
            }
        }
        if (data.geocoded_waypoints && _.isArray(data.geocoded_waypoints) && data.geocoded_waypoints.length && m_mode !== 'transit') {
            var count = 0;
            _.each(data.geocoded_waypoints, function (wp, index) {
                if((addedStartFinish && (index>0 && index<data.geocoded_waypoints.length-1)) || !addedStartFinish) {
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
                }
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
        
        var m_origins = [];
        var m_destinations = [];
        
        var delayFactor = 0;
        
        function m_get_directions_route (request, index, descr, origIndex) {
            directions.route(request, function(result, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    if ($.isArray(result.routes) && result.routes.length) {
                        var route = result.routes[0];
                        m_draw_route_from_result (route, map, descr, id, index, origIndex)
                    }
                } else if (status === google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
                    delayFactor++;
                    setTimeout(function () {
                        m_get_directions_route(request, index, descr, origIndex);
                    }, delayFactor * 1200);
                } else {
                    console.log("Distance matrix route: " + status);
                    console.log(request);
                }
            });
        }
        
        function m_show_routes () {
            if (m_origins.length && m_destinations.length) {
                var m_avoid_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("avoid");
                var m_avoid = m_avoid_arr.length ? m_avoid_arr[0] : null;
                
                var m_radio_content = "";
                
                m_origins.forEach(function(orig, origIndex) {
                    m_destinations.forEach(function(dest, destIndex) {
                        var req = {
                            origin: {
                              placeId: orig.place_id  
                            },
                            destination: {
                              placeId: dest.place_id  
                            },
                            travelMode: m_getTravelMode(id),
                            avoidFerries: m_avoid === "ferries",
                            avoidHighways: m_avoid === "highways",
                            avoidTolls: m_avoid === "tolls",
                            provideRouteAlternatives: false,
                            unitSystem: m_getUnitSystem(id),
                            drivingOptions: m_getDrivingOptions(id),
                            transitOptions: m_getTransitOptions(id)
                        };
                        var m_descr = "<h3>"+orig.formatted_address+ " - " + dest.formatted_address + "</h3><ul>";
                        if (data.rows && $.isArray(data.rows) && data.rows.length) {
                            var m_row = data.rows[origIndex];
                            if (m_row) {
                                if (m_row.elements && $.isArray(m_row.elements) && m_row.elements.length) {
                                    var m_element = m_row.elements[destIndex];
                                    if (m_element && m_element.status === "OK") {
                                        m_descr += "<li><b>Distance:</b>&nbsp;" + m_element.distance.text + "</li><li><b>Duration:</b>&nbsp;" + m_element.duration.text + "</li>"; 
                                    }
                                }
                            }
                        }
                        m_descr += "</ul>";
                        
                        var m_index = destIndex + origIndex * m_destinations.length;
                        
                        m_radio_content += "<paper-radio-button name='distance-matrix-route-" + id + "-" + m_index + "' class='route" + (origIndex % 4) + "'> " +  orig.formatted_address+ " - " + dest.formatted_address + "</paper-radio-button>";
                        
                        m_get_directions_route(req, m_index, m_descr, origIndex);
                    });
                });
                
                if (m_radio_content) {
                    $("#radiogrp-" + id).html("<paper-radio-group id='distance-matrix-route-" + id +"' allow-empty-selection>" + m_radio_content + "</paper-radio-group>");
                }
            } 
        }
      
        function m_callback_o (results, status) {
          respCount++;
          if (status === google.maps.GeocoderStatus.OK) {
            m_add_address_to_map(results[0], map, ICON_URL);
            m_origins.push(results[0]);  
          }
          if (respCount === total) {
            m_adjust_bounds(map);
            m_show_routes();  
          }
        }
        
        function m_callback_d (results, status) {
          respCount++;
          if (status === google.maps.GeocoderStatus.OK) {
            m_add_address_to_map(results[0], map, ICON_URL_PINK);
            m_destinations.push(results[0]);  
          }
          if (respCount === total) {
            m_adjust_bounds(map);
            m_show_routes();  
          }
        }
      
        window.com.xomena.mapRenderer.clearMap(id);  
        if (_.isObject(data) && data.status && data.status === "OK") {
            var counter = 0;
            if (data.origin_addresses && _.isArray(data.origin_addresses) && data.origin_addresses.length) {
                total += data.origin_addresses.length;
            }
            if (data.destination_addresses && _.isArray(data.destination_addresses) && data.destination_addresses.length) {
                total += data.destination_addresses.length;
            }
            if (data.origin_addresses && _.isArray(data.origin_addresses) && data.origin_addresses.length) {
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
        var m_mode_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("mode");
        var m_mode = m_mode_arr.length ? m_mode_arr[0] : "driving";
        var addedStartFinish = false;
        if (data && xmlDoc) {
            //console.log(xmlDoc);
            var m_status = $(xmlDoc).find("DirectionsResponse > status").text();
            if(m_status === "OK") {
                var m_radio_content = "";
                $(xmlDoc).find("DirectionsResponse > route").each(function (index, elem) {
                    var m_coord = [];
                    var m_descr = "";
                    if ($(this).find(" > leg").length) {
                        $(this).find(" > leg").each(function (legind, legelem) {
                            if (m_mode !== 'transit') {
                                m_descr += "<li><b>" + $(this).find(" > start_address").text() + " - " + $(this).find(" > end_address").text() + "</b><br/>" +
                                    "Distance: " + $(this).find(" > distance > text").text() + '<br/>' +
                                    "Duration: " + $(this).find(" > duration > text").text() +
                                    ($(this).find(" > duration_in_traffic > text").length ? "<br/>Duration in traffic: " + $(this).find(" > duration_in_traffic > text").text() : "") + "</li>";
                            }
                            if ($(this).find(" > step").length) {
                                var m_steps_length = $(this).find(" > step").length;
                                $(this).find(" > step").each(function (stepind, stepelem) {
                                    var arr_s =  google.maps.geometry.encoding.decodePath($(this).find(" > polyline > points").text());
                                    if (m_mode !== 'transit') {
                                        arr_s.forEach(function (p) {
                                            m_coord.push([p.lng(), p.lat()]);
                                        });
                                    } else {
                                        //Transit stuff
                                        var m_coord_trans = [];
                                        var m_summary_trans = $(this).find(" > html_instructions").length ? '<h3>' + $(this).find(" > html_instructions").text() + '</h3>' : '';
                                        if ($(this).find(" > distance").length || $(this).find(" > duration").length) {
                                            m_summary_trans += '<ul>';
                                            if ($(this).find(" > travel_mode").text() === 'TRANSIT' && $(this).find(" > transit_details").length) {
                                                m_summary_trans += "<li><b>" +
                                                 ($(this).find(" > transit_details > line > vehicle").length ? "<img src='" + $(this).find(" > transit_details > line > vehicle > icon").text() + "' title='" + $(this).find(" > transit_details > line > vehicle > name").text() +"' width='16' height='16' />&nbsp;&nbsp;" : "") +
                                                 $(this).find(" > transit_details > departure_stop > name").text() + " - " + $(this).find(" > transit_details > arrival_stop > name").text() + "</b></li>";
                                                 m_summary_trans += "<li><b>Departure:</b> " + $(this).find(" > transit_details > departure_time > text").text() + " (" + $(this).find(" > transit_details > departure_time > time_zone").text() + ")</li>";
                                                 m_summary_trans += "<li><b>Arrival:</b> " + $(this).find(" > transit_details > arrival_time > text").text() + " (" + $(this).find(" > transit_details > arrival_time > time_zone").text() + ")</li>";
                                             }
                                             m_summary_trans += "<li><b>Distance:</b> " + ($(this).find(" > distance > text").length ? $(this).find(" > distance > text").text() : 'unknown') + '</li>';
                                             m_summary_trans += "<li><b>Duration:</b> " + ($(this).find(" > duration > text").length ? $(this).find(" > duration > text").text() : 'unknown') + "</li>";
                                             if ($(this).find(" > travel_mode").text() === 'TRANSIT' && $(this).find(" > transit_details > line").length) {
                                                 var agency_link = $(this).find(" > transit_details > line > short_name").length ? $(this).find(" > transit_details > line > short_name").text() : "";
                                                 if ($(this).find(" > transit_details > line > url").length) {
                                                     agency_link = "<a href='" + $(this).find(" > transit_details > line >  url").text() + "' title='" + agency_link + "' target='_blank'>" + agency_link + "</a>";
                                                 }
                                                 if ($(this).find(" > transit_details > line > name").length) {
                                                    m_summary_trans += "<li><b>Line:</b> " + $(this).find(" > transit_details > line > name").text() + "</li>";
                                                 }
                                                 if (agency_link) {
                                                    m_summary_trans += "<li><b>Agency:</b> " + agency_link + "</li>";
                                                 }
                                             }
                                             m_summary_trans += '</ul>';
                                         }
                                         arr_s.forEach(function (p) {
                                              m_coord_trans.push([p.lng(), p.lat()]);
                                         });
                                         res.features.push({
                                            "type": "Feature",
                                            "geometry": {
                                                "type": "LineString",
                                                "coordinates": m_coord_trans
                                            },
                                            "properties": {
                                                "color": ROUTE_COLORS[index],
                                                "summary": m_summary_trans,
                                                "warnings": [],
                                                "waypoint_order": [],
                                                "zIndex": $(xmlDoc).find(" > route").length - index
                                            },
                                            "id": "route-" + id + "-" + index + "-" +
                                                    legind + "-" + stepind
                                        });
                                        if ($(this).find(" > start_location").length && $(this).find(" > travel_mode").text() === 'TRANSIT') {
                                            var m_address_1 = $(this).find(" > transit_details > departure_stop > name").length ? $(this).find(" > transit_details > departure_stop > name").text() : '';
                                            res.features.push({
                                                "type": "Feature",
                                                "geometry": {
                                                    "type": "Point",
                                                    "coordinates": [parseFloat($(this).find(" > start_location > lng").text()), parseFloat($(this).find(" > start_location > lat").text())]
                                                },
                                                "properties": {
                                                    "address": m_address_1,
                                                    "types": "transit_station",
                                                    "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                            (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                                    "content": '<div id="infowindow" class="infowindow"><h3>' + m_address_1 + '</h3></div>',
                                                    "zIndex": $(xmlDoc).find(" > route").length - index
                                                },
                                                "id": "route-" + id + "-" + index + "-" +
                                                    legind + "-" + stepind + "-start"
                                            });
                                        }
                                        if ($(this).find(" > start_location").length && $(this).find(" > travel_mode").text() === 'WALKING' && stepind === 0) {
                                                var m_arr_0 = com.xomena.mapRenderer.instances[id].model.getParameterValue("origin");
                                                var m_a_0 = m_arr_0.length ? m_arr_0[0] : "";
                                                res.features.push({
                                                    "type": "Feature",
                                                    "geometry": {
                                                        "type": "Point",
                                                        "coordinates": [parseFloat($(this).find(" > start_location > lng").text()), parseFloat($(this).find(" > start_location > lat").text())]
                                                    },
                                                    "properties": {
                                                        "address": m_a_0,
                                                        "types": "transit_station",
                                                        "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                                        "content": '<div id="infowindow" class="infowindow"><h3>' + m_a_0 + '</h3></div>',
                                                        "zIndex": $(xmlDoc).find(" > route").length - index
                                                    },
                                                    "id": "route-" + id + "-" + index + "-" +
                                                        legind + "-" + stepind + "-start"
                                                });
                                        }
                                        if ($(this).find(" > end_location").length && $(this).find(" > travel_mode").text() === 'TRANSIT') {
                                            var m_address_2 = $(this).find(" > transit_details > arrival_stop > name").length ? $(this).find(" > transit_details > arrival_stop > name").text() : '';
                                            res.features.push({
                                                "type": "Feature",
                                                "geometry": {
                                                    "type": "Point",
                                                    "coordinates": [parseFloat($(this).find(" > end_location > lng").text()), parseFloat($(this).find(" > end_location > lat").text())]
                                                },
                                                "properties": {
                                                    "address": m_address_2,
                                                    "types": "transit_station",
                                                    "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                            (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                                    "content": '<div id="infowindow" class="infowindow"><h3>' + m_address_2 + '</h3></div>',
                                                    "zIndex": $(xmlDoc).find(" > route").length - index
                                                },
                                                "id": "route-" + id + "-" + index + "-" +
                                                    legind + "-" + stepind + "-end"
                                            });
                                        }
                                        if ($(this).find(" > end_location").length && $(this).find(" > travel_mode").text() === 'WALKING' && stepind === m_steps_length -1) {
                                                var m_arr_1 = com.xomena.mapRenderer.instances[id].model.getParameterValue("destination");
                                                var m_a_1 = m_arr_1.length ? m_arr_1[0] : "";
                                                res.features.push({
                                                    "type": "Feature",
                                                    "geometry": {
                                                        "type": "Point",
                                                        "coordinates": [parseFloat($(this).find(" > end_location > lng").text()), parseFloat($(this).find(" > end_location > lat").text())]
                                                    },
                                                    "properties": {
                                                        "address": m_a_1,
                                                        "types": "transit_station",
                                                        "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                                                        "content": '<div id="infowindow" class="infowindow"><h3>' + m_a_1 + '</h3></div>',
                                                        "zIndex": $(xmlDoc).find(" > route").length - index
                                                    },
                                                    "id": "route-" + id + "-" + index + "-" +
                                                        legind + "-" + stepind + "-end"
                                                });
                                         }
                                     }
                                });
                            }
                        });
                    } else {
                        var arr1 = google.maps.geometry.encoding.decodePath($(this).find(" > overview_polyline > points").text());
                        _.each(arr1, function (p, ind1) {
                            m_coord.push([p.lng(), p.lat()]);
                        });
                    }
                    if (m_mode !== 'transit') {
                        res.features.push({
                            "type": "Feature",
                            "geometry": {
                                "type": "LineString",
                                "coordinates": m_coord
                            },
                            "properties": {
                                "color": ROUTE_COLORS[index],
                                "summary": '<h3>' + $(this).find(" > summary").text() + '</h3><ul>' + m_descr + '</ul>',
                                "zIndex": $(xmlDoc).find(" > route").length - index
                            },
                            "id": "route-" + id + "-" + index
                        });
                        if ($(this).find(" > leg").length) {
                            res.features.push({
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [parseFloat($(this).find(" > leg > start_location > lng")[0].textContent), parseFloat($(this).find(" > leg > start_location > lat")[0].textContent)]
                                },
                                "properties": {
                                    "icon": "image/icons/start-race-2.png",
                                    "iconSize": ICON_SIZE_32,
                                    "address": $(this).find(" > leg > start_address")[0].textContent,
                                    "zIndex": 4,
                                    "content": '<div id="infowindow" class="infowindow"><h2>' + $(this).find(" > leg > start_address")[0].textContent+"</h2><ul>" + ($(xmlDoc).find("geocoded_waypoint").length ? "<li><b>Types:</b>&nbsp;" + [].reduce.call($($(xmlDoc).find("geocoded_waypoint")[0]).find(" > type"), function(a,b){
                                        return a + (a!=="" ? ", " : "") + b.textContent;
                                    }, "") + "</li><li><b>Place ID:</b>&nbsp;" + $(xmlDoc).find("geocoded_waypoint > place_id")[0].textContent + "</li>"  : "") + "<li><b>Location:</b>&nbsp;" + $(this).find(" > leg > start_location > lat")[0].textContent + "," + $(this).find(" > leg > start_location > lng")[0].textContent + "</li></ul></div>"
                                },
                                "id": "route-" + id + "-" + index + "-start-point"
                            });
                            res.features.push({
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [parseFloat($(this).find(" > leg > end_location > lng")[$(this).find(" > leg").length-1].textContent), parseFloat($(this).find(" > leg > end_location > lat")[$(this).find(" > leg").length-1].textContent)]
                                },
                                "properties": { 
                                    "icon": "image/icons/finish2.png",
                                    "iconSize": ICON_SIZE_32,
                                    "address": $(this).find(" > leg > end_address")[$(this).find(" > leg").length-1].textContent,
                                    "zIndex": 4,
                                    "content": '<div id="infowindow" class="infowindow"><h2>' + $(this).find(" > leg > end_address")[$(this).find(" > leg").length-1].textContent+"</h2><ul>" + ($(xmlDoc).find("geocoded_waypoint").length ? "<li><b>Types:</b>&nbsp;" + [].reduce.call($($(xmlDoc).find("geocoded_waypoint")[$(xmlDoc).find("geocoded_waypoint").length - 1]).find(" > type"), function(a,b){
                                        return a + (a!=="" ? ", " : "") + b.textContent;
                                    }, "") + "</li><li><b>Place ID:</b>&nbsp;" + $(xmlDoc).find("geocoded_waypoint > place_id")[$(xmlDoc).find("geocoded_waypoint").length - 1].textContent + "</li>"  : "") + "<li><b>Location:</b>&nbsp;" + $(this).find(" > leg > end_location > lat")[$(this).find(" > leg").length-1].textContent + "," + $(this).find(" > leg > end_location > lng")[$(this).find(" > leg").length-1].textContent + "</li></ul></div>"
                                },
                                "id": "route-" + id + "-" + index + "-end-point"
                            });
                            addedStartFinish = true;
                        }
                    }
                    if ($(xmlDoc).find("bounds").length) {
                        bounds.extend(new google.maps.LatLng(parseFloat($(xmlDoc).find("bounds > northeast > lat").text()), parseFloat($(xmlDoc).find("bounds > northeast > lng").text())));
                        bounds.extend(new google.maps.LatLng(parseFloat($(xmlDoc).find("bounds > southwest > lat").text()), parseFloat($(xmlDoc).find("bounds > southwest > lng").text())));
                    }
                    m_radio_content += "<paper-radio-button name='route-" + id + "-" + index +"' class='route" + index + "'>Route " +  (index + 1) + "</paper-radio-button>";
                });
                res.bounds = bounds;
                if (m_radio_content) {
                    $("#radiogrp-" + id).html("<paper-radio-group id='route-" + id +"' allow-empty-selection>" + m_radio_content + "</paper-radio-group>");
                }
            }
            if ($(xmlDoc).find("geocoded_waypoint").length && m_mode !== 'transit') {
                var count = 0;
                $(xmlDoc).find("geocoded_waypoint").each(function (index, wp) {
                    if((addedStartFinish && (index > 0 && index < $(xmlDoc).find("geocoded_waypoint").length - 1)) || !addedStartFinish) {
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
                    }
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
        
        var m_origins = [];
        var m_destinations = [];
        
        var delayFactor = 0;
        
        function m_get_directions_route (request, index, descr, origIndex) {
            directions.route(request, function(result, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    if ($.isArray(result.routes) && result.routes.length) {
                        var route = result.routes[0];
                        m_draw_route_from_result (route, map, descr, id, index, origIndex)
                    }
                } else if (status === google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
                    delayFactor++;
                    setTimeout(function () {
                        m_get_directions_route(request, index, descr, origIndex);
                    }, delayFactor * 1200);
                } else {
                    console.log("Distance matrix route: " + status);
                    console.log(request);
                }
            });
        }
        
        function m_show_routes () {
            if (m_origins.length && m_destinations.length) {
                var m_avoid_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("avoid");
                var m_avoid = m_avoid_arr.length ? m_avoid_arr[0] : null;
                
                var m_radio_content = "";
                
                m_origins.forEach(function(orig, origIndex) {
                    m_destinations.forEach(function(dest, destIndex) {
                        var req = {
                            origin: {
                              placeId: orig.place_id  
                            },
                            destination: {
                              placeId: dest.place_id  
                            },
                            travelMode: m_getTravelMode(id),
                            avoidFerries: m_avoid === "ferries",
                            avoidHighways: m_avoid === "highways",
                            avoidTolls: m_avoid === "tolls",
                            provideRouteAlternatives: false,
                            unitSystem: m_getUnitSystem(id),
                            drivingOptions: m_getDrivingOptions(id),
                            transitOptions: m_getTransitOptions(id)
                        };
                        var m_descr = "<h3>"+orig.formatted_address+ " - " + dest.formatted_address + "</h3><ul>";
                        if (data.rows && $.isArray(data.rows) && data.rows.length) {
                            var m_row = data.rows[origIndex];
                            if (m_row) {
                                if (m_row.elements && $.isArray(m_row.elements) && m_row.elements.length) {
                                    var m_element = m_row.elements[destIndex];
                                    if (m_element && m_element.status === "OK") {
                                        m_descr += "<li><b>Distance:</b>&nbsp;" + m_element.distance.text + "</li><li><b>Duration:</b>&nbsp;" + m_element.duration.text + "</li>"; 
                                    }
                                }
                            }
                        }
                        m_descr += "</ul>";
                        
                        var m_index = destIndex + origIndex * m_destinations.length;
                        
                        m_radio_content += "<paper-radio-button name='distance-matrix-route-" + id + "-" + m_index + "' class='route" + (origIndex % 4) + "'> " +  orig.formatted_address+ " - " + dest.formatted_address + "</paper-radio-button>";
                        
                        m_get_directions_route(req, m_index, m_descr, origIndex);
                    });
                });
                
                if (m_radio_content) {
                    $("#radiogrp-" + id).html("<paper-radio-group id='distance-matrix-route-" + id +"' allow-empty-selection>" + m_radio_content + "</paper-radio-group>");
                }
            } 
        }
        
        function m_callback_o (results, status) {
          respCount++;
          if (status === google.maps.GeocoderStatus.OK) {
            m_add_address_to_map(results[0], map, ICON_URL);
            m_origins.push(results[0]);  
          }
          if (respCount === total) {
            m_adjust_bounds(map);
            m_show_routes();  
          }
        }
        
        function m_callback_d (results, status) {
          respCount++;
          if (status === google.maps.GeocoderStatus.OK) {
            m_add_address_to_map(results[0], map, ICON_URL_PINK);
            m_destinations.push(results[0]);
          }
          if (respCount === total) {
            m_adjust_bounds(map);
            m_show_routes();  
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

        var m_toadd = [];
        var m_polylines_toadd = [];
        var m_async_proc = Object.create(null);

        function m_add_marker_to_map (loc, options) {
            map.data.add(new google.maps.Data.Feature({
                geometry: loc,
                "properties": {
                    "icon": options.icon ? options.icon : ICON_URL,
                    "iconSize": options.iconSize? options.iconSize: ICON_SIZE_32,
                    "zIndex": 2,
                    "visible": "visible" in options ? options.visible : true
                }
            }));
        }

        function m_add_polylines_to_map () {
            m_polylines_toadd.forEach(function (polyline) {
               if (polyline.points.length) {
                   map.data.add({
                        geometry: polyline.fillcolor ? new google.maps.Data.Polygon([polyline.points]): new google.maps.Data.LineString(polyline.points),
                        properties: {
                            "color": polyline.color,
                            "opacity": 0.5,
                            "weight": polyline.weight,
                            "fillcolor": polyline.fillcolor,
                            "fillopacity": 0.5,
                            "geodesic": polyline.geodesic
                        }
                   });
               }
            });
        }

        function m_resolve_marker_callback (location, index, options) {
            if (reLatLng.test(location)) {
                var _ll1 = location.split(',');
                if (_ll1.length > 1) {
                    m_add_marker_to_map({
                        lat: parseFloat(_ll1[0]),
                        lng: parseFloat(_ll1[1])
                    }, options);
                }
            } else {
                m_async_proc["marker:" + index] = false;
                geocoder.geocode({
                    address: location
                }, function (results, status) {
                    m_async_proc["marker:" + index] = true;
                    if (status === google.maps.GeocoderStatus.OK) {
                        m_add_marker_to_map(results[0].geometry.location, options);
                    }
                });
            }
        }

        function m_resolve_visible_callback (location, index) {
            if (reLatLng.test(location)) {
                var _ll1 = location.split(',');
                if (_ll1.length > 1) {
                    m_add_marker_to_map({
                        lat: parseFloat(_ll1[0]),
                        lng: parseFloat(_ll1[1])
                    }, {visible: false});
                }
            } else {
                m_async_proc["visible:" + index] = false;
                geocoder.geocode({
                    address: location
                }, function (results, status) {
                    m_async_proc["visible:" + index] = true;
                    if (status === google.maps.GeocoderStatus.OK) {
                        m_add_marker_to_map(results[0].geometry.location, {visible: false});
                    }
                });
            }
        }

        function m_resolve_point_callback (point, ind, index) {
            if (reLatLng.test(point)) {
                var _ll2 = point.split(',');
                if (_ll2.length > 1) {
                    m_polylines_toadd[index].points[ind] = new google.maps.LatLng(parseFloat(_ll2[0]),parseFloat(_ll2[1]));
                }
            } else {
                m_async_proc["polyline:" + index + ":" + ind] = false;
                geocoder.geocode({
                    address: point
                }, function (results, status) {
                    m_async_proc["polyline:" + index + ":" + ind] = true;
                    if (status === google.maps.GeocoderStatus.OK) {
                        m_polylines_toadd[index].points[ind] = results[0].geometry.location;
                    }
                });
            }
        }

        function m_is_finished_async() {
            var res = true;
            Object.getOwnPropertyNames(m_async_proc).forEach(function (p) {
                res = res && m_async_proc[p];
            });
            return res;
        }

        window.com.xomena.mapRenderer.clearMap(id);

        var m_center = com.xomena.mapRenderer.instances[id].model.getParameterValue("center");
        if($.isArray(m_center) && m_center.length) {
            if (reLatLng.test($.trim(m_center[0]))) {
                var _ll = $.trim(m_center[0]).split(',');
                if (_ll.length > 1) {
                    map.setCenter({
                        lat: parseFloat(_ll[0]),
                        lng: parseFloat(_ll[1])
                    });
                }
            } else {
                m_async_proc["center"] = false;
                geocoder.geocode({
                    address: $.trim(m_center[0])
                }, function (results, status) {
                    m_async_proc["center"] = true;
                    if (status === google.maps.GeocoderStatus.OK) {
                        map.setCenter(results[0].geometry.location);
                    }
                });
            }
        }
        var m_zoom = com.xomena.mapRenderer.instances[id].model.getParameterValue("zoom");
        if($.isArray(m_zoom) && m_zoom.length) {
            map.setZoom(Number(m_zoom[0]));
        }
        var m_type = com.xomena.mapRenderer.instances[id].model.getParameterValue("maptype");
        if($.isArray(m_type) && m_type.length) {
            map.setMapTypeId(m_type[0]);
        }

        var m_markers = com.xomena.mapRenderer.instances[id].model.getParameterValue("markers");
        if($.isArray(m_markers) && m_markers.length) {
            m_markers.forEach(function (marker) {
                var m_size, m_color, m_label, m_icon, m_locations;
                marker.forEach(function (element) {
                    if (element.startsWith("size:")) {
                        m_size = element.replace("size:", "");
                    } else if (element.startsWith("color:")) {
                        m_color = element.replace("color:", "");
                    } else if (element.startsWith("label:")) {
                        m_label = element.replace("label:", "");
                    } else if (element.startsWith("icon:")) {
                        m_icon = element.replace("icon:", "");
                    } else if (element.startsWith("locations:")) {
                        m_locations = element.replace("locations:", "");
                    }
                });
                if (m_locations) {
                    var a_locations = m_locations.split("|");
                    a_locations.forEach(function (loc) {
                        m_toadd.push({
                            size: m_size ? m_size : null,
                            color: m_color ? m_color : null,
                            label: m_label ? m_label : null,
                            icon: m_icon ? m_icon : null,
                            location: $.trim(loc)
                        });
                    });
                }
            });
        }

        if (m_toadd.length) {
            m_toadd.forEach(function (m, ii) {
                var _options = {};
                if (m.size) {
                    switch (m.size) {
                        case "tiny":
                            _options.iconSize = ICON_SIZE_16;
                            break;
                        case "small":
                            _options.iconSize = ICON_SIZE_24;
                            break;
                        case "mid":
                            _options.iconSize = ICON_SIZE_32;
                            break;
                    }
                }
                if (m.icon) {
                    _options.icon = m.icon;
                }
                if (m.color) {
                    _options.color = m.color;
                }
                if (m.label) {
                    _options.label = m.label;
                }
                m_resolve_marker_callback (m.location, ii, _options);
            });
        }

        var m_paths = com.xomena.mapRenderer.instances[id].model.getParameterValue("path");
        if($.isArray(m_paths) && m_paths.length) {
            m_paths.forEach(function (path, index) {
                var m_weight, m_color, m_fillcolor, m_geodesic, m_points;
                path.forEach(function (element) {
                    if (element.startsWith("weight:")) {
                        m_weight = element.replace("weight:", "");
                    } else if (element.startsWith("color:")) {
                        m_color = element.replace("color:", "");
                    } else if (element.startsWith("fillcolor:")) {
                        m_fillcolor = element.replace("fillcolor:", "");
                    } else if (element.startsWith("geodesic:")) {
                        m_geodesic = element.replace("geodesic:", "");
                    } else if (element.startsWith("points:")) {
                        m_points = element.replace("points:", "");
                    }
                });
                m_polylines_toadd[index] = {
                    weight: m_weight,
                    color: m_color,
                    fillcolor: m_fillcolor,
                    geodesic: m_geodesic,
                    points: []
                };
                if (m_points) {
                    if (m_points.startsWith("enc:")) {
                        m_points = m_points.replace("enc:", "");
                        m_polylines_toadd[index].points = google.maps.geometry.encoding.decodePath(m_points);
                    } else {
                        var a_points = m_points.split("|");
                        a_points.forEach(function (point, ind) {
                            m_resolve_point_callback(point, ind, index);
                        });
                    }
                }
            });
        }

        var m_visible = com.xomena.mapRenderer.instances[id].model.getParameterValue("visible");
        if($.isArray(m_visible) && m_visible.length) {
            m_visible.forEach(function (loc, ind) {
                 m_resolve_visible_callback(loc, ind);
            });
        }

        var m_styles = com.xomena.mapRenderer.instances[id].model.getParameterValue("style");
        if($.isArray(m_styles) && m_styles.length) {
            var stylesArray = [];
            m_styles.forEach(function (style, index) {
                var m_feature, m_element, m_color, m_hue, m_lightness, m_saturation, m_gamma, m_visibility, m_invert_lightness;
                style.forEach(function (element) {
                    if (element.startsWith("feature:")) {
                        m_feature = element.replace("feature:", "");
                    } else if (element.startsWith("element:")) {
                        m_element = element.replace("element:", "");
                    } else if (element.startsWith("color:")) {
                        m_color = element.replace("color:", "").replace("0x", "#");
                    } else if (element.startsWith("hue:")) {
                        m_hue = element.replace("hue:", "").replace("0x", "#");
                    } else if (element.startsWith("lightness:")) {
                        m_lightness = element.replace("lightness:", "");
                    } else if (element.startsWith("invert_lightness:")) {
                        m_invert_lightness = element.replace("invert_lightness:", "");
                    } else if (element.startsWith("saturation:")) {
                        m_saturation = element.replace("saturation:", "");
                    } else if (element.startsWith("gamma:")) {
                        m_gamma = element.replace("gamma:", "");
                    } else if (element.startsWith("visibility:")) {
                        m_visibility = element.replace("visibility:", "");
                    }
                });
                if (m_feature || m_element || m_color || m_visibility || m_hue || m_lightness ||
                    m_saturation || m_gamma || m_invert_lightness) {
                    var _stylers = [];
                    var _style = {};
                    if (m_color) {
                        _stylers.push({color: m_color});
                    }
                    if (m_hue) {
                        _stylers.push({hue: m_hue});
                    }
                    if (m_lightness) {
                        _stylers.push({lightness: m_lightness});
                    }
                    if (m_invert_lightness) {
                        _stylers.push({invert_lightness: m_invert_lightness});
                    }
                    if (m_saturation) {
                        _stylers.push({saturation: m_saturation});
                    }
                    if (m_gamma) {
                        _stylers.push({gamma: m_gamma});
                    }
                    if (m_visibility) {
                        _stylers.push({visibility: m_visibility});
                    }
                    if (m_feature) {
                        _style.featureType = m_feature;
                    }
                    if (m_element) {
                        _style.elementType = m_element;
                    }
                    _style.stylers = _stylers;
                    stylesArray.push(_style);
                }
            });
            if (stylesArray.length) {
                map.setOptions({styles: stylesArray});
            }
        }

        var asyncElapsed = 0;
        var intHandler = window.setInterval(function () {
            asyncElapsed += 100;
            //debugger;
            if (m_is_finished_async()) {
                window.clearInterval(intHandler);
                m_polylines_toadd.forEach(function (polyline, ind, arr) {
                    if (polyline.points.length) {
                        arr[ind].points = polyline.points.filter(function (e) {
                           return e && e instanceof google.maps.LatLng;
                        });
                    }
                });
                m_add_polylines_to_map();
                m_adjust_bounds(map);
            } else if (asyncElapsed > 30000) {
                window.clearInterval(intHandler);
                m_adjust_bounds(map);
            }
        }, 100);

        return null;
    }

    /**
     * Parse Street View data
     * @param {Object} data Data from render map instance view call
     * @param {google.maps.Map} map   The instance of the map
     * @param {String} id    The ID of web service instance
     * @returns {Object} GeoJSON object
     */
    function m_parseStreetView (data, map, id) {

        var m_async_proc = Object.create(null);
        var streetViewContainer = map.getStreetView();

        function m_add_marker_to_map (loc, options) {
            map.data.add(new google.maps.Data.Feature({
                geometry: loc,
                "properties": {
                    "icon": options.icon ? options.icon : ICON_URL,
                    "iconSize": options.iconSize? options.iconSize: ICON_SIZE_32,
                    "zIndex": 2,
                    "visible": "visible" in options ? options.visible : true
                }
            }));
            streetViewContainer.setPosition(loc);
        }

        function m_resolve_marker_callback (location, options) {
            if (reLatLng.test(location)) {
                var _ll1 = location.split(',');
                if (_ll1.length > 1) {
                    m_add_marker_to_map({
                        lat: parseFloat(_ll1[0]),
                        lng: parseFloat(_ll1[1])
                    }, options);
                }
            } else {
                m_async_proc["marker"] = false;
                geocoder.geocode({
                    address: location
                }, function (results, status) {
                    m_async_proc["marker"] = true;
                    if (status === google.maps.GeocoderStatus.OK) {
                        m_add_marker_to_map(results[0].geometry.location, options);
                    }
                });
            }
        }

        function m_is_finished_async() {
            var res = true;
            Object.getOwnPropertyNames(m_async_proc).forEach(function (p) {
                res = res && m_async_proc[p];
            });
            return res;
        }

        window.com.xomena.mapRenderer.clearMap(id);

        var m_location = com.xomena.mapRenderer.instances[id].model.getParameterValue("location");
        if($.isArray(m_location) && m_location.length) {
            m_resolve_marker_callback (m_location[0], {
                iconSize: ICON_SIZE_32
            });
        }

        var m_pano = com.xomena.mapRenderer.instances[id].model.getParameterValue("pano");
        if($.isArray(m_pano) && m_pano.length) {
            streetViewContainer.setPano(m_pano[0]);
        }

        var m_pov = Object.create(null);
        var m_heading = com.xomena.mapRenderer.instances[id].model.getParameterValue("heading");
        if($.isArray(m_heading) && m_heading.length) {
            m_pov.heading = Number(m_heading[0]);
        }

        var m_pitch = com.xomena.mapRenderer.instances[id].model.getParameterValue("pitch");
        if($.isArray(m_pitch) && m_pitch.length) {
            m_pov.pitch = Number(m_pitch[0]);
        }

        if (Object.getOwnPropertyNames(m_pov).length) {
            streetViewContainer.setPov(m_pov);
        }

        var asyncElapsed = 0;
        var intHandler = window.setInterval(function () {
            asyncElapsed += 100;
            //debugger;
            if (m_is_finished_async()) {
                window.clearInterval(intHandler);
                m_adjust_bounds(map);
                streetViewContainer.setVisible(true);
            } else if (asyncElapsed > 30000) {
                window.clearInterval(intHandler);
                m_adjust_bounds(map);
            }
        }, 100);

        return null;
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
                case "LineString":
                    feature.getGeometry().getArray().forEach(function (latlng) {
                       bounds.extend(latlng);
                    });
                    break;
                case "Polygon":
                    feature.getGeometry().getArray().forEach(function (ring) {
                        ring.getArray().forEach( function (latlng) {
                            bounds.extend(latlng);
                        });
                    });
                    break;
            }
        });
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
        }
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
        var m_counter = 0;
        
        var m_process_path_value = function (p) {
            if (p) {
                var m_points = p.split("|");
                if($.isArray(m_points) && m_points.length){
                    m_points.forEach(function(pp) {
                        if (reLatLng.test(pp)) {
                            var m_arr = pp.split(",");
                            var m_loc = new google.maps.LatLng(parseFloat(m_arr[0]), parseFloat(m_arr[1]));
                            map.data.add(new google.maps.Data.Feature({
                                geometry: m_loc,
                                id: "point-" +m_counter + "-" +id,
                                "properties": {
                                    "address": pp,
                                    "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                                (m_counter < ICON_LABELS.length ? ICON_LABELS.charAt(m_counter) : "blu-blank") + ".png"
                                }
                            }));
                            m_counter++;
                        }    
                    });
                }
            }
        };
        
        if (window.com.xomena.mapRenderer.instances[id] &&
            window.com.xomena.mapRenderer.instances[id].model) {
            var m_service = window.com.xomena.mapRenderer.instances[id].model.get("webservice");
            if(m_service){
                var m_services = window.com.xomena.mapRenderer.instances[id].model.get("services");
                var service = m_services.filterById(parseInt(m_service));
                if($.isArray(service) && service.length){
                    var m_latlng = null;
                    switch(service[0].get("name")){
                        case "Snap to Road":
                        case "Speed Limits":  
                            m_latlng = window.com.xomena.mapRenderer.instances[id].model.getParameterValue("path");
                            break;
                        case "Nearest Roads":
                            m_latlng = window.com.xomena.mapRenderer.instances[id].model.getParameterValue("points");
                            break;
                        default:
                            break;
                    }
                    if($.isArray(m_latlng) && m_latlng.length) {
                        _.each(m_latlng, function(p, ind) {
                            m_process_path_value(p, ind);
                        });
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
            if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                console.log(place_res);
            }
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
            id: point.placeId + (point.originalIndex!==null ? "--"+(point.originalIndex+1) : ""),
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
    
    /**
     * Returns Travel mode for given instance of distance matrix / directions
     * @param   {String} id Id of the instance
     * @returns {google.maps.TravelMode} Travel mode
     */
    function m_getTravelMode(id) {
        var m_mode_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("mode");
        var m_mode = m_mode_arr.length ? m_mode_arr[0] : "driving";
        switch(m_mode) {
            case "driving":
                return google.maps.TravelMode.DRIVING;
            case "walking":
                return google.maps.TravelMode.WALKING;
            case "bicycling":
                return google.maps.TravelMode.BICYCLING;
            case "transit":
                return google.maps.TravelMode.TRANSIT;
            default:
                return google.maps.TravelMode.DRIVING;
        }
    }
            
    /**
     * Returns Unit system for given instance of distance matrix / directions
     * @param   {String} id Id of the instance
     * @returns {google.maps.UnitSystem} Unit system
     */
    function m_getUnitSystem(id) {
        var m_units_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("units");
        var m_units = m_units_arr.length ? m_units_arr[0] : "metric"; 
        switch(m_units) {
            case "metric":
                return google.maps.UnitSystem.METRIC;
            case "imperial":
                return google.maps.UnitSystem.IMPERIAL;
            default:
                return google.maps.UnitSystem.METRIC;
        }
    }
            
    /**
     * Returns Driving options for given instance of distance matrix / directions
     * @param   {String} id Id of the instance
     * @returns {google.maps.DrivingOptions} Driving options
     */
    function m_getDrivingOptions(id) {
        var m_mode_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("mode");
        var m_mode = m_mode_arr.length ? m_mode_arr[0] : "driving";
        if (m_mode === "driving") {
            var m_departure_time_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("departure_time");
            var m_departure_time = m_departure_time_arr.length ? m_departure_time_arr[0] : null;
            return {
                departureTime: (m_departure_time === null || m_departure_time === "now") ? new Date() : new Date(parseInt(m_departure_time)*1000),
                trafficModel: m_getTrafficModel(id)
            };    
        } else {
            return null;
        }
    }    
            
    /**
     * Returns Traffic model for given instance of distance matrix / directions
     * @param   {String} id Id of the instance
     * @returns {google.maps.TrafficModel} Traffic model
     */
    function m_getTrafficModel(id) {
        var m_traffic_model_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("traffic_model");
        var m_traffic_model = m_traffic_model_arr.length ? m_traffic_model_arr[0] : null;
        switch(m_traffic_model) {
            case "best_guess":
                return google.maps.TrafficModel.BEST_GUESS;
            case "pessimistic":
                return google.maps.TrafficModel.PESSIMISTIC;
            case "optimistic":
                return google.maps.TrafficModel.OPTIMISTIC;
            default:
                return google.maps.TrafficModel.BEST_GUESS;
        }
    }
            
    /**
     * Returns Transit options for given instance of distance matrix / directions
     * @param   {String} id Id of the instance
     * @returns {google.maps.TransitOptions} Transit options
     */
    function m_getTransitOptions(id) {
        var m_mode_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("mode");
        var m_mode = m_mode_arr.length ? m_mode_arr[0] : "driving";
        if (m_mode === "transit") {
            var m_departure_time_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("departure_time");
            var m_departure_time = m_departure_time_arr.length ? m_departure_time_arr[0] : null;
            var m_arrival_time_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("arrival_time");
            var m_arrival_time = m_arrival_time_arr.length ? m_arrival_time_arr[0] : null;
            return {
                arrivalTime: m_arrival_time !== null ? new Date(parseInt(m_arrival_time)*1000) : null,
                departureTime: m_departure_time !== null ? (m_departure_time === "now" ? new Date() : new Date(parseInt(m_departure_time)*1000)) : null,
                modes: m_getTransitModes(id),
                routingPreference: m_getTransitRoutePreference(id)
            };    
        } else {
            return null;
        }
    } 
            
    /**
     * Returns Transit modes for given instance of distance matrix / directions
     * @param   {String} id Id of the instance
     * @returns {Array<google.maps.TransitMode>} Transit modes
     */
    function m_getTransitModes(id) {
        var m_transit_mode_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("transit_mode");
        var res = [];
        if ($.isArray(m_transit_mode_arr) && m_transit_mode_arr.length) {
            m_transit_mode_arr.forEach(function (m_transit_mode) {
                switch(m_transit_mode) {
                    case "bus":
                        res.push(google.maps.TransitMode.BUS);
                        break;
                    case "subway":
                        res.push(google.maps.TransitMode.SUBWAY);
                        break;
                    case "train":
                        res.push(google.maps.TransitMode.TRAIN);
                        break;
                    case "tram":
                        res.push(google.maps.TransitMode.TRAM);
                        break;
                    case "rail":
                        res.push(google.maps.TransitMode.RAIL);
                        break;
                    default:
                        break;
                }        
            });
        }
        return res;
    }
        
    /**
     * Returns Routing preference for given instance of distance matrix / directions
     * @param   {String} id Id of the instance
     * @returns {google.maps.TransitRoutePreference} Transit routing preference
     */
    function m_getTransitRoutePreference(id) {
        var m_transit_routing_preference_arr = com.xomena.mapRenderer.instances[id].model.getParameterValue("transit_routing_preference");
        var m_transit_routing_preference = m_transit_routing_preference_arr.length ? m_transit_routing_preference_arr[0] : null;
        switch(m_transit_routing_preference) {
            case "less_walking":
                return google.maps.TransitRoutePreference.LESS_WALKING;
            case "fewer_transfers":
                return google.maps.TransitRoutePreference.FEWER_TRANSFERS;
            default:
                return null;
        }
    } 
    
    /**
     * Draws route for distance matrix visualization 
     * @param {google.maps.DirectionsRoute} route Route obtained from the DirectionsResult
     * @param {google.maps.Map} The instance of map
     * @param {String} Description of the route
     * @param {String} Id of the web service request instance
     * @param {Number} Index of route
     * @param {Number} Index of origin                      
     */
    function m_draw_route_from_result (route, map, descr, id, index, origIndex) {
        var m_coord = [];
        if (route.legs && _.isArray(route.legs) && route.legs.length) {
            route.legs.forEach(function (leg, indleg) {
                if (leg.steps && _.isArray(leg.steps) && leg.steps.length) {
                    leg.steps.forEach(function (step, indstep) {
                        if (step.path && step.path.length) {
                            step.path.forEach(function (p) {
                                m_coord.push(p);
                            });
                        }
                    });
                }
            });
        } 
        map.data.add(new google.maps.Data.Feature({
            geometry: new google.maps.Data.LineString(m_coord),
            id: "distance-matrix-route-" + id + "-" + index,
            "properties": {
                "color": ROUTE_COLORS[origIndex % 4],
                "summary": descr,
                "warnings": route.warnings,
                "waypoint_order": route.waypoint_order,
                "zIndex": 4
            }
        }));
    }

})(window, jQuery, _);