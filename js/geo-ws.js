(function ($) {
    'use strict';
    var WS_DS_URI = "https://script.google.com/macros/s/AKfycbwPrEGcNZfsQEWmKm_XC-IXdEPdIQdIE1Na8pL4uBprm2YIT8E/exec?jsonp=?",
        URL_SERVER_DEF = "http://aux.xomena.elementfx.com/geows.php",
	    URL_SIGN_DEF = "http://aux.xomena.elementfx.com/geowssign.php",
	    instance_col = new com.xomena.geo.Collections.InstanceCollection(),
        instancesView = null,
        isIE = /*@cc_on!@*/false,
        initialLoad = Object.create(null),
        initialLoadElapsed = 0;
    
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

        if (window.MSBlobBuilder && isIE) { // IE10
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
    
    function isInitialLoadFinished () {
        var res = true;
        Object.getOwnPropertyNames(initialLoad).forEach(function (p) {
            res = res && initialLoad[p];
        });
        return res;
    }

    function toast(msg, delay) {
      delay = delay || 3000;
      var m_toast = document.getElementById("geo-ws-toast");
      if(m_toast) {
        m_toast.duration = delay;
        m_toast.text = msg;
        m_toast.show();
      }
    }

    function initParameterParts (par, parts_url, procName) {
        initialLoad[procName] = false;
        $.ajax({
            url: parts_url,
            dataType: 'jsonp',
            async: true,
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
                        condRequiredOr: data[i][12],
                        deprecated: data[i][13],
                        urlEncoded: data[i][14],
                        omitLabel: data[i][15]
                    });
                    partscol.add(part);
                }
                par.set('parts', partscol);
                initialLoad[procName] = true;
            }
        });    
    }
    
    function initParameters (wserv, params_url) {
        initialLoad[wserv.get("id")] = false;
        $.ajax({
            url: params_url,
            dataType: 'jsonp',
            async: true,
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
                        separator: data[i][14] ? data[i][14] : '|',
                        deprecated: data[i][15],
                        excludedGroup: data[i][16]
                    });
                    if(data[i][4]){
                        //Init parameter parts
                        initParameterParts(par, data[i][4]+'?jsonp=?', wserv.get("id") + ":" + data[i][0]);
                    }
                    parcol.push(par);
                }
                wserv.set('parameters', parcol);
                initialLoad[wserv.get("id")] = true;
            }
        });    
    } 
    
    //DOM ready initialization
    $(function(){
        console.log("Start blockUI");
        $.blockUI({
            message: '<img src="image/waiting.gif" title="Please wait" width="75" height="75" />'
        });
        initialLoad["main"] = false;
        $.ajax({
            url: WS_DS_URI,
            dataType: 'jsonp',
            async: true,
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
                        render: data[i][9],
                        isImagery: data[i][10],
                        geocoderTool: data[i][11],
                        automotive: data[i][12]
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
                initialLoad["main"] = true;
                console.log("Finish init instances");

                var intHandler = window.setInterval(function () {
                    initialLoadElapsed += 100;
                    if (isInitialLoadFinished()) {
                        console.log("Initial load elapsep time is " + initialLoadElapsed + " ms");
                        window.clearInterval(intHandler);
                        $.unblockUI();
                        console.log("Finish blockUI");
                        var m_counter = 0;
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

                               if (localStorage.getItem("com.xomena.geo.Models.Config.AUTO_EXEC_ONLOAD") === "true") {
                                 m_counter++;
                                 com.xomena.geo.instanceViewsMap[key].execInstanceWithDelay(m_counter*100);
                               }
                            }
                        }
                    } else if (initialLoadElapsed > 30000) {
                        console.log("Initial load timeout");
                        window.clearInterval(intHandler);
                        $.unblockUI();
                        console.log("Finish blockUI");
                        toast("Something went wrong. Initial load timeout.", 15000);
                    }
                }, 100);
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
            ROADS_API_KEY: localStorage.getItem("com.xomena.geo.Models.Config.ROADS_API_KEY"),
            EXT_ID: localStorage.getItem("com.xomena.geo.Models.Config.EXT_ID"),
            AUTO_EXEC_ONLOAD: localStorage.getItem("com.xomena.geo.Models.Config.AUTO_EXEC_ONLOAD") ?
                  localStorage.getItem("com.xomena.geo.Models.Config.AUTO_EXEC_ONLOAD"):
                  false
        });
        var m_config_view = new com.xomena.geo.Views.ConfigView({model: com.xomena.geo.config});
        $("#config > paper-dialog-scrollable").append(m_config_view.el);
        $( "body" ).on("click", "paper-button.config-save", function () {
            console.log("Saving config...");
            //debugger;
            com.xomena.geo.config.set("API_KEY", $("#app-config-api-key").val());
            com.xomena.geo.config.set("CLIENT_ID", $("#app-config-client-id").val());
            com.xomena.geo.config.set("CRYPTO_KEY", $("#app-config-crypto-key").val());
            com.xomena.geo.config.set("SERVER_URL", $("#app-config-server-url").val());
            com.xomena.geo.config.set("SIGN_URL", $("#app-config-sign-url").val());
            com.xomena.geo.config.set("PLACES_API_KEY", $("#app-config-places-api-key").val());
            com.xomena.geo.config.set("ROADS_API_KEY", $("#app-config-roads-api-key").val());
            com.xomena.geo.config.set("EXT_ID", $("#app-config-ext-id").val());
            com.xomena.geo.config.set("AUTO_EXEC_ONLOAD", $("#app-config-exec-onload").get(0).checked);
            localStorage.setItem("com.xomena.geo.Models.Config.API_KEY", com.xomena.geo.config.get("API_KEY"));
            localStorage.setItem("com.xomena.geo.Models.Config.CLIENT_ID", com.xomena.geo.config.get("CLIENT_ID"));
            localStorage.setItem("com.xomena.geo.Models.Config.CRYPTO_KEY", com.xomena.geo.config.get("CRYPTO_KEY"));
            localStorage.setItem("com.xomena.geo.Models.Config.SERVER_URL", com.xomena.geo.config.get("SERVER_URL"));
            localStorage.setItem("com.xomena.geo.Models.Config.SIGN_URL", com.xomena.geo.config.get("SIGN_URL"));
            localStorage.setItem("com.xomena.geo.Models.Config.PLACES_API_KEY", com.xomena.geo.config.get("PLACES_API_KEY"));
            localStorage.setItem("com.xomena.geo.Models.Config.ROADS_API_KEY", com.xomena.geo.config.get("ROADS_API_KEY"));
            localStorage.setItem("com.xomena.geo.Models.Config.EXT_ID", com.xomena.geo.config.get("EXT_ID"));
            localStorage.setItem("com.xomena.geo.Models.Config.AUTO_EXEC_ONLOAD", com.xomena.geo.config.get("AUTO_EXEC_ONLOAD"));
            console.log("Config saved");
            toast('Settings saved successfully.');
        });
        
        $( "body" ).on("click", "#config-export", function () {
            var a = {
              "com.xomena.geo.Models.Config.API_KEY": com.xomena.geo.config.get("API_KEY"),
              "com.xomena.geo.Models.Config.CLIENT_ID": com.xomena.geo.config.get("CLIENT_ID"),
              "com.xomena.geo.Models.Config.CRYPTO_KEY": com.xomena.geo.config.get("CRYPTO_KEY"),
              "com.xomena.geo.Models.Config.SERVER_URL": com.xomena.geo.config.get("SERVER_URL"),
              "com.xomena.geo.Models.Config.SIGN_URL": com.xomena.geo.config.get("SIGN_URL"),
              "com.xomena.geo.Models.Config.PLACES_API_KEY": com.xomena.geo.config.get("PLACES_API_KEY"),
              "com.xomena.geo.Models.Config.ROADS_API_KEY": com.xomena.geo.config.get("ROADS_API_KEY"),
              "com.xomena.geo.Models.Config.EXT_ID": com.xomena.geo.config.get("EXT_ID")
            };
            var m_s = JSON.stringify(a);
            var file_name = prompt('Please specify the file name', "geo-ws-settings-"+(new Date().getTime()));
            var m_res = download(m_s, file_name, 'text/plain');
        });
        
        $( "body" ).on("click", "#config-import", function () {
            //debugger;
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                var file = document.createElement('input');
                file.type = 'file';
  
                $(file).on("change", function(){
                    var reader = new FileReader();
    
                    reader.onload = function (evt) {
                        // Obtain the read file data
                        var fileString = evt.target.result;
                        var m_obj = null;
                        try {
                            m_obj = JSON.parse(fileString);
                        } catch (m_err) {
                            toast("Cannot parse JSON data. Check your file please!", 6000);
                        }
                        if (m_obj) {
                            for (var key in m_obj) {
                              var elemId = null;
                              switch (key) {
                                case "com.xomena.geo.Models.Config.API_KEY":
                                  elemId = "app-config-api-key";
                                  break;
                                case "com.xomena.geo.Models.Config.CLIENT_ID":
                                  elemId = "app-config-client-id";
                                  break;
                                case "com.xomena.geo.Models.Config.CRYPTO_KEY":
                                  elemId = "app-config-crypto-key";
                                  break;
                                case "com.xomena.geo.Models.Config.SERVER_URL":
                                  elemId = "app-config-server-url";
                                  break;
                                case "com.xomena.geo.Models.Config.SIGN_URL":
                                  elemId = "app-config-sign-url";
                                  break;
                                case "com.xomena.geo.Models.Config.PLACES_API_KEY":
                                  elemId = "app-config-places-api-key";
                                  break;
                                case "com.xomena.geo.Models.Config.ROADS_API_KEY":
                                  elemId = "app-config-roads-api-key";
                                  break;
                                case "com.xomena.geo.Models.Config.EXT_ID":
                                  elemId = "app-config-ext-id";
                                  break;   
                              } 
                              if (elemId) {
                                var elem = document.getElementById(elemId);
                                if (elem) {
                                  elem.value = m_obj[key];
                                }
                              }
                            }
                            toast('Settings loaded from file successfully. Please save them.');
                        }
                    };
                    
                    reader.onerror = function (evt) {
                        if(evt.target.error.name == "NotReadableError") {
                            toast('The file could not be read', 6000);
                        }
                    };

                    reader.readAsText(file.files[0], "UTF-8");
                });
    
                file.click();
            } else {
                toast('The File APIs are not fully supported by your browser.', 6000);
            }
        });
        
        $( "body" ).on("click", "button.add-parameter", function(){
            console.log("Add parameter clicked");
            var m_id = $(this).attr("id").replace(/add-parameter-/ig,"");
            $("<br/>").appendTo("#multiple-container-"+m_id);
            $("#multiple-container-"+m_id+" > #parameter-"+m_id).clone().attr("id","parameter-"+m_id+"-"+com.xomena.geo.getNewId()).appendTo("#multiple-container-"+m_id);
        });
        
        $( "body" ).on("click", "button.add-parts", function () {
            console.log("Add parts clicked");
            var m_id = $(this).attr("id").replace(/add-parts-/ig, "");
            var parent_id = $(this).parents("div.ws-parameters").attr("id").replace(/ws-parameters-/ig, "");
            if (com.xomena.geo.instanceViewsMap[parent_id]) {
                var inst = com.xomena.geo.instanceViewsMap[parent_id].model;
                var params = inst.get("parameters");
                var pp = params.filterById(Number(m_id));
                if ($.isArray(pp) && pp.length) {
                    var parts = pp[0].get("model").get("parts");
                    if (parts) {
                        var output = [];
                        var index = $("#multiple-container-" + m_id).find("ul.parts-container.multiple").length;
                        output.push('<ul class="parts-container multiple">');
                        parts.forEach(function (p) {
                            output.push('<li>');
                            output.push('<label for="parameter-' + m_id + '-' + p.get("id") + '-' + index + '">' + p.get('name') + '</label>');
                            output.push(com.xomena.geo.getFormElement(m_id + "-" + p.get("id") + "-" + index, pp[0].get("name") + ":" + p.get("name"), p, {required: pp[0].get("triggerCondRequired")}, null, parent_id));
                            output.push('</li>');
                        });
                        output.push('</ul>');
                        $(output.join("")).appendTo("#multiple-container-"+m_id);
                        $("#multiple-container-"+m_id+" ul.parts-container.multiple:last").find(".chosen-select").chosen();
                        if (index + 1 > 1) {
                            $("#remove-parts-" + m_id).removeAttr("disabled");
                        }
                    }
                }
            }
        });

        $( "body" ).on("click", "button.remove-parts", function () {
            console.log("Remove parts clicked");
            var m_id = $(this).attr("id").replace(/remove-parts-/ig, "");
            var count = $("#multiple-container-"+m_id+" ul.parts-container.multiple").length;
            if (count > 1) {
                $("#multiple-container-"+m_id+" ul.parts-container.multiple:last").remove();
                if (count - 1 < 2) {
                    $(this).attr("disabled", "disabled");
                }
            }
        });

        $( "body" ).on("click", "paper-tab", function (ev) {
            //console.log(ev);
            var m_target_text = ev.target.innerText ? ev.target.innerText : ev.target.textContent;
            if ($.trim(m_target_text) === "Map") {
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
        $( "body" ).on("click", "#app-menu-item-export", function(ev) {
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
        $( "body" ).on("click", "#app-menu-item-import", function(ev) {
            ev.preventDefault();
            var dialog = document.getElementById("import-requests");
            if (dialog) {
                dialog.open();
            }
            return false;
        });

        $( "body" ).on("click", "#export-instances paper-icon-item paper-checkbox", function (ev) {
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

        $( "body" ).on("click", "#export-requests paper-button.export-save", function () {
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
                var file_name = prompt('Please specify the file name', "maps-webservices-requests-"+(new Date().getTime()));
                var m_res = download(m_s, file_name, 'text/plain');
                /*if (m_res) {
                  toast("Export requests finished");
                }*/
            } else {
               toast("Please select requests for export");
            }
        });

        $( "body" ).on("click", "#import-requests paper-button.import-save", function () {
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
                            toast("Cannot parse JSON data. Check your file please!", 6000);
                        }
                        if (m_obj) {
                            //console.log(m_obj);
                            //debugger;
                            var autoExecElem = document.getElementById("auto-exec-import-req");
                            var autoExec = autoExecElem && autoExecElem.checked;
                            var execView = {};
                            for (var key in m_obj) {
                              var inst = null;
                              var isImagery = false;
                              try {
                                inst = JSON.parse(m_obj[key]);
                                if (inst.webservice && inst.services && $.isArray(inst.services)) {
                                    var _ss = _.filter(inst.services, function (ss) {
                                        return ss.id === Number(inst.webservice);
                                    });
                                    if ($.isArray(_ss) && _ss.length) {
                                        isImagery = _ss[0].isImagery;
                                    }
                                }
                              } catch (m_err) {
                                console.log("Cannot parse JSON data for instance.");
                              }  
                              if(inst && inst.id && ("webservice" in inst) && ("output" in inst || isImagery) && ("version" in inst) && ("parameters" in inst)) {
                                var m_id = guid();
                                var m_instance = new com.xomena.geo.Models.Instance({id: m_id, services: com.xomena.geo.services});
                                //restore parameters
                                m_instance.set("webservice", inst.webservice);
                                m_instance.set("version", inst.version);
                                m_instance.set("output", inst.output);
                        
                                com.xomena.geo.storedValues[m_id] = {};
                                if(inst.webservice){
                                  com.xomena.geo.storedValues[m_id][inst.webservice] = {};
                                  _.each(inst.parameters, function(param){
                                    com.xomena.geo.storedValues[m_id][inst.webservice][param.name] = param.value;
                                  });
                                }
                        
                                instance_col.add(m_instance);
                                var m_instanceView = new com.xomena.geo.Views.InstanceView({model: m_instance});
                                Backbone.Validation.bind(m_instanceView);
                                $("#instances-container").append(m_instanceView.el);
                                com.xomena.geo.instanceViewsMap[m_instance.get("id")] = m_instanceView;
                                document.querySelector('#t-'+m_instance.get("id")).selected = 0;
                                $("#ws-result-"+m_instance.get("id")).width(function (ind, val) {
                                    return $($(this).parents("div.pure-g").get(0)).width();
                                });
                                m_instanceView.chooseWebService({
                                  target: {
                                    value: inst.webservice
                                  }
                                });
                                jem.fire('VisibilityDependence', {
                                  instanceId: m_id
                                });
                                jem.fire('RequiredDependence', {
                                  instanceId: m_id
                                });
                                jem.fire('RequiredOrDependence', {
                                  instanceId: m_id
                                }); 
                                if(autoExec) {
                                  execView[m_id] = m_instanceView;
                                }
                              }
                            }
                            $("#instances-container > li:last").get(0).scrollIntoView(true);
                            if(autoExec) {
                              var m_count = 0;
                              for (var key in execView) {
                                execView[key].execInstanceWithDelay(m_count*100);
                              }
                            }
                            toast("Import requests finished");
                        }
                    };
                    reader.onerror = function (evt) {
                        if(evt.target.error.name == "NotReadableError") {
                            toast('The file could not be read', 6000); 
                        }
                    };
                }
            } else {
                toast('The File APIs are not fully supported by your browser.', 6000);
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
        jem.on('InstanceCloned', function (eventName, eventAttributes) {
            // Handle the event
            console.log("Handling instance cloned event");
            if(eventAttributes.instance){
                instance_col.add(eventAttributes.instance);
                var m_instanceView = new com.xomena.geo.Views.InstanceView({model: eventAttributes.instance});
                Backbone.Validation.bind(m_instanceView);
                $("#instances-container").append(m_instanceView.el);
                com.xomena.geo.instanceViewsMap[eventAttributes.instance.get("id")] = m_instanceView;
                $("#instances-container > li:last").get(0).scrollIntoView(true);
                document.querySelector('#t-' + eventAttributes.instance.get("id")).selected = 0;
                $("#ws-result-" + eventAttributes.instance.get("id")).width(function (ind, val) {
                    return $($(this).parents("div.pure-g").get(0)).width();
                });
                m_instanceView.chooseWebService({
                  target: {
                    value: eventAttributes.instance.get("webservice")
                  }
                });
                jem.fire('VisibilityDependence', {
                  instanceId: eventAttributes.instance.get("id")
                });
                jem.fire('RequiredDependence', {
                  instanceId: eventAttributes.instance.get("id")
                });
                jem.fire('RequiredOrDependence', {
                  instanceId: eventAttributes.instance.get("id")
                });
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
        
        window.addEventListener('WebComponentsReady', function(e) {
            // imports are loaded and elements have been registered
            console.log('Components are ready');
            $("body").removeClass("wait-init");
        });
        
        if (chrome && chrome.runtime && com.xomena.geo.config.get("EXT_ID")) {
            window.com.xomena.geo.port = chrome.runtime.connect(com.xomena.geo.config.get("EXT_ID"), {name: "sbtsupport"}); 
        }

    });
})(jQuery);
