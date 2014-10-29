(function($){
    var API_KEY = "AIzaSyA67JIj41Ze0lbc2KidOgQMgqLOAZOcybE";
    var CLIENT_ID = "gme-addictive";
    var WS_DS_URI = "https://script.google.com/macros/s/AKfycbwPrEGcNZfsQEWmKm_XC-IXdEPdIQdIE1Na8pL4uBprm2YIT8E/exec?jsonp=?";
    
    var instance_col = new com.xomena.geo.Collections.InstanceCollection();
    
    function initParameterParts(par, parts_url){
        $.ajax({
            url: parts_url,
            dataType: 'jsonp',
            async: false,
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
            async: false,
            success: function(data) {
                var parcol = [];
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
                    parcol.push(par);
                }
                wserv.set('parameters', parcol);
            }
        });    
    } 
    
    //DOM ready initialization
    $(function(){
        $.ajax({
            url: WS_DS_URI,
            dataType: 'jsonp',
            async: false,
            success: function(data) {
                for (var i = 1; i < data.length; i++) {
                    var wserv = new com.xomena.geo.Models.WebService({id: com.xomena.geo.getNewId(), name: data[i][0], alias: data[i][1]});
                    if(data[i][2]){
                        //Init parameters
                        initParameters(wserv, data[i][2]+'?jsonp=?');
                    }
                    com.xomena.geo.services.add(wserv);
                }
                
                //add first instance
                instance_col.add(new com.xomena.geo.Models.Instance({id: com.xomena.geo.getNewId(), services: com.xomena.geo.services}));

                // creates view for collection and renders collection
                var instancesView = new com.xomena.geo.Views.InstancesView({collection: instance_col});
                instancesView.render();
        
                //adding new instance
                $("#add-instance").click(function(){
                    var m_instance = new com.xomena.geo.Models.Instance({id: com.xomena.geo.getNewId(), services: com.xomena.geo.services});
                    instance_col.add(m_instance);
                    var m_instanceView = new com.xomena.geo.Views.InstanceView({model: m_instance});
                    $("#instances-container").append(m_instanceView.el);
                    return false;
                });
            }
        });
    });
})(jQuery);