window.com = window.com || {};
window.com.xomena = window.com.xomena || {};

window.com.xomena.geo = {
  Models: {},
  Collections: {},
  Views: {},
  Router: {},
  services: null,
  getNewId: function(){
    window.com.xomena.geo.getNewId.count = ++window.com.xomena.geo.getNewId.count || 1;
    return window.com.xomena.geo.getNewId.count;
  },
  getFormElement: function(id,name,model){
    var output = "";
    var t = model.get("type");
    var p = model.get("pattern");
    var h = model.get("placeholder");
    var r = model.get("required");
    var d = model.get("description");
    var m = model.get("multiple");
    var o = model.get("options");  
    if(m){
        output += '<div id="multiple-container-'+id+'">'; 
    } else {
        output += '<div id="container-'+id+'">'; 
    }
    switch(t){
        case 'string':
            output += '<input type="text" id="parameter-'+id+'" name="'+name+'" value="" size="60"'+(p?' pattern="'+p+'"':'')+(h?' placeholder="'+h+'"':'')+(r?' required':'')+' title="'+d+'"/>';   
            if(m){
                output += '<button type="button" name="add-parameter-'+id+'" id="add-parameter-'+id+'" class="add-parameter">Add</button>';
            }
            break;
        case 'number':
            output += '<input type="number" id="parameter-'+id+'" name="'+name+'" value="" size="60"'+(p?' pattern="'+p+'"':'')+(h?' placeholder="'+h+'"':'')+(r?' required':'')+' title="'+d+'"/>';   
            if(m){
                output += '<button type="button" name="add-parameter-'+id+'" id="add-parameter-'+id+'" class="add-parameter">Add</button>';
            }
            break;
        case 'list':
            var ao = o.split(";");
            var m_options = ""; 
            _.each(ao, function(opt){
                var a1 = opt.split("|");
                var v = a1[0];
                var l = a1.length>1?a1[1]:a1[0];
                m_options = [m_options, '<option value="', v, '">', l, '</option>'].join(""); 
            });
            output += '<select id="parameter-'+id+'" name="'+name+'" class="chosen-select"'+(m?' multiple':'')+(r?' required':'')+' title="'+d+'">'+m_options+'</select>';
            break;
        case 'checkboxes':
            output += '<ul class="checkboxes">';
            var ao = o.split(";");
            _.each(ao, function(opt, ind){
                var a1 = opt.split("|");
                var v = a1[0];
                var l = a1.length>1?a1[1]:a1[0];
                output += '<li>';
                output += '<input type="checkbox" id="parameter-'+id+'-'+ind+'" name="'+name+'" value="'+v+'"'+(r?' required':'')+'/>';
                output += '<label for="parameter-'+id+'-'+ind+'" title="'+d+'">'+l+'</label>';
                output += '</li>';
            });
            output += '</ul>';
            break;
        case 'parts':
            var parts = model.get("parts");
            output += '<ul class="parts-container">';
            parts.forEach(function(p){
                output += '<li>';
                output += '<label for="parameter-'+id+'-'+p.get("id")+'">'+p.get('name')+'</label>';
                output += com.xomena.geo.getFormElement(id+"-"+p.get("id"), name+":"+p.get("name"), p);
                output += '</li>';
            });
            output += '</ul>';
            break;
        default:
            output += '<input type="text" id="parameter-'+id+'" name="'+name+'" value="" size="60"'+(p?' pattern="'+p+'"':'')+(h?' placeholder="'+h+'"':'')+(r?' required':'')+'title="'+d+'"/>';
            if(m){
                output += '<button type="button" name="add-parameter-'+id+'" id="add-parameter-'+id+'" class="add-parameter">Add</button>';
            }
    }
    if(m){
        output += '</div>'; 
    }
    return output;  
  }    
};

