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
        version: 'free',
        output: null,
        parameters: null,
        services: null
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
  chooseWebService: function(ev){
      alert(ev.target.value);
  },    
  events: {
    'click .exec':   'execInstance',
    'click .delete': 'deleteInstance',
    'change .ws-choose': 'chooseWebService'  
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