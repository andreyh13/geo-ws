(function ($) {
    'use strict';
    var WS_DS_URI = "https://script.google.com/macros/s/AKfycbwPrEGcNZfsQEWmKm_XC-IXdEPdIQdIE1Na8pL4uBprm2YIT8E/exec?jsonp=?",
        URL_SERVER_DEF = "http://aux.xomena.elementfx.com/geows.php",
	    URL_SIGN_DEF = "http://aux.xomena.elementfx.com/geowssign.php",
	    instance_col = new com.xomena.geo.Collections.InstanceCollection(),
        instancesView = null;
    
    instance_col.on("add", function (inst) {
        console.log("The instance " + inst.get("id") + " has added to collection");
        if (instance_col.localStorage.find(inst)) {
            instance_col.localStorage.update(inst);
        } else {
            instance_col.localStorage.create(inst);
        }
    });
    instance_col.on("remove", function (inst) {
        console.log("The instance " + inst.get("id") + " has removed from collection");
        instance_col.localStorage.destroy(inst);
    });

    // Generate four random hex digits.
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    // Generate a pseudo-GUID by concatenating random hexadecimal.
    function guid() {
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }
    
    function download(strData, strFileName, strMimeType) {
        var D = document,
            A = arguments,
            a = D.createElement("a"),
            d = A[0],
            n = A[1],
            t = A[2] || "text/plain";

        //build download link:
        a.href = "data:" + strMimeType + "charset=utf-8," + encodeURIComponent(strData);

        if (window.MSBlobBuilder) { // IE10
            var bb = new MSBlobBuilder();
            bb.append(strData);
            return navigator.msSaveBlob(bb, strFileName);
        } /* end if(window.MSBlobBuilder) */

        if ('download' in a) { //FF20, CH19
            a.setAttribute("download", n);
            a.innerHTML = "downloading...";
            D.body.appendChild(a);
            setTimeout(function() {
                var e = D.createEvent("MouseEvents");
                e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
                D.body.removeChild(a);
            }, 66);
            return true;
        }; /* end if('download' in a) */

        //do iframe dataURL download: (older W3)
        var f = D.createElement("iframe");
        D.body.appendChild(f);
        f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : encodeURIComponent)(strData);
        setTimeout(function() {
            D.body.removeChild(f);
        }, 333);
        return true;
    }

    function initParameterParts (par, parts_url) {
        $.ajax({
            url: parts_url,
            dataType: 'jsonp',
            async: false,
            success: function (data) {
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
                        placeholder: data[i][7],
                        requiredOrGroup: data[i][8],
                        condVisibility: data[i][9],
                        m4wOnly: data[i][10],
                        condRequired: data[i][11],
                        condRequiredOr: data[i][12]
                    });
                    partscol.add(part);
                }
                par.set('parts', partscol);
            }
        });    
    }
    
    function initParameters (wserv, params_url) {
        $.ajax({
            url: params_url,
            dataType: 'jsonp',
            async: false,
            success: function (data) {
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
                        placeholder: data[i][8],
                        requiredOrGroup: data[i][9],
                        condVisibility: data[i][10],
                        m4wOnly: data[i][11],
                        condRequired: data[i][12],
                        condRequiredOr: data[i][13],
                        separator: data[i][14] ? data[i][14] : '|'
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
        console.log("Start blockUI");
        $.blockUI({
            message: '<img src="image/waiting.gif" title="Please wait" width="75" height="75" />'
        });
        $.ajax({
            url: WS_DS_URI,
            dataType: 'jsonp',
            async: false,
            success: function(data) {
                for (var i = 1; i < data.length; i++) {
                    var wserv = new com.xomena.geo.Models.WebService({
                        id: com.xomena.geo.getNewId(), 
                        name: data[i][0], 
                        alias: data[i][1], 
                        isApiary: data[i][3],
                        basepath: data[i][4],
                        jsonSuffix: data[i][5],
                        xmlSuffix: data[i][6],
                        apiaryKeyFree: data[i][7],
                        apiaryKeyM4W: data[i][8],
                        render: data[i][9]
                    });
                    if(data[i][2]){
                        //Init parameters
                        initParameters(wserv, data[i][2]+'?jsonp=?');
                    }
                    com.xomena.geo.services.add(wserv);
                }
                
                //Get instances stored in localStorage
                var m_stored = instance_col.localStorage.findAll();
                if(!m_stored.length){
                    //add first instance
                    var m_instance = new com.xomena.geo.Models.Instance({id: guid(), services: com.xomena.geo.services});
                    instance_col.add(m_instance);
                } else {
                    _.each(m_stored, function(inst){
                        var m_instance = new com.xomena.geo.Models.Instance({id: inst.id, services: com.xomena.geo.services});
                        //restore parameters
                        m_instance.set("webservice", inst.webservice);
                        m_instance.set("version", inst.version);
                        m_instance.set("output", inst.output);
                        
                        com.xomena.geo.storedValues[inst.id] = {};
                        if(inst.webservice){
                            com.xomena.geo.storedValues[inst.id][inst.webservice] = {};
                            _.each(inst.parameters, function(param){
                                com.xomena.geo.storedValues[inst.id][inst.webservice][param.name] = param.value;
                            });
                        }
                        
                        instance_col.add(m_instance);
                    });
                }

                // creates view for collection and renders collection
                instancesView = new com.xomena.geo.Views.InstancesView({collection: instance_col});
                instancesView.render();
        
                //adding new instance
                $("#add-instance").click(function(){
                    var m_instance = new com.xomena.geo.Models.Instance({id: guid(), services: com.xomena.geo.services});
                    instance_col.add(m_instance);
                    var m_instanceView = new com.xomena.geo.Views.InstanceView({model: m_instance});
                    Backbone.Validation.bind(m_instanceView);
                    $("#instances-container").append(m_instanceView.el);
                    com.xomena.geo.instanceViewsMap[m_instance.get("id")] = m_instanceView;
                    $("#instances-container > li:last").get(0).scrollIntoView(true);
                    document.querySelector('#t-'+m_instance.get("id")).selected = 0;
                    $("#ws-result-"+m_instance.get("id")).width(function (ind, val) {
                        return $($(this).parents("div.pure-g").get(0)).width();
                    });
                    return false;
                });
                console.log("Finish init instances");
                window.setTimeout(function(){
                    $.unblockUI();
                    console.log("Finish blockUI");
                    for(var key in com.xomena.geo.instanceViewsMap){
                        var inst = com.xomena.geo.instanceViewsMap[key].model;
                        var m_ws = inst.get("webservice");
                        if(m_ws){
                           com.xomena.geo.instanceViewsMap[key].chooseWebService({
                               target: {
                                   value: m_ws
                               }
                           });
                           jem.fire('VisibilityDependence', {
                                instanceId: key
                           });
                           jem.fire('RequiredDependence', {
                                instanceId: key
                           });
                           jem.fire('RequiredOrDependence', {
                                instanceId: key
                           });    
                        }
                    }
                }, 5000);
            }
        });
        
        //Config settings
        com.xomena.geo.config = new com.xomena.geo.Models.Config({
            API_KEY: localStorage.getItem("com.xomena.geo.Models.Config.API_KEY"),
            CLIENT_ID: localStorage.getItem("com.xomena.geo.Models.Config.CLIENT_ID"),
            CRYPTO_KEY: localStorage.getItem("com.xomena.geo.Models.Config.CRYPTO_KEY"),
            SERVER_URL: localStorage.getItem("com.xomena.geo.Models.Config.SERVER_URL")?
			            localStorage.getItem("com.xomena.geo.Models.Config.SERVER_URL"):
						URL_SERVER_DEF, 
            SIGN_URL: localStorage.getItem("com.xomena.geo.Models.Config.SIGN_URL")?
			          localStorage.getItem("com.xomena.geo.Models.Config.SIGN_URL"):
					  URL_SIGN_DEF,
            PLACES_API_KEY: localStorage.getItem("com.xomena.geo.Models.Config.PLACES_API_KEY"),
            ROADS_API_KEY: localStorage.getItem("com.xomena.geo.Models.Config.ROADS_API_KEY")
        });
        var m_config_view = new com.xomena.geo.Views.ConfigView({model: com.xomena.geo.config});
        $("#config > paper-dialog-scrollable").append(m_config_view.el);
        $(document).delegate("paper-button.config-save", "click", function () {
            console.log("Saving config...");
            com.xomena.geo.config.set("API_KEY", $("#app-config-api-key").val());
            com.xomena.geo.config.set("CLIENT_ID", $("#app-config-client-id").val());
            com.xomena.geo.config.set("CRYPTO_KEY", $("#app-config-crypto-key").val());
            com.xomena.geo.config.set("SERVER_URL", $("#app-config-server-url").val());
            com.xomena.geo.config.set("SIGN_URL", $("#app-config-sign-url").val());
            com.xomena.geo.config.set("PLACES_API_KEY", $("#app-config-places-api-key").val());
            com.xomena.geo.config.set("ROADS_API_KEY", $("#app-config-roads-api-key").val());
            localStorage.setItem("com.xomena.geo.Models.Config.API_KEY", com.xomena.geo.config.get("API_KEY"));
            localStorage.setItem("com.xomena.geo.Models.Config.CLIENT_ID", com.xomena.geo.config.get("CLIENT_ID"));
            localStorage.setItem("com.xomena.geo.Models.Config.CRYPTO_KEY", com.xomena.geo.config.get("CRYPTO_KEY"));
            localStorage.setItem("com.xomena.geo.Models.Config.SERVER_URL", com.xomena.geo.config.get("SERVER_URL"));
            localStorage.setItem("com.xomena.geo.Models.Config.SIGN_URL", com.xomena.geo.config.get("SIGN_URL"));
            localStorage.setItem("com.xomena.geo.Models.Config.PLACES_API_KEY", com.xomena.geo.config.get("PLACES_API_KEY"));
            localStorage.setItem("com.xomena.geo.Models.Config.ROADS_API_KEY", com.xomena.geo.config.get("ROADS_API_KEY"));
            console.log("Config saved");
        });
        
        $(document).delegate("button.add-parameter", "click", function(){
            console.log("Add parameter clicked");
            var m_id = $(this).attr("id").replace(/add-parameter-/ig,"");
            $("<br/>").appendTo("#multiple-container-"+m_id);
            $("#multiple-container-"+m_id+" > #parameter-"+m_id).clone().attr("id","parameter-"+m_id+"-"+com.xomena.geo.getNewId()).appendTo("#multiple-container-"+m_id);
        });
        
        $(document).delegate("paper-tab", "click", function(ev){
          //console.log(ev);
          if (ev.target.innerText === "Map") {
            for (var id in window.com.xomena.mapRenderer.instances) {
              var m_map = window.com.xomena.mapRenderer.getMap(id);
              if (m_map && $(m_map.getDiv()).is(":visible") && window.com.xomena.mapRenderer.instances[id].pendingFitBounds) {
                window.com.xomena.mapRenderer.adjustBounds(id);
                window.com.xomena.mapRenderer.instances[id].pendingFitBounds = false;
              }
            }
          }
        });
        
        $("#edit-config").on("click", function(ev) {
            ev.preventDefault();
            var dialog = document.getElementById("config");
            if (dialog) {
                dialog.open();
            }
            return false;
        });

        //Export requests
        $(document).delegate("#app-menu-item-export", "click", function(ev) {
            ev.preventDefault();
            var dialog = document.getElementById("export-requests");
            if (dialog) {
                $("#export-instances").html("");
                if (instancesView) {
                   instancesView.renderExport();
                }
                dialog.open();
            }
            return false;
        });

        //Import requests
        $(document).delegate("#app-menu-item-import", "click", function(ev) {
            ev.preventDefault();
            var dialog = document.getElementById("import-requests");
            if (dialog) {
                dialog.open();
            }
            return false;
        });

        $(document).delegate("#export-instances paper-icon-item paper-checkbox", "click", function (ev) {
            if (this.checked) {
                var instanceView = com.xomena.geo.instanceViewsMap[this.value];
                if (instanceView) {
                    instanceView.syncParameters();
                    instanceView.model.set("version", instanceView.$("input[name='ws-version-val-" + this.value + "']:checked").val());
                    instanceView.model.set("output", instanceView.$("input[name='output-" + this.value + "']:checked").val());
                    jem.fire('InstanceUpdated', {
                        instance: instanceView.model
                    });
                    var m_url = instanceView.model.getURL();
                    var ta = $(this).parents("paper-icon-item").find(" > iron-autogrow-textarea").get(0);
                    ta.textarea.value = m_url;
                }
            }
        });

        $(document).delegate("#export-requests paper-button.export-save", "click", function () {
            console.log("Exporting requests...");
            var m_arr = [];
            $("#export-instances paper-icon-item paper-checkbox").each(function () {
               if (this.checked) {
                   m_arr.push(this.value);
               }
            });
            if (m_arr.length) {
                var a = {};
                _.each(m_arr, function (id) {
                    var m_k = "com.xomena.geo.Collections.Instances-" + id;
                    a[id] = localStorage.getItem(m_k);
                });
                var m_s = JSON.stringify(a);
                //console.log(m_s);
                download(m_s, "maps-webservices-requests-"+(new Date().getTime()), 'text/plain');
            } else {
               alert("Please select requests for export");
            }
        });

        $(document).delegate("#import-requests paper-button.import-save", "click", function () {
            console.log("Importing requests...");
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                var m_file = document.getElementById('import-file-inp').files[0];
                if(m_file){
                    var reader = new FileReader();
                    var progress = document.querySelector('#import-file-progress');
                    progress.min = 0;
                    progress.max = 100;
                    progress.value = 0;

                    // Read file into memory as UTF-16
                    reader.readAsText(m_file, "UTF-8");

                    // Handle progress, success, and errors
                    reader.onprogress = function (evt) {
                        if (evt.lengthComputable) {
                            progress.max = evt.total;
                            progress.value = evt.loaded;
                        }
                    };
                    reader.onload = function (evt) {
                        progress.value = 0;
                        // Obtain the read file data
                        var fileString = evt.target.result;
                        var m_obj = null;
                        try {
                            m_obj = JSON.parse(fileString);
                        } catch (m_err) {
                            alert("Cannot parse JSON data. Check your file please!");
                        }
                        if (m_obj) {
                            console.log(m_obj);
                        }
                    };
                    reader.onerror = function (evt) {
                        if(evt.target.error.name == "NotReadableError") {
                            // The file could not be read
                        }
                    };
                }
            } else {
                alert('The File APIs are not fully supported by your browser.');
            }
        });

        //Initialize validation dialog
        $("#validation-dialog").dialog({
            autoOpen: false,
            modal: true,
            minWidth: 580,
            show: {
                effect: "blind",
                duration: 1000
            },
            hide: {
                effect: "explode",
                duration: 1000
            }
        });
        
        //Define custom events listeners
        jem.on('VisibilityDependence', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling dependent visibility");
            if(com.xomena.geo.instanceViewsMap[eventAttributes.instanceId]){
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].syncParameters();
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].setParametersVisibility();
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].setM4WVisibility();
            }
        });
        jem.on('M4WVisibility', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling m4w visibility");
            if(com.xomena.geo.instanceViewsMap[eventAttributes.instanceId]){
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].setM4WVisibility();
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].syncParameters();
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].setParametersVisibility();
            }
        });
        jem.on('SetConditionalRequired', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling set conditional required");
            var p = eventAttributes.parameter;
            var r = p.get("isRequired");
            var id = p.get("id");
            var aster = "<sup>*</sup>";
            var aster_re = /<sup>\*<\/sup>/g;
            var m_html = $("#ws-param-"+id+" > label").html();
            if(r){
                $("#ws-param-"+id+" > label").addClass("parameter-required");
                if(m_html.indexOf(aster)===-1){
                    $("#ws-param-"+id+" > label").html(m_html+aster);
                }
                $("#parameter-"+id).attr("required","required");
            } else {
                $("#ws-param-"+id+" > label").removeClass("parameter-required");
                $("#ws-param-"+id+" > label").html(m_html.replace(aster_re,""));
                $("#parameter-"+id).removeAttr("required");
            }
        });
        jem.on('SetConditionalRequiredOr', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling set conditional required OR group");
            var p = eventAttributes.parameter;
            var r = p.get("isRequiredOr");
            var id = p.get("id");
            var aster = "<sup>*</sup>";
            var aster_re = /<sup>\*<\/sup>/g;
            var m_html = $("#ws-param-"+id+" > label").html();
            if(r){
                $("#ws-param-"+id+" > label").addClass("parameter-required-or");
                if(m_html.indexOf(aster)===-1){
                    $("#ws-param-"+id+" > label").html(m_html+aster);
                }
            } else {
                $("#ws-param-"+id+" > label").removeClass("parameter-required-or");
                $("#ws-param-"+id+" > label").html(m_html.replace(aster_re,""));
            }
        });
        jem.on('RequiredDependence', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling dependent required");
            if(com.xomena.geo.instanceViewsMap[eventAttributes.instanceId]){
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].syncParameters();
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].setParametersRequired();
            }
        });
        jem.on('RequiredOrDependence', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling dependent required OR group");
            if(com.xomena.geo.instanceViewsMap[eventAttributes.instanceId]){
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].syncParameters();
                com.xomena.geo.instanceViewsMap[eventAttributes.instanceId].setParametersRequiredOr();
            }
        });
        jem.on('InstanceUpdated', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling instance updated event");
            if(eventAttributes.instance){
                instance_col.localStorage.update(eventAttributes.instance);
            }
        });
        jem.on('InstanceParamsSynced', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling instance params synced event");
            if(eventAttributes.instance){
                instance_col.localStorage.update(eventAttributes.instance);
            }
        });
        
        $( window ).resize(function () {
            for(var key in com.xomena.geo.instanceViewsMap){
                var m_view = com.xomena.geo.instanceViewsMap[key];
                $("#ws-result-"+m_view.model.get("id")).width(function (ind, val) {
                        return $($(this).parents("div.pure-g").get(0)).width();
                });
            }
        });

        $( window ).unload(function() {
            //Save current state
            for(var key in com.xomena.geo.instanceViewsMap){
                var m_view = com.xomena.geo.instanceViewsMap[key];
                m_view.syncParameters();  
                m_view.model.set("version", m_view.$("input[name='ws-version-val-"+m_view.model.get("id")+"']:checked").val());
                m_view.model.set("output", m_view.$("input[name='output-"+m_view.model.get("id")+"']:checked").val()); 
                jem.fire('InstanceUpdated', {
                    instance: m_view.model
                });
            }
        });
        
    });
})(jQuery);
