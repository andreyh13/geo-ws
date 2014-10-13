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
        id: null,
        webservice: null,
        version: null,
        output: null,
        parameters: null
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

/*Define views*/
com.xomena.geo.Views.InstanceView = Backbone.View.extend({
  tagName: 'li', // defaults to div if not specified
  className: 'ws-instance', // optional, can also set multiple 
  execInstance: function(){
    console.log("Start execution for instance #"+this.model.get("id"));
    return false;  
  },
  deleteInstance: function(){
    console.log("Delete instance #"+this.model.get("id"));  
    this.model.destroy(); // deletes the model when delete button clicked
    return false;  
  },    
  events: {
    'click .exec':   'execInstance',
    'click .delete': 'deleteInstance'
  },
  newTemplate: _.template($('#instanceTemplate').html()), // external template    
  initialize: function() {
    this.render(); // render is an optional function that defines the logic for rendering a template
    this.model.on('change', this.render, this); // calls render function once changed
    this.model.on('destroy', this.remove, this); // calls remove function once model deleted  
  },
  render: function() {
    this.$el.html(this.newTemplate(this.model.toJSON())); // calls the template
  },
  remove: function(){
    this.$el.remove(); // removes the HTML element from view when delete button clicked/model deleted
  }    
});

com.xomena.geo.Views.InstancesView = Backbone.View.extend({ 
  tagName: 'ul',
  initialize: function(){
    this.collection;
  },
  render: function(){
    this.collection.each(function(instance){
      var instanceView = new com.xomena.geo.Views.InstanceView({model: instance});
      $("#instances-container").append(instanceView.el);
    });
  }
});


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