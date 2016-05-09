/**
 * jquery.json-view - jQuery collapsible JSON plugin
 * @version v1.0.0
 * @link http://github.com/bazh/jquery.json-view
 * @license MIT
 */
;(function ($) {
    'use strict';

    var collapser = function(collapsed) {
        var item = $('<span />', {
            'class': 'collapser',
            on: {
                click: function() {
                    var $this = $(this);

                    $this.toggleClass('collapsed');
                    var block = $this.parent().children('.inlineblock');
                    var ul = block.children('ul');

                    if ($this.hasClass('collapsed')) {
                        ul.hide();
                        block.children('.dots, .comments').css("display", "inline-block");
                    } else {
                        ul.show();
                        block.children('.dots, .comments').css("display", "none");
                    }
                }
            }
        });

        if (collapsed) {
            item.addClass('collapsed');
        }

        return item;
    };

    var formatter = function(json, opts) {
        var options = $.extend({}, {
            nl2br: true
        }, opts);

        var htmlEncode = function(html) {
            if (!html.toString()) {
                return '';
            }

            return html.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };

        var span = function(val, cls, collapsed) {
            var m_def = {
                'class': cls,
                html: htmlEncode(val)
            };
            if (collapsed) {
                m_def = $.extend(m_def, {
                   'style': 'display: inline-block;'
                });
            }
            return $('<span />', m_def);
        };

        var genBlock = function(val, level, collapsed) {
            switch($.type(val)) {
                case 'object':
                    if (!level) {
                        level = 0;
                    }

                    var output = $('<span />', {
                        'class': 'inlineblock'
                    });

                    var cnt = Object.keys(val).length;
                    if (!cnt) {
                        return output
                            .append(span('{', 'b'))
                            .append(' ')
                            .append(span('}', 'b'));
                    }

                    output.append(span('{', 'b'));

                    var m_def = {
                        'class': 'obj collapsible level' + level
                    };
                    if (collapsed) {
                        $.extend(m_def, {
                            'style': 'display: none;'
                        });
                    }

                    var items = $('<ul />', m_def);

                    $.each(val, function(key, data) {
                        cnt--;
                        var m_collapsed = false;
                        if (['object', 'array'].indexOf($.type(data)) !== -1 && !$.isEmptyObject(data) && options.collapsed) {
                            m_collapsed = true;
                        }
                        var item = $('<li />')
                            .append(span('"', 'q'))
                            .append(key)
                            .append(span('"', 'q'))
                            .append(': ')
                            .append(genBlock(data, level + 1, m_collapsed));

                        if (['object', 'array'].indexOf($.type(data)) !== -1 && !$.isEmptyObject(data)) {
                            item.prepend(collapser(m_collapsed));
                        }

                        if (cnt > 0) {
                            item.append(',');
                        }

                        items.append(item);
                    });

                    output.append(items);
                    output.append(span('...', 'dots', collapsed));
                    output.append(span('}', 'b'));
                    if (Object.keys(val).length === 1) {
                        output.append(span('// 1 item', 'comments', collapsed));
                    } else {
                        output.append(span('// ' + Object.keys(val).length + ' items', 'comments', collapsed));
                    }

                    return output;

                case 'array':
                    if (!level) {
                        level = 0;
                    }

                    var cnt = val.length;

                    var output = $('<span />', {
                        'class': 'inlineblock'
                    });

                    if (!cnt) {
                        return output
                            .append(span('[', 'b'))
                            .append(' ')
                            .append(span(']', 'b'));
                    }

                    output.append(span('[', 'b'));

                    var m_def1 = {
                        'class': 'obj collapsible level' + level
                    };
                    if (collapsed) {
                        $.extend(m_def1, {
                            'style': 'display: none;'
                        });
                    }

                    var items = $('<ul />', m_def1);

                    $.each(val, function(key, data) {
                        cnt--;
                        var m_collapsed1 = false;
                        if (['object', 'array'].indexOf($.type(data)) !== -1 && !$.isEmptyObject(data) && options.collapsed) {
                            m_collapsed1 = true;
                        }
                        var item = $('<li />')
                            .append(genBlock(data, level + 1, m_collapsed1));

                        if (['object', 'array'].indexOf($.type(data)) !== -1 && !$.isEmptyObject(data)) {
                            item.prepend(collapser(m_collapsed1));
                        }

                        if (cnt > 0) {
                            item.append(',');
                        }

                        items.append(item);
                    });

                    output.append(items);
                    output.append(span('...', 'dots', collapsed));
                    output.append(span(']', 'b'));
                    if (val.length === 1) {
                        output.append(span('// 1 item', 'comments', collapsed));
                    } else {
                        output.append(span('// ' + val.length + ' items', 'comments', collapsed));
                    }

                    return output;

                case 'string':
                    val = htmlEncode(val);
                    if (/^(http|https|file):\/\/[^\s]+$/i.test(val)) {
                        return $('<span />')
                            .append(span('"', 'q'))
                            .append($('<a />', {
                                href: val,
                                text: val
                            }))
                            .append(span('"', 'q'));
                    }
                    if (options.nl2br) {
                        var pattern = /\n/g;
                        if (pattern.test(val)) {
                            val = (val + '').replace(pattern, '<br />');
                        }
                    }

                    var text = $('<span />', { 'class': 'str' })
                        .html(val);

                    return $('<span />')
                        .append(span('"', 'q'))
                        .append(text)
                        .append(span('"', 'q'));

                case 'number':
                    return span(val.toString(), 'num');

                case 'undefined':
                    return span('undefined', 'undef');

                case 'null':
                    return span('null', 'null');

                case 'boolean':
                    return span(val ? 'true' : 'false', 'bool');
            }
        };

        return genBlock(json);
    };

    return $.fn.jsonView = function(json, options) {
        var $this = $(this);

        options = $.extend({}, {
            nl2br: true
        }, options);

        if (typeof json === 'string') {
            try {
                json = JSON.parse(json);
            } catch (err) {
            }
        }

        $this.append($('<div />', {
            class: 'json-view'
        }).append(formatter(json, options)));

        return $this;
    };

})(jQuery);
