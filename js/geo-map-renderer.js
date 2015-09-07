(function (window, $) {
    'use strict';
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
            this.instances[model.get("id")] = {
                model: model,
                data: data,
                map: document.querySelector('#t-' + model.get("id")).map
            };
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

        getFormat: function (id) {
            var m_format = null;
            if (this.instances[id] && this.instances[id].model) {
                m_format = this.instances[id].model.get("output");
            }
            return m_format;
        },

        getData: function (id) {
            var m_data = null;
            if (this.instances[id] && this.instances[id].data) {
                m_data = this.instances[id].data;
            }
            return m_data;
        },

        getMap: function (id) {
            var m_map = null;
            if (this.instances[id] && this.instances[id].map) {
                m_map = this.instances[id].map;
            }
            return m_map;
        },

        Strategy: function (type) {
            this.type = type;
        }
    };

    window.com.xomena.mapRenderer.Strategy.prototype.getGeoJSON = function () {
        return null;
    };

    window.com.xomena.strategies = {
        GeocodeRender: {
            getGeoJSON: function (data, format) {
                switch (format) {
                case "json":
                    return this.m_getGeoJSON_JSON(data);
                case "xml":
                    return this.m_getGeoJSON_XML(data);
                }
            },

            m_getGeoJSON_JSON: function (data) {
                //TODO: implement
            },

            m_getGeoJSON_XML: function (data) {
                //TODO: implement
            }
        }

    };
})(window, jQuery);
