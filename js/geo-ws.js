(function($){
    var WS_DS_URI = "https://script.google.com/macros/s/AKfycbwPrEGcNZfsQEWmKm_XC-IXdEPdIQdIE1Na8pL4uBprm2YIT8E/exec?jsonp=?";
    
    var instance_col = new com.xomena.geo.Collections.InstanceCollection();
    
    var m_dialog;
    
    function initParameterParts(par, parts_url){
        $.ajax({
            url: parts_url,
            dataType: 'jsonp',
            async: false,
            success: function(data) {
                var partscol = new com.xomena.geo.Collections.ParameterPartCollection();
                for (var i = 1; i < data.length; i++) {
                    var part = new com.xomena.geo.Models.ParameterPart({
                        id: com.xomena.geo.getNewId(),
                        name: data[i][0],
                        type: data[i][1],
                        description: data[i][2],
                        required: data[i][3],
                        options: data[i][4],
                        multiple: data[i][5],
                        pattern: data[i][6],
                        placeholder: data[i][7]
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
                        multiple: data[i][6],
                        pattern: data[i][7],
                        placeholder: data[i][8]
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
                    var wserv = new com.xomena.geo.Models.WebService({id: com.xomena.geo.getNewId(), name: data[i][0], alias: data[i][1], isplace: data[i][3]});
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
                    $("#exec-instance-"+m_instance.get("id")).button({
                        icons: {
                            primary: "ui-icon-play"
                        }
                    });
                    $("#remove-instance-"+m_instance.get("id")).button({
                        icons: {
                            primary: "ui-icon-trash"
                        }
                    });
                    return false;
                });
            }
        });
        
        //Config settings
        com.xomena.geo.config = new com.xomena.geo.Models.Config({
            API_KEY: localStorage.getItem("com.xomena.geo.Models.Config.API_KEY"),
            CLIENT_ID: localStorage.getItem("com.xomena.geo.Models.Config.CLIENT_ID"),
            CRYPTO_KEY: localStorage.getItem("com.xomena.geo.Models.Config.CRYPTO_KEY"),
            SERVER_URL: localStorage.getItem("com.xomena.geo.Models.Config.SERVER_URL"), 
            SIGN_URL: localStorage.getItem("com.xomena.geo.Models.Config.SIGN_URL"),
            PLACES_API_KEY: localStorage.getItem("com.xomena.geo.Models.Config.PLACES_API_KEY")
        });
        var m_config_view = new com.xomena.geo.Views.ConfigView({model: com.xomena.geo.config});
        $("#config").append(m_config_view.el);
        
        m_dialog = $( "#config" ).dialog({
            autoOpen: false,
            height: 500,
            width: 600,
            modal: true,
            buttons: {
                Save: function(){
                    console.log("Saving config...");
                    com.xomena.geo.config.set("API_KEY", $("#app-config-api-key").val());
                    com.xomena.geo.config.set("CLIENT_ID", $("#app-config-client-id").val());  
                    com.xomena.geo.config.set("CRYPTO_KEY", $("#app-config-crypto-key").val());
                    com.xomena.geo.config.set("SERVER_URL", $("#app-config-server-url").val());
                    com.xomena.geo.config.set("SIGN_URL", $("#app-config-sign-url").val());
                    com.xomena.geo.config.set("PLACES_API_KEY", $("#app-config-places-api-key").val());
                    localStorage.setItem("com.xomena.geo.Models.Config.API_KEY", com.xomena.geo.config.get("API_KEY"));  
                    localStorage.setItem("com.xomena.geo.Models.Config.CLIENT_ID", com.xomena.geo.config.get("CLIENT_ID")); 
                    localStorage.setItem("com.xomena.geo.Models.Config.CRYPTO_KEY", com.xomena.geo.config.get("CRYPTO_KEY"));
                    localStorage.setItem("com.xomena.geo.Models.Config.SERVER_URL", com.xomena.geo.config.get("SERVER_URL"));
                    localStorage.setItem("com.xomena.geo.Models.Config.SIGN_URL", com.xomena.geo.config.get("SIGN_URL"));
                    localStorage.setItem("com.xomena.geo.Models.Config.PLACES_API_KEY", com.xomena.geo.config.get("PLACES_API_KEY"));  
                    console.log("Config saved");
                    m_dialog.dialog("close");
                },
                Cancel: function() {
                    m_dialog.dialog("close");
                }
            }
        });
        
        $(document).delegate("button.add-parameter", "click", function(){
            console.log("Add parameter clicked");
            var m_id = $(this).attr("id").replace(/add-parameter-/ig,"");
            $("<br/>").appendTo("#multiple-container-"+m_id);
            $("#multiple-container-"+m_id+" > #parameter-"+m_id).clone().attr("id","parameter-"+m_id+"-"+com.xomena.geo.getNewId()).appendTo("#multiple-container-"+m_id);
        });
        
        $("#edit-config").button().on("click", function(ev) {
            ev.preventDefault();
            m_dialog.dialog("open");
            return false;
        });
        
        //Init some buttons
        $("button#add-instance").button({
            icons: {
                primary: "ui-icon-plus"
            }
        });
    });
})(jQuery);