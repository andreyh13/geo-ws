window.com = window.com || {};
window.com.xomena = window.com.xomena || {};

window.com.xomena.geo = {
  Models: {},
  Collections: {},
  Views: {},
  Router: {},
  services: null    
};

/*Define data models*/
com.xomena.geo.Models.WebService = Backbone.Model.extend({
    defaults: {
        name: '',
        alias: '',
        basepath: 'http://maps.googleapis.com/maps/api/',
        output: ["json", "xml"],
        parameters: null
    },
    validate: function(attrs, options){
    }
});
    
com.xomena.geo.Models.Parameter = Backbone.Model.extend({
    defaults: {
        name: '',
        type: 'string',
        description: '',
        required: false,
        parts: null,
        options: '',
        multiple: false,
        separator: '|'
    }
}); 
    
com.xomena.geo.Models.ParameterPart = Backbone.Model.extend({
    defaults: {
        name: '',
        type: 'string',
        description: '',
        required: false,
        options: '',
        multiple: false,
        separator: ':'
    }
});  

com.xomena.geo.Models.Instance = Backbone.Model.extend({
    defaults: {
        webservices: null,
        current_ws: null
    },
    validate: function(attrs, options){
    }
});

/*Define data collections*/
com.xomena.geo.Collections.ParameterPartCollection = Backbone.Collection.extend({
  model: com.xomena.geo.Models.ParameterPart
});

com.xomena.geo.Collections.ParameterCollection = Backbone.Collection.extend({
  model: com.xomena.geo.Models.Parameter
});

com.xomena.geo.Collections.WebServiceCollection = Backbone.Collection.extend({
  model: com.xomena.geo.Models.WebService
});

com.xomena.geo.Collections.InstanceCollection = Backbone.Collection.extend({
  model: com.xomena.geo.Models.Instance
});

com.xomena.geo.services = new com.xomena.geo.Collections.WebServiceCollection();


(function($){
    var WS_DS_URI = "https://script.google.com/macros/s/AKfycbwPrEGcNZfsQEWmKm_XC-IXdEPdIQdIE1Na8pL4uBprm2YIT8E/exec?jsonp=?";
    
    function initParameterParts(par, parts_url){
        $.ajax({
            url: parts_url,
            dataType: 'jsonp',
            success: function(data) {
                var partscol = new com.xomena.geo.Collections.ParameterPartCollection();
                for (var i = 1; i < data.length; i++) {
                    var part = new com.xomena.geo.Models.ParameterPart({
                        name: data[i][0],
                        type: data[i][1],
                        description: data[i][2],
                        required: data[i][3],
                        options: data[i][4],
                        multiple: data[i][5]
                    });
                    partscol.add(part);
                }
                par.set('parts', partscol);
            }
        });    
    }
    
    function initParameters(wserv, params_url){
        $.ajax({
            url: params_url,
            dataType: 'jsonp',
            success: function(data) {
                var parcol = new com.xomena.geo.Collections.ParameterCollection();
                for (var i = 1; i < data.length; i++) {
                    var par = new com.xomena.geo.Models.Parameter({
                        name: data[i][0],
                        type: data[i][1],
                        description: data[i][2],
                        required: data[i][3],
                        options: data[i][5],
                        multiple: data[i][6]
                    });
                    if(data[i][4]){
                        //Init parameter parts
                        initParameterParts(par, data[i][4]+'?jsonp=?');
                    }
                    parcol.add(par);
                }
                wserv.set('parameters', parcol);
            }
        });    
    } 
    
    $.ajax({
        url: WS_DS_URI,
        dataType: 'jsonp',
        success: function(data) {
            for (var i = 1; i < data.length; i++) {
                var wserv = new com.xomena.geo.Models.WebService({name: data[i][0], alias: data[i][1]});
                if(data[i][2]){
                    //Init parameters
                    initParameters(wserv, data[i][2]+'?jsonp=?');
                }
                com.xomena.geo.services.add(wserv);
            }
        }
    });

})(jQuery);