/*Define data models*/
com.xomena.geo.Models.WebService = Backbone.Model.extend({
    defaults: {
        id: null,
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
        id: '',
        name: '',
        type: 'string',
        description: '',
        required: false,
        parts: null,
        options: '',
        multiple: false,
        separator: '|',
        pattern: '',
        placeholder: ''
    }
});

com.xomena.geo.Models.ParameterInstance = Backbone.Model.extend({
    defaults: {
        id: null,
        name: null,
        model: null,
        value: null
    }
}); 
    
com.xomena.geo.Models.ParameterPart = Backbone.Model.extend({
    defaults: {
        id: null,
        name: '',
        type: 'string',
        description: '',
        required: false,
        options: '',
        multiple: false,
        separator: ':',
        pattern: '',
        placeholder: ''
    }
});  

com.xomena.geo.Models.Instance = Backbone.Model.extend({
    defaults: {
        id: null,
        webservice: null,
        version: 'free',
        output: "json",
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

com.xomena.geo.Collections.ParameterInstanceCollection = Backbone.Collection.extend({
  model: com.xomena.geo.Models.ParameterInstance
});


com.xomena.geo.Collections.WebServiceCollection = Backbone.Collection.extend({
  model: com.xomena.geo.Models.WebService,
  filterById: function(id){
    return this.models.filter(
      function(c) { 
        return id === c.get("id"); 
      }
    );
  },    
  filterByAlias: function(alias){
    return this.models.filter(
      function(c) { 
        return alias === c.get("alias"); 
      }
    );
  },
  filterByName: function(name){
    return this.models.filter(
      function(c) { 
        return name === c.get("name"); 
      }
    );
  }    
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
      this.model.set("webservice",ev.target.value);
      var services = this.model.get("services");
      var service = services.filterById(parseInt(ev.target.value)); 
      var params = service[0].get("parameters");
      var parinstance_col = new com.xomena.geo.Collections.ParameterInstanceCollection();
      _.each(params, function(p){
          parinstance_col.add(new com.xomena.geo.Models.ParameterInstance({
              id: com.xomena.geo.getNewId(),
              name: p.get("name"),
              model: p
          }));
      });
      this.model.set("parameters", parinstance_col);
      var paramsView = new com.xomena.geo.Views.ParametersView({collection: parinstance_col});
      paramsView.render();
      this.$(".ws-parameters").html(paramsView.el).tooltip({
        position: {
            my: "left top",
            at: "right+5 top-5"
        }
      });
      this.$(".chosen-select").chosen();
  },    
  events: {
    'click .exec':   'execInstance',
    'click .delete': 'deleteInstance',
    'change .ws-choose': 'chooseWebService'  
  },
  newTemplate: _.template($('#instanceTemplate').html()), // external template    
  initialize: function() {
    this.render(); // render is an optional function that defines the logic for rendering a template
    //this.model.on('change', this.render, this); // calls render function once changed
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


com.xomena.geo.Views.ParameterView = Backbone.View.extend({
  tagName: 'li', // defaults to div if not specified
  className: 'ws-param', // optional, can also set multiple 
  events: {
  },
  newTemplate: _.template($('#paramTemplate').html()), // external template    
  initialize: function() {
    this.render(); // render is an optional function that defines the logic for rendering a template
    this.model.on('destroy', this.remove, this); // calls remove function once model deleted  
  },
  render: function() {
    this.$el.html(this.newTemplate(this.model.toJSON())); // calls the template
  },
  remove: function(){
    this.$el.remove(); // removes the HTML element from view when delete button clicked/model deleted
  }
      
});

com.xomena.geo.Views.ParametersView = Backbone.View.extend({ 
  tagName: 'ul',
  className: 'ws-params',    
  initialize: function(){
    this.collection;
  },
  render: function(){
    var self = this;  
    this.collection.each(function(param){
      var paramView = new com.xomena.geo.Views.ParameterView({model: param});
      self.$el.append(paramView.el);
    });
  }
});