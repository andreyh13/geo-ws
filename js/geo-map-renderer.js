function MapRenderer(map, data, format, service) {
    'use strict';
    this.map = map;
    this.data = data;
    this.format = format;
    this.service = service;
}

MapRenderer.prototype.renderMap = function () {
    if(!this.map) return;
    this.clearMap();

}

MapRenderer.prototype.clearMap = function () {
    if(!this.map) return;
    //TODO: implement logic
}
