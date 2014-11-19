window.com = window.com || {};
window.com.xomena = window.com.xomena || {};

window.com.xomena.geo = {
  Models: {},
  Collections: {},
  Views: {},
  Router: {},
  services: null,
  config: {},    
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
            var m_options = '<option value="">--Select value--</option>'; 
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
  },
  formatJSON: function(data){
      var m_res = JSON.stringify(data).replace(/\[/ig,"[\n").replace(/\{/ig,"{\n").replace(/\]/ig,"\n]").replace(/\}/ig,"\n}").replace(/(\"\w+\":\".+\",)/ig,"$1\n");
      return m_res;
  }
};

/*Define data models*/
com.xomena.geo.Models.WebService = Backbone.Model.extend({
    defaults: {
        id: null,
        name: '',
        alias: '',
        basepath: 'https://maps.googleapis.com/maps/api/',
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
    },
    getURL: function(){
        var res = [];
        var m_service = this.get("webservice");
        var ver = this.get("version");
        if(m_service){
            var m_services = this.get("services");
            var service = m_services.filterById(parseInt(m_service));
            if($.isArray(service) && service.length){
                res.push(service[0].get("basepath"));
                res.push(service[0].get("alias"));
                res.push("/");
                res.push(this.get("output"));
                res.push("?");
                
                var pars = this.get("parameters");
                var aa = "";
                if(pars){
                    pars.forEach(function(p){
                        var m = p.get("model");
                        var sep = m.get("separator");
                        var n = p.get("name");
                        var v = p.get("value");
                        if(v && $.isArray(v) && v.length){
                            res.push(aa);
                            res.push(n);
                            res.push("=");
                            res.push(encodeURI(v.join(sep)));
                            aa = "&";
                        }
                    });
                }
                
                if(ver === "free"){
                    if(com.xomena.geo.config.get("API_KEY")){
                        res.push(aa);
                        res.push("key=");
                        res.push(com.xomena.geo.config.get("API_KEY"));
                    }
                } else {
                    if(com.xomena.geo.config.get("CLIENT_ID")){
                        res.push(aa);
                        res.push("client=");
                        res.push(com.xomena.geo.config.get("CLIENT_ID"));
                    }
                }
            }
        }
        var m_join = res.join("");
        if(m_join && ver=='work' && com.xomena.geo.config.get("SIGN_URL") && com.xomena.geo.config.get("CRYPTO_KEY")){
            $.ajax({
                url: com.xomena.geo.config.get("SIGN_URL"),
                dataType: "text",
                type: "POST",
                crossDomain: true,
                async: false,
                data: {
                    uri: m_join,
                    cryptokey: com.xomena.geo.config.get("CRYPTO_KEY")
                },
                success: function(data) {
                    m_join = $.trim(data);
                },
                error: function(jqXHR, textStatus, errorThrown){
                    console.log("Server side error: "+textStatus+" - "+ errorThrown);
                }
            });
        }
        return m_join;
    }
});

com.xomena.geo.Models.Config = Backbone.Model.extend({
    defaults: {
        API_KEY: null,
        CLIENT_ID: null,
        CRYPTO_KEY: null,
        SERVER_URL: null, 
        SIGN_URL: null
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
  tagName: 'li', 
  className: 'ws-instance ui-widget-content ui-corner-tl ui-corner-tr ui-corner-bl ui-corner-br', 
  execInstance: function(){
    console.log("Start execution for instance #"+this.model.get("id"));
    var self = this;  
    this.$("#ws-url-"+this.model.get("id")).html("Preparing request please wait...");  
    var params = this.model.get("parameters");
    params.forEach(function(p){
        var m = p.get("model");
        var t = m.get("type");
        var n = p.get("name");
        var v = [];
        self.$("input[name^='"+n+"'], select[name^='"+n+"']").each(function(){
            if(t==="list"){
                var val = $(this).val();
                if($.isArray(val)){
                    v = _.union(v,val);
                } else {
                    if(val){    
                        v.push(val);
                    }
                }
            } else if(t==='parts'){
                var m_n = $(this).attr("name");
                var prefix = m_n.split(":")[1];
                var val = $(this).val();
                if($.isArray(val)){
                    v.push(prefix + ":" + val.join("|"));
                } else {
                    if(val){
                        v.push(prefix + ":" + val);
                    }
                }
            } else if(t==='checkboxes'){
                if(this.checked){
                    var val = $(this).val();
                    if(val){
                        v.push(val);
                    }
                }
            } else {
                var val = $(this).val();
                if(val){
                    v.push(val);
                }
            }
        });
        p.set("value", v);
    });  
    this.model.set("version", this.$("input[name='ws-version-val-"+this.model.get("id")+"']:checked").val());
    this.model.set("output", this.$("input[name='output-"+this.model.get("id")+"']:checked").val()); 
    var m_url = this.model.getURL();
    this.$("#ws-url-"+this.model.get("id")).html(m_url);
    if(m_url && com.xomena.geo.config.get("SERVER_URL")){
        $.ajax({
            url: com.xomena.geo.config.get("SERVER_URL"),
            dataType: self.model.get("output")=="json"?"json":"text",
            type: "POST",
            crossDomain: true,
            async: true,
            data: {
                uri: m_url,
                version: self.model.get("version"),
                output: self.model.get("output")
            },
            success: function(data) {
                if($.type(data)=="string"){
                    self.$("#ws-result-"+self.model.get("id")).html("<pre><code class='xml'>"+$.trim(data).replace(/</ig,"&lt;").replace(/>/ig,"&gt;")+"</code></pre>");
                } else {
                    self.$("#ws-result-"+self.model.get("id")).html("<pre><code class='json'>"+com.xomena.geo.formatJSON(data)+"</code></pre>");
                }
                hljs.highlightBlock(self.$("#ws-result-"+self.model.get("id")).get(0));
            },
            error: function(jqXHR, textStatus, errorThrown){
                console.log("Server side error: "+textStatus+" - "+ errorThrown);
            }
        });
    }
    return false;  
  },
  deleteInstance: function(){
    console.log("Delete instance #"+this.model.get("id"));  
    this.model.destroy(); // deletes the model when delete button clicked
    return false;  
  },    
  chooseWebService: function(ev){
      this.model.set("webservice",ev.target.value);
      if(ev.target.value){
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
        this.$("#exec-instance-"+this.model.get("id")).button("enable");
      } else {
        this.$(".ws-parameters").html("");  
        this.$("#exec-instance-"+this.model.get("id")).button("disable");
      }
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
        $("#exec-instance-"+instance.get("id")).button({
            icons: {
                primary: "ui-icon-play"
            }
        });
        $("#remove-instance-"+instance.get("id")).button({
            icons: {
                primary: "ui-icon-trash"
            }
        });
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

com.xomena.geo.Views.ConfigView = Backbone.View.extend({
  tagName: 'div', 
  className: 'app-config',  
  events: {
  },
  newTemplate: _.template($('#configTemplate').html()), // external template    
  initialize: function() {
    this.render(); // render is an optional function that defines the logic for rendering a template
  },
  render: function() {
    this.$el.html(this.newTemplate(this.model.toJSON())); // calls the template
  },
  remove: function(){
    this.$el.remove(); // removes the HTML element from view when delete button clicked/model deleted
  }
});
