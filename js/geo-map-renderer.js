(function (window, $, _) {
    'use strict';

    var ICON_URL = "http://maps.google.com/mapfiles/kml/paddle/blu-blank.png",
        ICON_LABELS = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        ICON_ARROW = "http://www.google.com/mapfiles/arrow.png",
        ICON_ARROW_SHADOW = "http://www.google.com/mapfiles/arrowshadow.png",
        infoWindow = null;

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
            if (this.instances[model.get("id")].map) {
                //Define styles for data layer features
                this.instances[model.get("id")].map.data.setStyle(function (feature) {
                    var m_icon = feature.getProperty("icon"),
                        m_address = feature.getProperty("address");

                    var style = {
                        icon: {
                            url: m_icon ? m_icon : ICON_URL,
                            scaledSize: new google.maps.Size(32, 32)
                        },
                        title: m_address ? m_address : "",
                        visible: true
                    };

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
            this.clearMap(id);
            var m_strategy = this.getStrategy(id),
                m_map = this.getMap(id),
                m_data = this.getData(id),
                m_format = this.getFormat(id),
                m_geoJSON = null;
            if (m_strategy && m_map && m_data && m_format) {
                m_geoJSON = m_strategy.getGeoJSON(m_data, m_format);
                if (m_geoJSON) {
                    //Lets add additional features
                    this.addAdditionalFeatures(id, m_geoJSON);
                    m_map.data.addGeoJson(m_geoJSON);
                    if(m_geoJSON.bounds && m_geoJSON.bounds instanceof google.maps.LatLngBounds){
                        m_map.fitBounds(m_geoJSON.bounds);
                    }
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
                        }
                    }
                }
            }
        }
    };

    /**
     * Prototype function of the Strategy to get GeoJSON
     * @param   {Object} data  Data from the web service (JSON object or XML string)
     * @param   {String} format Format ("json", "xml")
     * @returns {Object} GeoJSON object
     */
    window.com.xomena.mapRenderer.Strategy.prototype.getGeoJSON = function (data, format) {
        switch (format) {
        case "json":
            return this.m_getGeoJSON_JSON(data);
        case "xml":
            return this.m_getGeoJSON_XML(data);
        }
    };

    /**
     * Prototype function of the Strategy to get GeoJSON from JSON data
     * @param   {Object} data Data from the web service (JSON object)
     * @returns {Object} GeoJSON object
     */
    window.com.xomena.mapRenderer.Strategy.prototype.m_getGeoJSON_JSON = function (data) {
        switch (this.type) {
        case "geocode":
            return m_parseGeocodeJSON(data);
        case "directions":
            break;
        case "distancematrix":
            break;
        case "elevation":
            break;
        case "timezone":
            break;
        case "places_search":
            break;
        case "places_detail":
            break;
        case "places_autocomplete":
            break;
        case "roads":
            break;
        case "speed":
            break;
        }
        return null;
    };

    /**
     * Prototype function of the Strategy to get GeoJSON from XML string
     * @param   {String} data Data from the web service (XML string)
     * @returns {Object} GeoJSON object
     */
    window.com.xomena.mapRenderer.Strategy.prototype.m_getGeoJSON_XML = function (data) {
        switch (this.type) {
        case "geocode":
            return m_parseGeocodeXML(data);
        case "directions":
            break;
        case "distancematrix":
            break;
        case "elevation":
            break;
        case "timezone":
            break;
        case "places_search":
            break;
        case "places_detail":
            break;
        case "places_autocomplete":
            break;
        case "roads":
            break;
        case "speed":
            break;
        }
        return null;
    };

    window.com.xomena.strategies = {
        GeocodeRender:  new window.com.xomena.mapRenderer.Strategy("geocode"),
        DirectionsRender: new window.com.xomena.mapRenderer.Strategy("directions"),
        DistanceMatrixRender: new window.com.xomena.mapRenderer.Strategy("distancematrix"),
        ElevationRender: new window.com.xomena.mapRenderer.Strategy("elevation"),
        TimezoneRender: new window.com.xomena.mapRenderer.Strategy("timezone"),
        PlacesSearchRender: new window.com.xomena.mapRenderer.Strategy("places_search"),
        PlacesDetailRender: new window.com.xomena.mapRenderer.Strategy("places_detail"),
        PlacesAutocompleteRender: new window.com.xomena.mapRenderer.Strategy("places_autocomplete"),
        RoadsRender: new window.com.xomena.mapRenderer.Strategy("roads"),
        SpeedRender: new window.com.xomena.mapRenderer.Strategy("speed")
    };

    /**
     * Parse JSON data from Geocoding API
     * @param {Object} data Data from the web service (JSON object)
     * @returns {Object} GeoJSON object
     */
    function m_parseGeocodeJSON (data) {
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
                            "icon": "http://maps.google.com/mapfiles/kml/paddle/" +
                                (index < ICON_LABELS.length ? ICON_LABELS.charAt(index) : "blu-blank") + ".png",
                            "content": m_info_window_content_address(elem)
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
     * Parse XML data from Geocoding API
     * @param {String} data Data from the web service (XML string)
     * @returns {Object} GeoJSON object
     */
    function m_parseGeocodeXML (data) {
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
                            m_sw_lat, m_sw_lng, m_ne_lat, m_ne_lng,
                            fa_node = node.getElementsByTagName("formatted_address"),
                            t_nodes = node.getElementsByTagName("type"),
                            pl_node = node.getElementsByTagName("place_id"),
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
                                        place_id: m_place_id
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
                '<li>Location type: ' + elem.geometry.location_type + '</li>' +
                '<li>Types: ' + elem.types.join(",") + '</li>' +
                '<li>Place ID: ' + elem.place_id + '</li>' +
                '<li>Location: ' + elem.geometry.location.lat + ',' + elem.geometry.location.lng + '</li>' +
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
})(window, jQuery, _);
