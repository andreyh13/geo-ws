(function (window, $, _, Backbone, jem, hljs) {
    'use strict';

    window.com = window.com || {};
    window.com.xomena = window.com.xomena || {};

    window.com.xomena.geo = {
        Models: {},
        Collections: {},
        Views: {},
        Router: {},
        services: null,
        instanceViewsMap: {},
        config: {},
        storedValues: {},
        port: null,
        getNewId: function () {
            window.com.xomena.geo.getNewId.count = ++window.com.xomena.geo.getNewId.count || 1;
            return window.com.xomena.geo.getNewId.count;
        },
        tools: {
            geocoder: "https://google-developers.appspot.com/maps/documentation/utils/geocoder/#",
            svwizard: "http://mcorcuera.github.io/sv-wizard/#",
            directions: "https://directionsdebug.firebaseapp.com/?"
        },
        restrictedKey: "AIzaSyC-g9nviI45ie10GPcWTKhUfHsymj02NG8",
        appURL: "http://local.geows.com/",
        getFormElement: function (id, name, model, triggers, listeners, parentInstance) {
            var output = [],
                t = model.get("type"),
                p = model.get("pattern"),
                h = model.get("placeholder"),
                r = model.get("required"),
                rOr = model.get("requiredOrGroup"),
                d = model.get("description"),
                m = model.get("multiple"),
                o = model.get("options"),
                max_v = model.get("maxValues"),
                t_vis = triggers && triggers.visibility,
                l_vis = listeners && listeners.visibility,
                t_req = triggers && triggers.required,
                l_req = listeners && listeners.required,
                t_reqOr = triggers && triggers.requiredOr,
                l_reqOr = listeners && listeners.requiredOr,
                isPart = model instanceof window.com.xomena.geo.Models.ParameterPart,
                sv = [];

            function construct_input_element(pureClass, classes, type, inputId, inputName, inputValue, inputTitle, addAttr) {
                return '<input class="' + pureClass + classes + '" type="' + type + '" id="' + inputId +
                    '" name="' + inputName + '" value="' + inputValue + '" size="60"' +
                    (p ? ' pattern="' + p + '"' : '') + (h ? ' placeholder="' + h + '"' : '') +
                    (r ? ' required' : '') + ' title="' + inputTitle + '"' + (addAttr ? ' ' + addAttr : '') + '/>';
            }

            function get_tooltip_element(elemId, text) {
                var res = [];
                if (document.head.createShadowRoot) {
                    res.push('<div class="card-tooltip">');
                    res.push('<iron-icon icon="help" class="tip" id="' + elemId + '-tip"></iron-icon>');
                    res.push('<paper-tooltip for="' + elemId + '-tip">' + text + '</paper-tooltip>');
                    res.push('</div>');
                }
                return res.join("");
            }

            function get_add_button() {
                return '<button type="button" name="add-parameter-' + id + '" id="add-parameter-' + id +
                    '" class="add-parameter">Add</button>';
            }

            function get_add_parts_button() {
                return '<button type="button" name="add-parts-' + id + '" id="add-parts-' + id +
                    '" class="add-parts">Add</button>';
            }

            function get_remove_parts_button(enabled) {
                return '<button type="button" name="remove-parts-' + id + '" id="remove-parts-' + id +
                    '" class="remove-parts"' + (enabled ? '' : ' disabled') + '>Remove</button>';
            }

            output.push('<div id="' + (m ? 'multiple-' : '') + 'container-' + id + '">');
            if (window.com.xomena.geo.instanceViewsMap[parentInstance]) {
                var m_ws = window.com.xomena.geo.instanceViewsMap[parentInstance].model.get("webservice");
                if (!isPart) {
                    if (window.com.xomena.geo.storedValues[parentInstance] && window.com.xomena.geo.storedValues[parentInstance][m_ws] &&
                        window.com.xomena.geo.storedValues[parentInstance][m_ws][name]) {
                        sv = window.com.xomena.geo.storedValues[parentInstance][m_ws][name];
                    }
                } else {
                    var _a1 = id.split("-");
                    var ind = Number(_a1[2]);
                    var _a2 = name.split(":");
                    var nn = _a2[0];
                    var pp = _a2[1];
                    if (window.com.xomena.geo.storedValues[parentInstance] && window.com.xomena.geo.storedValues[parentInstance][m_ws] &&
                        window.com.xomena.geo.storedValues[parentInstance][m_ws][nn] && window.com.xomena.geo.storedValues[parentInstance][m_ws][nn][ind]) {
                        _.each(window.com.xomena.geo.storedValues[parentInstance][m_ws][nn][ind], function (m1) {
                            if ((new RegExp(pp + ":")).test(m1)) {
                                var m2 = $.trim(m1.replace(new RegExp(pp + ":", "g"), ""));
                                if (m2) {
                                    if (m2.indexOf("|") !== -1) {
                                        var m_vv = m2.split("|");
                                        m_vv.forEach(function (vv) {
                                            sv.push(vv);
                                        });
                                    } else {
                                        sv.push(m2);
                                    }
                                }
                            }
                        });
                    }
                }
            }

            var m_classes = (t_vis ? ' trigger-visibility' : '') + (l_vis ? ' listen-visibility' : '') +
                (t_req ? ' trigger-required' : '') + (l_req ? ' listen-required' : '') +
                (t_reqOr ? ' trigger-requiredOr' : '') + (l_reqOr ? ' listen-requiredOr' : '');
            var m_title = document.head.createShadowRoot ? name : d;

            switch (t) {
                case 'string':
                case 'number':
                    var m_pure_class = (t === 'string') ? 'pure-input-2-3' : 'pure-input-1-2',
                        m_type = (t === 'string') ? 'text' : 'number';
                    output.push(construct_input_element(m_pure_class, m_classes, m_type, 'parameter-' + id, name,
                        (sv.length ? sv[0] : ''), m_title, o) + get_tooltip_element('parameter-' + id, d));
                    if (m) {
                        output.push(get_add_button());
                        if (sv.length > 1) {
                            for (var i = 1; i < sv.length; i++) {
                                var m_new_id = window.com.xomena.geo.getNewId();
                                output.push('<br/>');
                                output.push(construct_input_element(m_pure_class, m_classes, m_type, 'parameter-' + id + '-' + m_new_id,
                                    name, sv[i], m_title, o) + get_tooltip_element('parameter-' + id + '-' + m_new_id, d));
                            }
                        }
                    }
                    break;
                case 'list':
                    var ao = o.split(";");
                    var m_options = '<option value=""></option>';
                    _.each(ao, function (opt) {
                        var a1 = opt.split("|");
                        var v = a1[0];
                        var l = a1.length > 1 ? a1[1] : a1[0];
                        m_options = [m_options, '<option value="', v, '"', (_.indexOf(sv, v) !== -1 ? ' selected' : ''), '>',
                            l, '</option>'].join("");
                    });
                    output.push('<select id="parameter-' + id + '" data-placeholder="--Select value--" name="' + name + '" class="pure-input-2-3 chosen-select' +
                        m_classes + '"' + (m ? ' multiple' : '') + (r ? ' required' : '') +
                        ' title="' + m_title + '"' + (max_v ? ' data-max-vals="' + max_v + '"' : '') + '>' + m_options + '</select>' +
                        get_tooltip_element('parameter-' + id, d));
                    break;
                case 'checkboxes':
                    output.push('<ul class="checkboxes">');
                    var ao = o.split(";");
                    _.each(ao, function (opt, ind) {
                        var a1 = opt.split("|");
                        var v = a1[0];
                        var l = a1.length > 1 ? a1[1] : a1[0];
                        output.push('<li>');
                        output.push('<label for="parameter-' + id + '-' + ind + '" title="' +
                            '" id="label-parameter-' + id + '-' + ind + '" class="pure-checkbox">');
                        output.push('<input type="checkbox" id="parameter-' + id + '-' + ind + '" name="' + name + '" value="' + v +
                            '"' + (_.indexOf(sv, v) !== -1 ? ' checked' : '') + (r ? ' required' : '') +
                            ' class="checkbox' + m_classes + '" />');
                        output.push(l);
                        output.push(get_tooltip_element('parameter-' + id + '-' + ind, d));
                        output.push('</label>');
                        output.push('</li>');
                    });
                    output.push('</ul>');
                    break;
                case 'checkbox':
                    var a1 = o.split("|");
                    var v = a1[0];
                    var l = a1.length > 1 ? a1[1] : a1[0];
                    output.push('<label for="parameter-' + id + '" title="' +
                        '" id="label-parameter-' + id + '" class="pure-checkbox">');
                    output.push('<input type="checkbox" id="parameter-' + id + '" name="' + name + '" value="' + v + '"' +
                        (_.indexOf(sv, v) !== -1 ? ' checked' : '') + (r ? ' required' : '') +
                        ' class="checkbox' + m_classes + '"/>');
                    output.push(l);
                    output.push(get_tooltip_element('parameter-' + id, d));
                    output.push('</label>');
                    break;
                case 'parts':
                    var parts = model.get("parts");
                    if (parts) {
                        if (m) {
                            output.push(get_add_parts_button());
                            output.push(get_remove_parts_button(sv.length > 1));
                        }
                        output.push('<ul class="parts-container' + (m ? ' multiple' : '') + '">');
                        parts.forEach(function (p) {
                            output.push('<li>');
                            output.push('<label for="parameter-' + id + '-' + p.get("id") + '-0">' + p.get('name') + '</label>');
                            output.push(window.com.xomena.geo.getFormElement(id + "-" + p.get("id") + "-0", name + ":" + p.get("name"),
                                p, { required: t_req }, null, parentInstance));
                            output.push('</li>');
                        });
                        output.push('</ul>');

                        if (m && sv.length > 1) {
                            for (var j = 1; j < sv.length; j++) {
                                output.push('<ul class="parts-container' + (m ? ' multiple' : '') + '">');
                                parts.forEach(function (p) {
                                    output.push('<li>');
                                    output.push('<label for="parameter-' + id + '-' + p.get("id") + '-' + j + '">' + p.get('name') + '</label>');
                                    output.push(window.com.xomena.geo.getFormElement(id + "-" + p.get("id") + "-" + j, name + ":" + p.get("name"),
                                        p, { required: t_req }, null, parentInstance));
                                    output.push('</li>');
                                });
                                output.push('</ul>');
                            }
                        }
                    }
                    break;
                case 'timestamp':
                    output.push(construct_input_element('pure-input-2-3', m_classes, 'text', 'parameter-' + id, name,
                        (sv.length ? sv[0] : ''), m_title) + get_tooltip_element('parameter-' + id, d));
                    break;
                default:
                    output.push(construct_input_element('pure-input-2-3', m_classes, 'text', 'parameter-' + id, name,
                        (sv.length ? sv[0] : ''), m_title) + get_tooltip_element('parameter-' + id, d));
                    if (m) {
                        output.push(get_add_button());
                        if (sv.length > 1) {
                            for (var i = 1; i < sv.length; i++) {
                                var m_new_id = window.com.xomena.geo.getNewId();
                                output.push('<br/>');
                                output.push(construct_input_element('pure-input-2-3', m_classes, 'text', 'parameter-' + id + '-' + m_new_id,
                                    name, sv[i], m_title) + get_tooltip_element('parameter-' + id + '-' + m_new_id, d));
                            }
                        }
                    }
            }
            output.push('</div>');
            return output.join("");
        },
        formatJSON: function (data) {
            var r = /(\"\w+?\":\"[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC\s\d]+?\",)/ig;

            var m_res = JSON.stringify(data).replace(/\[/ig, "[\n").replace(/\{/ig, "{\n").replace(/\]/ig, "\n]").replace(/\}/ig, "\n}").replace(r, "$1\n")
                .replace(/\},\{/ig, "},\n{").replace(/,(\"\w+\":\[)/ig, ",\n$1").replace(/,\"formatted_address\"/ig, ",\n\"formatted_address\"").replace(/,(\"\w+\":\{)/ig, ",\n$1")
                .replace(/\},(\"\w+\")/ig, "},\n$1").replace(/\],(\"\w+\")/ig, "],\n$1").replace(/,\"maneuver\":/ig, ",\n\"maneuver\":").replace(/,\"id\":/ig, ",\n\"id\":")
                .replace(/,\"width\":/ig, ",\n\"width\":").replace(/,\"reference\":/ig, ",\n\"reference\":").replace(/,\"scope\":/ig, ",\n\"scope\":")
                .replace(/,\"formatted_phone_number\":/ig, ",\n\"formatted_phone_number\":").replace(/,\"name\":/ig, ",\n\"name\":").replace(/,\"type\":/ig, ",\n\"type\":")
                .replace(/,\"language\":/ig, ",\n\"language\":").replace(/,\"text\":/ig, ",\n\"text\":").replace(/,\"time\":/ig, ",\n\"time\":")
                .replace(/,\"user_ratings_total\":/ig, ",\n\"user_ratings_total\":").replace(/,\"utc_offset\":/ig, ",\n\"utc_offset\":")
                .replace(/,\"vicinity\":/ig, ",\n\"vicinity\":").replace(/,\"website\":/ig, ",\n\"website\":").replace(/,\"offset\":/ig, ",\n\"offset\":").replace(/,\"value\":/ig, ",\n\"value\":")
                .replace(/,\"place_id\":/ig, ",\n\"place_id\":").replace(/,\"short_name\":/ig, ",\n\"short_name\":").replace(/,\"rating\":/ig, ",\n\"rating\":")
                .replace(/,\"longitude\":/ig, ",\n\"longitude\":").replace(/,\"placeId\":/ig, ",\n\"placeId\":").replace(/,\"message\":/ig, ",\n\"message\":")
                .replace(/,\"price_level\":/ig, ",\n\"price_level\":").replace(/,\"status\":/ig, ",\n\"status\":").replace(/,\"speedLimit\":/ig, ",\n\"speedLimit\":")
                .replace(/,\"units\":/ig, ",\n\"units\":").replace(/,\"rawOffset\":/ig, ",\n\"rawOffset\":").replace(/,\"timeZoneName\":/ig, ",\n\"timeZoneName\":");


            var arr = m_res.split("\n");
            var arr1 = [];
            var counter = 0;

            var m_tabs = function (count) {
                var a = [];
                for (var i = 0; i < count; i++) {
                    a.push("  ");
                }
                return a.join("");
            };

            var ispoints = false;
            var points = "";
            for (var i = 0; i < arr.length; i++) {
                if (!ispoints && arr[i].indexOf("\"points\":\"") !== -1) {
                    ispoints = true;
                    points = arr[i];
                    continue;
                }
                if (ispoints) {
                    points += arr[i];
                    if (arr[i].indexOf("\"") !== -1) {
                        arr1.push(m_tabs(counter) + points);
                        ispoints = false;
                        points = "";
                    }
                    continue;
                }
                if (arr[i].indexOf("}") !== -1 || arr[i].indexOf("]") !== -1) {
                    counter--;
                }
                arr1.push(m_tabs(counter) + arr[i]);
                if (arr[i].indexOf("{") !== -1 || arr[i].indexOf("[") !== -1) {
                    counter++;
                }
            }

            return arr1.join("\n");
        },
        /**
        * Retrieves an XML doc from the string value
        * @param   {String} txt The XML string
        * @returns {Object} xmlDoc object
        */
        getXMLDoc: function (txt) {
            var xmlDoc = null, parser;
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(txt, "text/xml");
            } else {
                // Internet Explorer
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(txt);
            }
            return xmlDoc;
        }
    };

    /*Define data models*/
    window.com.xomena.geo.Models.WebService = Backbone.Model.extend({
        defaults: {
            id: null,
            name: '',
            alias: '',
            basepath: 'https://maps.googleapis.com/maps/api/',
            output: ["json", "xml"],
            parameters: null,
            isApiary: false,
            jsonSuffix: 'json',
            xmlSuffix: 'xml',
            apiaryKeyFree: 'API_KEY',
            apiaryKeyM4W: '',
            render: '',
            isImagery: false,
            geocoderTool: false,
            automotive: false,
            isExperiment: true,
            svWizardTool: false,
            apiaryKeyPremium: 'API_KEY_PREMIUM',
            directionsTool: false,
            isEmbed: false
        }
    });

    window.com.xomena.geo.Models.Parameter = Backbone.Model.extend({
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
            placeholder: '',
            requiredOrGroup: false,
            condVisibility: '',
            m4wOnly: false,
            condRequired: '',
            condRequiredOr: '',
            deprecated: false,
            excludedGroup: null,
            includedGroup: null,
            maxValues: null
        }
    });

    window.com.xomena.geo.Models.ParameterInstance = Backbone.Model.extend({
        defaults: {
            id: null,
            name: null,
            model: null,
            value: null,
            triggerCondVisibility: false,
            listenCondVisibility: false,
            parentInstance: null,
            triggerCondRequired: false,
            listenCondRequired: false,
            triggerCondRequiredOr: false,
            listenCondRequiredOr: false,
            isRequired: false,
            isRequiredOr: false
        }
    });

    window.com.xomena.geo.Models.ParameterPart = Backbone.Model.extend({
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
            placeholder: '',
            requiredOrGroup: false,
            condVisibility: '',
            m4wOnly: false,
            condRequired: '',
            condRequiredOr: '',
            deprecated: false,
            urlEncoded: false,
            omitLabel: false,
            separator: '|',
            maxValues: null
        }
    });

    window.com.xomena.geo.Models.Instance = Backbone.Model.extend({
        defaults: {
            id: null,
            webservice: null,
            version: 'free',
            output: "json",
            parameters: null,
            services: null
        },
        initialize: function () {
            console.log('The instance ' + this.get("id") + ' has been initialized.');
            this.on('change', function () {
                console.log('Values for the instance ' + this.get("id") + ' have changed.');
            });
        },
        validation: {
            parameters: function (value) {
                console.log("Start parameters validation");
                var msg = [];
                var reqOrGroup = [];
                //Excluded group can have only one value
                var excludedGroups = Object.create(null);
                //Included group must have all values or nothing
                var includedGroups = Object.create(null);
                value.forEach(function (p) {
                    var m = p.get("model");
                    var n = p.get("name");
                    var v = p.get("value");
                    var r = m.get("required") || p.get("isRequired");
                    var t = m.get("type");
                    //Check required fields
                    if (r && (!v.length || (t === "parts" && !v[0].length))) {
                        msg.push("Parameter " + n + " is required.");
                    }
                    //Creating list of required one of
                    if (m.get("requiredOrGroup") || p.get("isRequiredOr")) {
                        reqOrGroup.push({
                            name: n,
                            value: v,
                            type: t
                        });
                    }
                    //Check field against pattern
                    var p = m.get("pattern");
                    if (p && v.length) {
                        var patt = new RegExp(p, "ig");
                        var notPassed = [];
                        _.each(v, function (val) {
                            if (!patt.test(val)) {
                                notPassed.push(val);
                            }
                            patt.lastIndex = 0;
                        });
                        if (notPassed.length) {
                            msg.push("The following values of " + n + " don't match the pattern:<br/>&nbsp;&nbsp;&nbsp;" + notPassed.join("<br/>&nbsp;&nbsp;&nbsp;"));
                        }
                    }
                    //Excluded groups
                    if (m.get("excludedGroup")) {
                        if (!excludedGroups[m.get("excludedGroup")]) {
                            excludedGroups[m.get("excludedGroup")] = [];
                        }
                        excludedGroups[m.get("excludedGroup")].push({
                            name: n,
                            value: v
                        });
                    }
                    //Included groups
                    if (m.get("includedGroup")) {
                        if (!includedGroups[m.get("includedGroup")]) {
                            includedGroups[m.get("includedGroup")] = [];
                        }
                        includedGroups[m.get("includedGroup")].push({
                            name: n,
                            value: v
                        });
                    }
                });
                //Check required one of
                if (reqOrGroup.length) {
                    var notEmptyPar = _.find(reqOrGroup, function (elem) {
                        return elem.type !== "parts" ? elem.value.length : (elem.value[0] && elem.value[0].length);
                    });
                    if (!notEmptyPar) {
                        var allNames = _.map(reqOrGroup, function (elem) { return elem.name; });
                        msg.push("One of these parameters is required:<br/>&nbsp;&nbsp;&nbsp;" + allNames.join("<br/>&nbsp;&nbsp;&nbsp;"));
                    }
                }
                //Check excluded groups
                if (_.keys(excludedGroups).length) {
                    _.each(_.keys(excludedGroups), function (grp) {
                        var f = _.filter(excludedGroups[grp], function (elem) {
                            return elem.value.length;
                        });
                        if (f.length > 1) {
                            var exclNames = _.map(excludedGroups[grp], function (elem) { return elem.name; });
                            msg.push("You can define only one of the following parameters:<br/>&nbsp;&nbsp;&nbsp;" + exclNames.join("<br/>&nbsp;&nbsp;&nbsp;"));
                        }
                    });
                }
                //Check included groups
                if (_.keys(includedGroups).length) {
                    _.each(_.keys(includedGroups), function (grp) {
                        var f1 = _.filter(includedGroups[grp], function (elem) {
                            return elem.value.length;
                        });
                        if (!(f1.length === 0 || f1.length === includedGroups[grp].length)) {
                            var inclNames = _.map(includedGroups[grp], function (elem) { return elem.name; });
                            msg.push("You must define all parameters for the following group:<br/>&nbsp;&nbsp;&nbsp;" + inclNames.join("<br/>&nbsp;&nbsp;&nbsp;"));
                        }
                    });
                }
                console.log("End parameters validation");
                if (msg.length) {
                    var warn = msg.join("<br/>");
                    $("#validation-dialog").find("p.validation-content").html(warn).end().get(0).open();
                    return warn;
                }
            },
            output: function (value) {
                if (!value) {
                    var warn = "Please set the output format to JSON or XML if available";
                    $("#validation-dialog").find("p.validation-content").html(warn).end().get(0).open();
                    return warn;
                }
            },
            version: function (value) {
                if (!value) {
                    var warn = "Please set the version to Free or For Work";
                    $("#validation-dialog").find("p.validation-content").html(warn).end().get(0).open();
                    return warn;
                }
            }
        },
        getURL: function (shareable) {
            var res = [];
            var m_service = this.get("webservice");
            var ver = this.get("version");
            var m_isApiary = false;
            if (m_service) {
                var m_services = this.get("services");
                var service = m_services.filterById(parseInt(m_service));
                if ($.isArray(service) && service.length) {
                    m_isApiary = service[0].get("isApiary");
                    res.push(service[0].get("basepath"));
                    res.push(service[0].get("alias"));
                    var m_output = "";
                    if (this.get("output") === "json" && service[0].get("jsonSuffix") !== "empty") {
                        m_output = service[0].get("jsonSuffix");
                    }
                    if (this.get("output") === "xml" && service[0].get("xmlSuffix") !== "empty") {
                        m_output = service[0].get("xmlSuffix");
                    }
                    if (m_output) {
                        res.push("/");
                        res.push(m_output);
                    }
                    res.push("?");

                    var pars = this.get("parameters");
                    var aa = "";
                    if (pars) {
                        pars.forEach(function (p) {
                            var m = p.get("model");
                            var sep = m.get("separator");
                            var n = p.get("name");
                            var v = p.get("value");
                            var t = m.get("type");
                            var repl = [];
                            var doubleEnc = [];
                            if (t === "parts") {
                                var parts = m.get("parts");
                                if (parts && parts.length) {
                                    parts.forEach(function (pp) {
                                        if (pp.get("omitLabel")) {
                                            repl.push(pp.get("name") + ":");
                                        }
                                        if (pp.get("urlEncoded")) {
                                            doubleEnc.push(pp.get("name") + ":");
                                        }
                                    });
                                }
                            }
                            if (v && $.isArray(v) && v.length) {
                                //Parts is a subarray, so we have to transform it to string
                                var v1 = [];
                                _.each(v, function (el, ind) {
                                    if ($.isArray(el)) {
                                        if (doubleEnc.length) {
                                            doubleEnc.forEach(function (de) {
                                                el.forEach(function (e1, i1, a1) {
                                                    if (e1.startsWith(de)) {
                                                        var _e1 = e1.replace(de, "");
                                                        a1[i1] = de + encodeURI(_e1);
                                                    }
                                                });
                                            });
                                        }
                                        v1[ind] = el.join("|");
                                    } else {
                                        v1[ind] = $.trim(el);
                                    }
                                });
                                v1 = _.filter(v1, function (e2) {
                                    return e2 ? true : false;
                                });
                                var v2 = v1.join(sep);
                                if (repl.length) {
                                    repl.forEach(function (rp) {
                                        v2 = v2.replace(new RegExp(rp, "g"), "");
                                    });
                                }
                                var m_encval = encodeURIComponent(v2);
                                if (sep !== "|") {
                                    m_encval = m_encval.replace(new RegExp(encodeURIComponent(sep), "g"), sep);
                                }
                                if (m_encval) {
                                    res.push(aa);
                                    res.push(n);
                                    if (m_encval !== "omitvalue") {
                                        res.push("=");
                                        res.push(m_encval);
                                    }
                                }
                                aa = "&";
                            }
                        });
                    }

                    if (!shareable) {
                        if (ver === "free") {
                            if (window.com.xomena.geo.config.get(service[0].get("apiaryKeyFree"))) {
                                res.push(aa);
                                res.push("key=");
                                res.push(window.com.xomena.geo.config.get(service[0].get("apiaryKeyFree")));
                            } else {
                                //Requests without API key are deprecated
                                $("#validation-dialog").find("p.validation-content").html("Please configure the Standard API key").end().get(0).open();
                                return "";
                            }
                        } else if (ver === "automotive") {
                            var autoClientID = $("#ws-version-automotive-" + this.get("id")).attr("data-clientid");
                            var autoAPIKey = $("#ws-version-automotive-" + this.get("id")).attr("data-apikey");
                            if (autoClientID) {
                                res.push(aa);
                                res.push("client=");
                                res.push(autoClientID);
                            }
                            if (autoAPIKey) {
                                res.push(aa);
                                res.push("key=");
                                res.push(autoAPIKey);
                            }
                        } else if (ver === "premium-key") {
                            if (window.com.xomena.geo.config.get(service[0].get("apiaryKeyPremium"))) {
                                res.push(aa);
                                res.push("key=");
                                res.push(window.com.xomena.geo.config.get(service[0].get("apiaryKeyPremium")));
                            } else {
                                //Requests without API key are deprecated
                                $("#validation-dialog").find("p.validation-content").html("Please configure the Premium API key").end().get(0).open();
                                return "";
                            }
                        } else if (ver === "premium-client") {
                            if (m_isApiary) {
                                if (window.com.xomena.geo.config.get(service[0].get("apiaryKeyPremium"))) {
                                    res.push(aa);
                                    res.push("key=");
                                    res.push(window.com.xomena.geo.config.get(service[0].get("apiaryKeyPremium")));
                                } else {
                                    //Requests without API key are deprecated
                                    $("#validation-dialog").find("p.validation-content").html("Please configure the Premium API key").end().get(0).open();
                                    return "";
                                }
                            } else {
                                if (window.com.xomena.geo.config.get("CLIENT_ID_PREMIUM")) {
                                    res.push(aa);
                                    res.push("client=");
                                    res.push(window.com.xomena.geo.config.get("CLIENT_ID_PREMIUM"));
                                } else {
                                    $("#validation-dialog").find("p.validation-content").html("Please configure the Premium Client ID").end().get(0).open();
                                    return "";
                                }
                            }
                        } else {
                            if (m_isApiary) {
                                if (window.com.xomena.geo.config.get(service[0].get("apiaryKeyM4W"))) {
                                    res.push(aa);
                                    res.push("key=");
                                    res.push(window.com.xomena.geo.config.get(service[0].get("apiaryKeyM4W")));
                                } else {
                                    //Requests without API key are deprecated
                                    $("#validation-dialog").find("p.validation-content").html("Please configure Maps for Work API key").end().get(0).open();
                                    return "";
                                }
                            } else {
                                if (window.com.xomena.geo.config.get("CLIENT_ID")) {
                                    res.push(aa);
                                    res.push("client=");
                                    res.push(window.com.xomena.geo.config.get("CLIENT_ID"));
                                } else {
                                    $("#validation-dialog").find("p.validation-content").html("Please configure Maps for Work Client ID").end().get(0).open();
                                    return "";
                                }
                            }
                        }
                    }
                }
            }
            var m_join = res.join("");
            if (!m_isApiary && m_join && !shareable) {
                var cr_key;
                switch (ver) {
                    case "work":
                        cr_key = "CRYPTO_KEY";
                        break;
                    case "premium-client":
                        cr_key = "CRYPTO_KEY_PREMIUM";
                        break;
                }
                if (cr_key) {
                    var m_crypto_key = window.com.xomena.geo.config.get(cr_key);
                    if (m_crypto_key) {
                        //debugger;
                        var m_path = m_join.replace("https://maps.googleapis.com", "");

                        var k1 = m_crypto_key.replace(/\-/g, '+').replace(/\_/g, '/');
                        var k2 = CryptoJS.enc.Base64.parse(k1);

                        var m_hash = CryptoJS.HmacSHA1(m_path, k2);
                        var m_signature = CryptoJS.enc.Base64.stringify(m_hash);

                        m_signature = m_signature.replace(/\+/g, '-').replace(/\//g, '_');
                        m_join += "&signature=" + m_signature;
                    } else {
                        $("#validation-dialog").find("p.validation-content").html("Please configure your Cryptographic Key").end().get(0).open();
                        return "";
                    }
                }
            }

            if (m_join.length > 8192 && !shareable) {
                $("#validation-dialog").find("p.validation-content").html("URL is longer than 8192 symbols").end().get(0).open();
            }
            return m_join;
        },

        getShareURL: function () {
            var m_url = this.getURL(true);
            m_url = com.xomena.geo.appURL + "#instance:" + this.get("id") + "=" + encodeURIComponent(m_url);
            return m_url;
        },

        getParameterValue: function (pname) {
            var res = null,
                pars = this.get("parameters");
            if (pars) {
                pars.forEach(function (p) {
                    if (p.get("name") === pname) {
                        res = p.get("value");
                    }
                });
            }
            return res;
        },

        getToolsURLs: function () {
            var m_links = [];
            var m_service = this.get("webservice");
            if (m_service) {
                var m_services = this.get("services");
                var service = m_services.filterById(parseInt(m_service));
                if ($.isArray(service) && service.length) {
                    var m_geocoder = service[0].get("geocoderTool");
                    var m_svwizard = service[0].get("svWizardTool");
                    var m_directions = service[0].get("directionsTool");
                    if (m_geocoder) {
                        var pars = this.get("parameters");
                        var aa = "";
                        var res = [];
                        var hasOptions = false;
                        if (pars) {
                            pars.forEach(function (p) {
                                var n = p.get("name");
                                var v = p.get("value");
                                switch (n) {
                                    case "address":
                                    case "latlng":
                                        if (v && $.isArray(v) && v.length) {
                                            res.push(aa);
                                            res.push("q");
                                            res.push("=");
                                            //Geocoder tool relies on deprecated escape() here
                                            res.push(escape(v[0]));
                                            aa = "&";
                                        }
                                        break;
                                    case "place_id":
                                        if (v && $.isArray(v) && v.length) {
                                            res.push(aa);
                                            res.push("place_id");
                                            res.push("=");
                                            res.push(v[0]);
                                            aa = "&";
                                        }
                                        break;
                                    case "components":
                                        if (v && $.isArray(v) && v.length) {
                                            if (v[0] && $.isArray(v[0])) {
                                                v[0].forEach(function (val) {
                                                    var m_arr = val.split(":");
                                                    res.push(aa);
                                                    res.push("in_" + m_arr[0]);
                                                    res.push("=");
                                                    //Geocoder tool relies on deprecated escape() here
                                                    res.push(escape(m_arr[1]));
                                                    aa = "&";
                                                });
                                                hasOptions = true;
                                            }
                                        }
                                        break;
                                    case "region":
                                        if (v && $.isArray(v) && v.length) {
                                            res.push(aa);
                                            res.push("country");
                                            res.push("=");
                                            res.push(encodeURIComponent(v[0]));
                                            aa = "&";
                                            hasOptions = true;
                                        }
                                        break;
                                    case "new_forward_geocoder":
                                        if (v && $.isArray(v) && v.length) {
                                            res.push(aa);
                                            res.push("nfw");
                                            res.push("=");
                                            res.push(v[0] === "true" ? "1" : "0");
                                            aa = "&";
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            });
                        }
                        if (hasOptions) {
                            res.push(aa);
                            res.push("options");
                            res.push("=");
                            res.push("true");
                        }
                        m_links.push('<a href="' + window.com.xomena.geo.tools.geocoder + encodeURIComponent(res.join('')) +
                            '" title="Geocoder Tool" target="_blank">Open in Geocoder Tool</a>&nbsp;☝️');
                    }
                    if (m_svwizard) {
                        var pars = this.get("parameters");
                        var aa = "";
                        var res = [];
                        if (pars) {
                            pars.forEach(function (p) {
                                var n = p.get("name");
                                var v = p.get("value");
                                if ($.isArray(v) && v.length) {
                                    res.push(aa);
                                    res.push(n);
                                    res.push("=");
                                    res.push(v[0]);
                                    aa = "&";
                                }
                            });
                        }
                        m_links.push('<a href="' + window.com.xomena.geo.tools.svwizard + encodeURIComponent(res.join('')) +
                            '" title="Street View Wizard" target="_blank">Open in Street View Wizard</a>&nbsp;☝️');
                    }
                    if (m_directions) {
                        //It looks like now Directions calculator accepts the same parameters as web service
                        var pars = this.get("parameters");
                        var aa = "";
                        var res = [];
                        if (pars) {
                            pars.forEach(function (p) {
                                var n = p.get("name");
                                var v = p.get("value");
                                if ($.isArray(v) && v.length) {
                                    res.push(aa);
                                    res.push(n);
                                    res.push("=");
                                    res.push(encodeURIComponent(v.join('|')));
                                    aa = "&";
                                }
                            });
                        }
                        m_links.push('<a href="' + window.com.xomena.geo.tools.directions + res.join('') + '" title="Directions Calculator" target="_blank">Open in Directions Calculator</a>&nbsp;☝️');
                    }
                }
            }
            return m_links;
        },
        isImageryInstance: function () {
            var m_res = false;
            var m_service = this.get("webservice");
            if (m_service) {
                var m_services = this.get("services");
                var service = m_services.filterById(parseInt(m_service));
                if ($.isArray(service) && service.length) {
                    m_res = service[0].get("isImagery");
                }
            }
            return m_res;
        },
        isEmbedInstance: function () {
            var m_res = false;
            var m_service = this.get("webservice");
            if (m_service) {
                var m_services = this.get("services");
                var service = m_services.filterById(parseInt(m_service));
                if ($.isArray(service) && service.length) {
                    m_res = service[0].get("isEmbed");
                }
            }
            return m_res;
        }
    });

    window.com.xomena.geo.Models.Config = Backbone.Model.extend({
        defaults: {
            API_KEY: null,
            CLIENT_ID: null,
            CRYPTO_KEY: null,
            SERVER_URL: null,
            PLACES_API_KEY: null,
            ROADS_API_KEY: null,
            AUTO_EXEC_ONLOAD: false,
            EXT_ID: null,
            API_KEY_PREMIUM: null,
            CLIENT_ID_PREMIUM: null,
            CRYPTO_KEY_PREMIUM: null
        }
    });


    /*Define data collections*/
    window.com.xomena.geo.Collections.ParameterPartCollection = Backbone.Collection.extend({
        model: window.com.xomena.geo.Models.ParameterPart
    });

    window.com.xomena.geo.Collections.ParameterInstanceCollection = Backbone.Collection.extend({
        model: window.com.xomena.geo.Models.ParameterInstance,
        filterById: function (id) {
            return this.models.filter(
                function (c) {
                    return id === c.get("id");
                }
            );
        },
        filterByName: function (name) {
            return this.models.filter(
                function (c) {
                    return name === c.get("name");
                }
            );
        }
    });

    window.com.xomena.geo.Collections.WebServiceCollection = Backbone.Collection.extend({
        model: window.com.xomena.geo.Models.WebService,
        filterById: function (id) {
            return this.models.filter(
                function (c) {
                    return id === c.get("id");
                }
            );
        },
        filterByAlias: function (alias) {
            return this.models.filter(
                function (c) {
                    return alias === c.get("alias");
                }
            );
        },
        filterByName: function (name) {
            return this.models.filter(
                function (c) {
                    return name === c.get("name");
                }
            );
        }
    });

    window.com.xomena.geo.Collections.InstanceCollection = Backbone.Collection.extend({
        model: window.com.xomena.geo.Models.Instance,
        url: '/instances',
        localStorage: new Backbone.LocalStorage("com.xomena.geo.Collections.Instances")
    });

    window.com.xomena.geo.services = new window.com.xomena.geo.Collections.WebServiceCollection();

    /*Define views*/
    window.com.xomena.geo.Views.InstanceView = Backbone.View.extend({
        tagName: 'li',
        className: 'ws-instance',
        execInstance: function () {
            console.log("Start execution for instance #" + this.model.get("id"));
            var self = this;
            document.querySelector("#ws-url-" + this.model.get("id")).textarea.value = "Preparing request please wait...";
            document.querySelector("#share-ws-url-" + this.model.get("id")).textarea.value = "Preparing request please wait...";
            this.$("#treeview-" + this.model.get("id")).html("");
            this.syncParameters();
            this.model.set("version", this.$("input[name='ws-version-val-" + this.model.get("id") + "']:checked").val());
            this.model.set("output", this.$("input[name='output-" + this.model.get("id") + "']:checked").val());
            jem.fire('InstanceUpdated', {
                instance: this.model
            });
            var isValid;
            if (this.model.isImageryInstance() || this.model.isEmbedInstance()) {
                isValid = this.model.isValid("version") && this.model.isValid("parameters");
            } else {
                isValid = this.model.isValid("version") && this.model.isValid("output") && this.model.isValid("parameters");
            }
            if (isValid) {
                var m_url = this.model.getURL();
                document.querySelector("#ws-url-" + this.model.get("id")).textarea.value = m_url;
                var m_share_url = this.model.getShareURL();
                document.querySelector("#share-ws-url-" + this.model.get("id")).textarea.value = m_share_url;
                if (!this.model.isImageryInstance() && !this.model.isEmbedInstance()) {
                    if (m_url && window.com.xomena.geo.config.get("SERVER_URL")) {
                        $.ajax({
                            url: window.com.xomena.geo.config.get("SERVER_URL"),
                            contentType: "application/json; charset=utf-8",
                            dataType: self.model.get("output") == "json" ? "json" : "text",
                            type: "POST",
                            crossDomain: true,
                            async: true,
                            data: JSON.stringify({
                                uri: m_url,
                                version: self.model.get("version"),
                                output: self.model.get("output")
                            }),
                            success: function (data) {
                                if ($.type(data) == "string") {
                                    self.$("#ws-result-" + self.model.get("id")).html("<pre><code class='xml'>" + $.trim(data).replace(/</ig, "&lt;").replace(/>/ig, "&gt;") + "</code></pre>");
                                    var x2js = new X2JS();
                                    var xmldoc = window.com.xomena.geo.getXMLDoc($.trim(data));
                                    if (xmldoc) {
                                        var jsonObj = x2js.xml2json(xmldoc);
                                        self.$("#treeview-" + self.model.get("id")).jsonView(jsonObj, { collapsed: true });
                                    } else {
                                        self.$("#treeview-" + self.model.get("id")).jsonView({});
                                    }
                                } else {
                                    self.$("#ws-result-" + self.model.get("id")).html("<pre><code class='json'>" + window.com.xomena.geo.formatJSON(data) + "</code></pre>");
                                    self.$("#treeview-" + self.model.get("id")).jsonView(data, { collapsed: true });
                                }
                                self.$("#treeview-" + self.model.get("id")).css("max-width", function () {
                                    return $(this).parents(".pure-g").width();
                                });
                                hljs.highlightBlock(self.$("#ws-result-" + self.model.get("id")).get(0));
                                self.renderMap(data);
                                self.addToolsLinks();
                                self.$("#clone-instance-" + self.model.get("id")).removeAttr("disabled");
                                //Talk to external part
                                if (window.com.xomena.geo.port) {
                                    window.com.xomena.geo.port.postMessage({
                                        type: "ws-exec",
                                        model: self.model.get("id")
                                    });
                                }
                            },
                            error: function (jqXHR, textStatus, errorThrown) {
                                console.log("Server side error: " + textStatus + " - " + errorThrown);
                                self.$("#treeview-" + self.model.get("id")).jsonView({});
                            }
                        });
                    } else {
                        this.$("#ws-result-" + this.model.get("id")).html("");
                        this.$("#ws-tools-links-" + this.model.get("id")).html("");
                        this.$("#treeview-" + this.model.get("id")).jsonView({});
                    }
                } else {
                    if (this.model.isImageryInstance()) {
                        var m_img_content = "";
                        if (m_url) {
                            m_img_content = '<img src="' + m_url + '" title="" alt="" />';
                        }
                        this.$("#ws-result-" + this.model.get("id")).html(m_img_content);
                        this.$("#treeview-" + this.model.get("id")).jsonView({});
                        this.addToolsLinks();
                        this.renderMap({ isImageryAPI: true });
                        this.$("#clone-instance-" + this.model.get("id")).removeAttr("disabled");
                        //Talk to external part
                        if (window.com.xomena.geo.port) {
                            window.com.xomena.geo.port.postMessage({
                                type: "ws-exec",
                                model: this.model.get("id")
                            });
                        }
                    } else if (this.model.isEmbedInstance()) {
                        var m_iframe_content = "";
                        if (m_url) {
                            m_iframe_content = '<iframe width="100%" height="540" frameborder="0" style="border:0" src="' + m_url + '" allowfullscreen></iframe>';
                        }
                        this.$("#ws-result-" + this.model.get("id")).html(m_iframe_content);
                        this.$("#treeview-" + this.model.get("id")).jsonView({});
                        this.addToolsLinks();
                        this.renderMap({ isEmbed: true });
                        this.$("#clone-instance-" + this.model.get("id")).removeAttr("disabled");
                        //Talk to external part
                        if (window.com.xomena.geo.port) {
                            window.com.xomena.geo.port.postMessage({
                                type: "ws-exec",
                                model: this.model.get("id")
                            });
                        }
                    }
                }
            } else {
                document.querySelector("#ws-url-" + this.model.get("id")).textarea.value = "Please set valid parameters";
                document.querySelector("#share-ws-url-" + this.model.get("id")).textarea.value = "Please set valid parameters";
                this.$("#treeview-" + this.model.get("id")).jsonView({});
            }
            return false;
        },
        execInstanceWithDelay: function (delay) {
            delay = delay || 500;
            var self = this;
            setTimeout(function () {
                self.execInstance();
            }, delay);
        },
        deleteInstance: function (ev) {
            ev.preventDefault();
            console.log("Delete instance #" + this.model.get("id"));
            delete window.com.xomena.geo.instanceViewsMap[this.model.get("id")];
            window.com.xomena.mapRenderer.removeInstance(this.model.get("id"));
            this.model.destroy(); // deletes the model when delete button clicked
            return false;
        },
        cloneInstance: function (ev) {
            ev.preventDefault();
            console.log("Clone instance #" + this.model.get("id"));

            // Generate four random hex digits.
            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }

            // Generate a pseudo-GUID by concatenating random hexadecimal.
            function guid() {
                return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            }

            var ws = this.model.get("webservice");
            var params = this.model.get("parameters");
            if (ws && params) {
                this.storeValues();

                var m_instance = new window.com.xomena.geo.Models.Instance({
                    id: guid(),
                    services: window.com.xomena.geo.services,
                    output: this.model.get("output"),
                    version: this.model.get("version"),
                    webservice: ws
                });

                window.com.xomena.geo.storedValues[m_instance.get("id")] = {};
                window.com.xomena.geo.storedValues[m_instance.get("id")][ws] = window.com.xomena.geo.storedValues[this.model.get("id")][ws];

                jem.fire('InstanceCloned', {
                    instance: m_instance
                });
            }
            return false;
        },
        chooseWebService: function (ev) {
            var self = this;
            this.storeValues();
            this.model.set("webservice", ev.target.value);
            if (ev.target.value) {
                var services = this.model.get("services");
                var service = services.filterById(parseInt(ev.target.value));
                var params = service[0].get("parameters");
                var parinstance_col = new window.com.xomena.geo.Collections.ParameterInstanceCollection();
                _.each(params, function (p) {
                    parinstance_col.add(new window.com.xomena.geo.Models.ParameterInstance({
                        id: window.com.xomena.geo.getNewId(),
                        name: p.get("name"),
                        model: p,
                        parentInstance: self.model.get("id")
                    }));
                });
                this.model.set("parameters", parinstance_col);
                var paramsView = new window.com.xomena.geo.Views.ParametersView({ collection: parinstance_col });
                paramsView.render();
                this.$(".ws-parameters").html(paramsView.el);
                this.$(".chosen-select").each(function () {
                    var max_v = $(this).attr("data-max-vals");
                    var chosen_opt = {
                        allow_single_deselect: true
                    };
                    if (max_v) {
                        chosen_opt["max_selected_options"] = parseInt(max_v);
                    }
                    $(this).chosen(chosen_opt);
                });
                this.$("#exec-instance-" + this.model.get("id")).removeAttr("disabled");
                this.$("#clone-instance-" + this.model.get("id")).attr("disabled", "disabled");
                this.setParametersVisibility();
                this.setM4WVisibility();
                this.setParametersRequired();
                this.setParametersRequiredOr();
                if (!service[0].get("jsonSuffix")) {
                    $("#output-json-" + this.model.get("id")).prop("disabled", "disabled");
                    $("#output-json-" + this.model.get("id")).removeAttr("checked");
                } else {
                    $("#output-json-" + this.model.get("id")).removeAttr("disabled");
                }
                if (!service[0].get("xmlSuffix")) {
                    $("#output-xml-" + this.model.get("id")).prop("disabled", "disabled");
                    $("#output-xml-" + this.model.get("id")).removeAttr("checked");
                } else {
                    $("#output-xml-" + this.model.get("id")).removeAttr("disabled");
                }
                //Talk to external part
                if (window.com.xomena.geo.port) {
                    window.com.xomena.geo.port.postMessage({
                        type: "ws-choose",
                        model: this.model.get("id"),
                        automotive: service[0].get("automotive"),
                        version: this.model.get("version")
                    });
                }
            } else {
                this.$(".ws-parameters").html("");
                this.$("#exec-instance-" + this.model.get("id")).attr("disabled", "disabled");
                this.$("#clone-instance-" + this.model.get("id")).attr("disabled", "disabled");
                $("#output-json-" + this.model.get("id")).removeAttr("disabled");
                $("#output-json-" + this.model.get("id")).prop("checked", "checked");
                $("#output-xml-" + this.model.get("id")).removeAttr("disabled");
                $("#output-xml-" + this.model.get("id")).removeAttr("checked");
            }
        },
        toggleWs: function () {
            if (this.$(".two-cols").hasClass("hidden")) {
                this.$(".two-cols").removeClass("hidden");
            } else {
                this.$(".two-cols").addClass("hidden");
            }
        },
        toggleShareURL: function () {
            if (this.$(".ws-url-share").hasClass("hidden")) {
                this.$(".ws-url-share").removeClass("hidden");
                this.$(".toggle-share-ws-url").html("Hide shareable URL");
            } else {
                this.$(".ws-url-share").addClass("hidden");
                this.$(".toggle-share-ws-url").html("Show shareable URL");
            }
        },
        events: {
            'click .exec': 'execInstance',
            'click .delete': 'deleteInstance',
            'click .clone': 'cloneInstance',
            'change .ws-choose': 'chooseWebService',
            'click .ws-toggle': 'toggleWs',
            'click .ws-version-fs [type="radio"]': 'toggleVersion',
            'click .toggle-share-ws-url': 'toggleShareURL'
        },
        newTemplate: _.template($('#instanceTemplate').html()), // external template
        exportTemplate: _.template($('#instanceExportTemplate').html()),
        initialize: function () {
            this.render(); // render is an optional function that defines the logic for rendering a template
            this.model.on('destroy', this.remove, this); // calls remove function once model deleted
        },
        render: function () {
            this.$el.html(this.newTemplate(this.model.toJSON())); // calls the template
        },
        renderExport: function () {
            $("#export-instances").append(this.exportTemplate(this.model.toJSON()));
        },
        remove: function () {
            this.$el.remove(); // removes the HTML element from view when delete button clicked/model deleted
            return false;
        },
        setParametersVisibility: function () {
            var parameters = this.model.get("parameters");
            if (!parameters) {
                return;
            }
            parameters.forEach(function (p) {
                if (p.get("listenCondVisibility")) {
                    var m = p.get("model");
                    var c = m.get("condVisibility");
                    var r = c;
                    var reParam = /[a-z_]+:\[.+\]/g;
                    if (c) {
                        var matches = c.match(reParam);
                        if (matches) {
                            _.each(matches, function (match) {
                                var arr1 = match.split(":");
                                var mp = parameters.filterByName(arr1[0]);
                                var condv = arr1[1].replace(/\[/g, "").replace(/\]/g, "").split(",");
                                var mpv = mp[0].get("value");
                                var res = false;
                                if ($.isArray(condv) && $.isArray(mpv) && mpv.length > 0) {
                                    var inters = _.intersection(condv, mpv);
                                    res = inters.length > 0;
                                } else if ($.isArray(condv) && _.indexOf(condv, "") !== -1 && (mpv == null || mpv.length === 0)) {
                                    res = true;
                                }
                                r = r.replace(new RegExp(match.replace(/\[/g, "\\[").replace(/\]/g, "\\]")), "" + res);
                            });
                        }
                        var vis = eval(r);
                        if (vis) {
                            $("#ws-param-" + p.get("id")).show();
                        } else {
                            $("#ws-param-" + p.get("id")).hide();
                            $("#parameter-" + p.get("id")).val("");
                            $("#ws-param-" + p.get("id")).find("[id^='parameter-" + p.get("id") + "-']").each(function () {
                                if ($(this).attr("type") === "checkbox") {
                                    this.checked = false;
                                } else {
                                    $(this).val("");
                                }
                            });
                        }
                    }
                }
            });
        },
        setM4WVisibility: function () {
            var self = this;
            var parameters = this.model.get("parameters");
            if (!parameters) {
                return;
            }
            parameters.forEach(function (p) {
                var m = p.get("model");
                if (m.get("m4wOnly")) {
                    if (self.model.get("version") === "work" || self.model.get("version") === "premium-key" || self.model.get("version") === "premium-client" || self.model.get("version") === "automotive") {
                        $("#ws-param-" + p.get("id")).show();
                    } else {
                        $("#ws-param-" + p.get("id")).hide();
                        $("#parameter-" + p.get("id")).val("");
                        $("#ws-param-" + p.get("id")).find("[id^='parameter-" + p.get("id") + "-']").each(function () {
                            $(this).val("");
                        });
                    }
                }
            });
        },
        setParametersRequired: function () {
            var parameters = this.model.get("parameters");
            if (!parameters) {
                return;
            }
            parameters.forEach(function (p) {
                if (p.get("listenCondRequired")) {
                    var m = p.get("model");
                    var c = m.get("condRequired");
                    var r = c;
                    //Means this field has one of the values
                    var reParam = /[a-z_]+:\[.+\]/g;
                    if (c) {
                        var matches = c.match(reParam);
                        if (matches) {
                            _.each(matches, function (match) {
                                var arr1 = match.split(":");
                                var mp = parameters.filterByName(arr1[0]);
                                var condv = arr1[1].replace(/\[/g, "").replace(/\]/g, "").split(",");
                                var mpv = mp[0].get("value");
                                var res = false;
                                if ($.isArray(condv) && $.isArray(mpv) && mpv.length > 0) {
                                    var inters = _.intersection(condv, mpv);
                                    res = inters.length > 0;
                                } else if ($.isArray(condv) && _.indexOf(condv, "") !== -1 && (mpv == null || mpv.length === 0)) {
                                    res = true;
                                }
                                r = r.replace(new RegExp(match.replace(/\[/g, "\\[").replace(/\]/g, "\\]")), "" + res);
                            });
                        } else {
                            //Means not empty value for some field
                            reParam = /\{\{[a-z_:]+\}\}/g;
                            var matches = c.match(reParam);
                            if (matches) {
                                _.each(matches, function (match) {
                                    var a1 = match.replace("{{", "").replace("}}", "").split(":");
                                    var mp1 = parameters.filterByName(a1[0]);
                                    var v1 = mp1[0].get("value");
                                    var res1 = false;
                                    if ($.isArray(v1)) {
                                        if (a1.length > 1) {
                                            res1 = _.some(v1, function (e1) {
                                                return _.some(e1, function (e2) {
                                                    return e2.startsWith(a1[1] + ":");
                                                });
                                            });
                                        } else {
                                            res1 = _.some(v1, function (e1) {
                                                return e1 ? true : false;
                                            });
                                        }
                                    } else {
                                        res1 = v1 ? true : false;
                                    }
                                    r = r.replace(new RegExp(match.replace(/\{/g, "\\{").replace(/\}/g, "\\}")), "" + res1);
                                });
                            }
                        }
                        var req = eval(r);
                        if (req) {
                            p.set("isRequired", true);
                        } else {
                            p.set("isRequired", false);
                        }
                        jem.fire('SetConditionalRequired', {
                            parameter: p
                        });
                    }
                }
            });
        },
        setParametersRequiredOr: function () {
            var parameters = this.model.get("parameters");
            if (!parameters) {
                return;
            }
            parameters.forEach(function (p) {
                if (p.get("listenCondRequiredOr")) {
                    var m = p.get("model");
                    var c = m.get("condRequiredOr");
                    var r = c;
                    var reParam = /[a-z_]+:\[.+\]/g;
                    if (c) {
                        var matches = c.match(reParam);
                        if (matches) {
                            _.each(matches, function (match) {
                                var arr1 = match.split(":");
                                var mp = parameters.filterByName(arr1[0]);
                                var condv = arr1[1].replace(/\[/g, "").replace(/\]/g, "").split(",");
                                var mpv = mp[0].get("value");
                                var res = false;
                                if ($.isArray(condv) && $.isArray(mpv) && mpv.length > 0) {
                                    var inters = _.intersection(condv, mpv);
                                    res = inters.length > 0;
                                } else if ($.isArray(condv) && _.indexOf(condv, "") !== -1 && (mpv == null || mpv.length === 0)) {
                                    res = true;
                                }
                                r = r.replace(new RegExp(match.replace(/\[/g, "\\[").replace(/\]/g, "\\]")), "" + res);
                            });
                        }
                        var req = eval(r);
                        if (req) {
                            p.set("isRequiredOr", true);
                        } else {
                            p.set("isRequiredOr", false);
                        }
                        jem.fire('SetConditionalRequiredOr', {
                            parameter: p
                        });
                    }
                }
            });
        },
        syncParameters: function () {
            var self = this;
            var params = this.model.get("parameters");
            if (!params) {
                return;
            }
            params.forEach(function (p) {
                var m = p.get("model");
                var t = m.get("type");
                var n = p.get("name");
                var v = [];
                self.$("input[name^='" + n + "'], select[name^='" + n + "']").each(function () {
                    if (t === "list") {
                        var val = $(this).val();
                        if ($.isArray(val)) {
                            v = _.union(v, val);
                        } else {
                            if (val) {
                                v.push(val);
                            }
                        }
                    } else if (t === 'parts') {
                        var prts = m.get("parts");
                        var m_n = $(this).attr("name");
                        var m_id = $(this).attr("id");
                        var prefix = m_n.split(":")[1];
                        var val = $(this).val();
                        var index = Number(m_id.split("-")[3]);
                        if (!v[index]) {
                            v[index] = [];
                        }
                        if ($.isArray(val)) {
                            var m_sep = "|";
                            if (prts && prts.length) {
                                prts.forEach(function (pp) {
                                    if (pp.get("name") === prefix) {
                                        m_sep = pp.get("separator");
                                    }
                                });
                            }
                            v[index].push(prefix + ":" + val.join(m_sep));
                        } else {
                            if (val) {
                                v[index].push(prefix + ":" + val);
                            }
                        }
                    } else if (t === 'checkboxes') {
                        if (this.checked) {
                            var val = $(this).val();
                            if (val) {
                                v.push(val);
                            }
                        }
                    } else if (t === 'checkbox') {
                        if (this.checked) {
                            var val = $(this).val();
                            v.push(val);
                        }
                    } else {
                        var val = $(this).val();
                        if (val) {
                            v.push(val);
                        }
                    }
                });
                p.set("value", v);
            });
            jem.fire('InstanceParamsSynced', {
                instance: this.model
            });
        },
        storeValues: function () {
            var self = this;
            var ws = this.model.get("webservice");
            if (ws) {
                var params = this.model.get("parameters");
                if (!params) {
                    return;
                }
                var m_id = this.model.get("id");
                if (!(m_id in window.com.xomena.geo.storedValues)) {
                    window.com.xomena.geo.storedValues[m_id] = {};
                }
                window.com.xomena.geo.storedValues[m_id][ws] = {};

                params.forEach(function (p) {
                    var m = p.get("model");
                    var t = m.get("type");
                    var n = p.get("name");
                    var v = [];
                    self.$("input[name^='" + n + "'], select[name^='" + n + "']").each(function () {
                        if (t === "list") {
                            var val = $(this).val();
                            if ($.isArray(val)) {
                                v = _.union(v, val);
                            } else {
                                if (val) {
                                    v.push(val);
                                }
                            }
                        } else if (t === 'parts') {
                            var m_n = $(this).attr("name");
                            var prefix = m_n.split(":")[1];
                            var m_id = $(this).attr("id");
                            var index = Number(m_id.split("-")[3]);
                            var val = $(this).val();
                            if (!v[index]) {
                                v[index] = [];
                            }
                            if ($.isArray(val)) {
                                v[index].push(prefix + ":" + val.join("|"));
                            } else {
                                if (val) {
                                    v[index].push(prefix + ":" + val);
                                }
                            }
                        } else if (t === 'checkboxes') {
                            if (this.checked) {
                                var val = $(this).val();
                                if (val) {
                                    v.push(val);
                                }
                            }
                        } else if (t === 'checkbox') {
                            if (this.checked) {
                                var val = $(this).val();
                                v.push(val);
                            }
                        } else {
                            var val = $(this).val();
                            if (val) {
                                v.push(val);
                            }
                        }
                    });
                    window.com.xomena.geo.storedValues[m_id][ws][n] = v;
                });
            }
        },
        toggleVersion: function () {
            this.model.set("version", this.$("input[name='ws-version-val-" + this.model.get("id") + "']:checked").val());
            jem.fire('M4WVisibility', {
                instanceId: this.model.get("id")
            });
        },
        renderMap: function (data) {
            var m_map = document.querySelector("#t-" + this.model.get("id")).map;
            if (m_map) {
                window.com.xomena.mapRenderer.updateInstance(this.model, data);
                window.com.xomena.mapRenderer.renderMap(this.model.get("id"));
            }
        },
        addToolsLinks: function () {
            this.$("#ws-tools-links-" + this.model.get("id")).html("");
            var tools_urls = this.model.getToolsURLs();
            if (tools_urls && tools_urls.length) {
                this.$("#ws-tools-links-" + this.model.get("id")).html(tools_urls.join("<br/>"));
            }
        }
    });

    window.com.xomena.geo.Views.InstancesView = Backbone.View.extend({
        tagName: 'ul',
        initialize: function () {
            this.collection;
        },
        render: function () {
            this.collection.each(function (instance) {
                var instanceView = new window.com.xomena.geo.Views.InstanceView({ model: instance });
                Backbone.Validation.bind(instanceView);
                $("#instances-container").append(instanceView.el);
                window.com.xomena.geo.instanceViewsMap[instance.get("id")] = instanceView;
                document.querySelector('#t-' + instance.get("id")).selected = 0;
                $("#ws-result-" + instance.get("id")).width(function (ind, val) {
                    return $($(this).parents("div.pure-g").get(0)).width();
                });
            });
        },
        filterById: function (id) {
            return this.collection.filter(
                function (c) {
                    return id === c.get("id");
                }
            );
        },
        renderExport: function () {
            this.collection.each(function (instance) {
                var instanceView = window.com.xomena.geo.instanceViewsMap[instance.get("id")];
                if (instanceView) {
                    instanceView.renderExport();
                }
            });
        }
    });


    window.com.xomena.geo.Views.ParameterView = Backbone.View.extend({
        tagName: 'li', // defaults to div if not specified
        className: 'ws-param', // optional, can also set multiple
        events: {
            'change .trigger-visibility': 'triggerVisibility',
            'change .trigger-required': 'triggerRequired',
            'change .trigger-requiredOr': 'triggerRequiredOr'
        },
        newTemplate: _.template($('#paramTemplate').html()), // external template
        initialize: function () {
            this.render(); // render is an optional function that defines the logic for rendering a template
            this.model.on('destroy', this.remove, this); // calls remove function once model deleted
        },
        render: function () {
            var storedval;
            var wasclosed;
            this.$el.html(this.newTemplate(this.model.toJSON())); // calls the template
            if (this.model.get("model").get("type") === "timestamp") {
                var dnow = (new Date()).toISOString();
                var dmin = dnow.split("T")[0];
                this.$el.find("#parameter-" + this.model.get("id")).datetimepicker({
                    step: 10,
                    format: 'unixtime',
                    lazyInit: true,
                    formatDate: 'Y-m-d',
                    minDate: dmin,
                    defaultDate: false,
                    allowBlank: true,
                    yearStart: (new Date()).getFullYear(),
                    dayOfWeekStart: 1,
                    showApplyButton: false,
                    closeOnDateSelect: false,
                    closeOnTimeSelect: true,
                    validateOnBlur: false,
                    onChangeDateTime: function (dp, $input) {
                        if (wasclosed) return;
                        storedval = $input.val();
                        console.log("Tmestamp stored: " + storedval);
                    },
                    onClose: function (dp, $input) {
                        if (!($input.val() === "" || $input.val() === "now")) {
                            $input.val(storedval ? storedval : "");
                        }
                        wasclosed = true;
                    },
                    onShow: function (dp, $input) {
                        wasclosed = false;
                    }
                });
            }
        },
        remove: function () {
            this.$el.remove(); // removes the HTML element from view when delete button clicked/model deleted
        },
        triggerVisibility: function () {
            console.log("Triggered visibility event: " + this.model.get("name"));
            jem.fire('VisibilityDependence', {
                instanceId: this.model.get("parentInstance"),
                parameterInstanceId: this.model.get("id")
            });
        },
        triggerRequired: function () {
            console.log("Triggered required event: " + this.model.get("name"));
            jem.fire('RequiredDependence', {
                instanceId: this.model.get("parentInstance"),
                parameterInstanceId: this.model.get("id")
            });
        },
        triggerRequiredOr: function () {
            console.log("Triggered required OR group event: " + this.model.get("name"));
            jem.fire('RequiredOrDependence', {
                instanceId: this.model.get("parentInstance"),
                parameterInstanceId: this.model.get("id")
            });
        }
    });

    window.com.xomena.geo.Views.ParametersView = Backbone.View.extend({
        tagName: 'ul',
        className: 'ws-params',
        initialize: function () {
            this.collection;
        },
        render: function () {
            var self = this;
            this.processDependencies();
            this.collection.each(function (param) {
                var paramView = new window.com.xomena.geo.Views.ParameterView({ model: param, id: "ws-param-" + param.get("id") });
                self.$el.append(paramView.el);
            });
        },
        processDependencies: function () {
            //Conditional visibility
            var triggersCondVisible = [];
            var listenersCondVisible = [];
            //Conditional required
            var triggersCondReq = [];
            var listenersCondReq = [];
            //Conditional required OR group
            var triggersCondReqOr = [];
            var listenersCondReqOr = [];

            var reParam = /[a-z_]+:\[.+\]/g;
            this.collection.each(function (param) {
                var m = param.get("model");
                //Conditional visibility
                var cond_visible = m.get("condVisibility");
                if (cond_visible) {
                    var matches = cond_visible.match(reParam);
                    if (matches) {
                        _.each(matches, function (match) {
                            var arr1 = match.split(":");
                            if (!triggersCondVisible[arr1[0]]) {
                                triggersCondVisible[arr1[0]] = cond_visible;
                            }
                        });
                    }
                    if (!listenersCondVisible[m.get("name")]) {
                        listenersCondVisible[m.get("name")] = cond_visible;
                    }
                }
                //Conditional required
                var cond_req = m.get("condRequired");
                if (cond_req) {
                    var matches = cond_req.match(reParam);
                    if (matches) {
                        _.each(matches, function (match) {
                            var arr1 = match.split(":");
                            if (!triggersCondReq[arr1[0]]) {
                                triggersCondReq[arr1[0]] = cond_req;
                            }
                        });
                    } else {
                        matches = cond_req.match(/\{\{[a-z_:]+\}\}/ig);
                        if (matches) {
                            _.each(matches, function (match) {
                                var fld = match.replace("{{", "").replace("}}", "");
                                if (!triggersCondReq[fld]) {
                                    triggersCondReq[fld] = cond_req;
                                }
                            });
                        }
                    }
                    if (!listenersCondReq[m.get("name")]) {
                        listenersCondReq[m.get("name")] = cond_req;
                    }
                }
                //Conditional required OR group
                var cond_reqOr = m.get("condRequiredOr");
                if (cond_reqOr) {
                    var matches = cond_reqOr.match(reParam);
                    if (matches) {
                        _.each(matches, function (match) {
                            var arr1 = match.split(":");
                            if (!triggersCondReqOr[arr1[0]]) {
                                triggersCondReqOr[arr1[0]] = cond_reqOr;
                            }
                        });
                    }
                    if (!listenersCondReqOr[m.get("name")]) {
                        listenersCondReqOr[m.get("name")] = cond_reqOr;
                    }
                }
            });
            this.collection.each(function (param) {
                //Conditional visibility
                if (triggersCondVisible[param.get("name")]) {
                    param.set("triggerCondVisibility", true);
                }
                if (listenersCondVisible[param.get("name")]) {
                    param.set("listenCondVisibility", true);
                }
                //Conditional required
                if (triggersCondReq[param.get("name")]) {
                    param.set("triggerCondRequired", true);
                }
                if (param.get("model").get("type") === "parts") {
                    var parts = param.get("model").get("parts");
                    parts.forEach(function (part) {
                        if (triggersCondReq[param.get("name") + ":" + part.get("name")]) {
                            param.set("triggerCondRequired", true);
                        }
                    });
                }
                if (listenersCondReq[param.get("name")]) {
                    param.set("listenCondRequired", true);
                }
                //Conditional required OR group
                if (triggersCondReqOr[param.get("name")]) {
                    param.set("triggerCondRequiredOr", true);
                }
                if (listenersCondReqOr[param.get("name")]) {
                    param.set("listenCondRequiredOr", true);
                }
            });
        }
    });

    window.com.xomena.geo.Views.ConfigView = Backbone.View.extend({
        tagName: 'div',
        className: 'app-config',
        events: {
        },
        newTemplate: _.template($('#configTemplate').html()), // external template
        initialize: function () {
            this.render(); // render is an optional function that defines the logic for rendering a template
        },
        render: function () {
            this.$el.html(this.newTemplate(this.model.toJSON())); // calls the template
        },
        remove: function () {
            this.$el.remove(); // removes the HTML element from view when delete button clicked/model deleted
        }
    });

})(window, jQuery, _, Backbone, jem, hljs);
