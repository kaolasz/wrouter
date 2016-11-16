/*v0.11*/
//使用
//var router = wrouter({
//    html5history: false,
//    onprogress: function (e) {
//        $(router.progress).css("width", 0).show().animate({ "width": e.loaded / e.total * 100 + "%" }, function () {
//            if (e.loaded == e.total) $(router.progress).fadeOut(500);
//        });
//    },
//    root: "/",
//    routers: [{
//        title: "aaaa",
//        rule: new RegExp("\\w+.html", "g"),
//        container: "#container",
//        progress: "#progress",
//        action: function (result) {
//            var $result = $(result);
//            var $container = $("#container", $result);
//            if ($container && $container.length > 0)
//                return $container.html();
//            return result;
//        }
//    }]
//});
; !function (win) {
    "use strict";
    var wrouter = function (options) {
        var that = this.configure(options);
        if (this.checkrouter()) {
            $(function () {
                $("body").delegate("a", "click", function () {
                    if (that.load($(this).attr("href")))
                        return false;
                });
            });
            that.load();
            var onChanged = function (e) {
                that.load();
            }
            if (this.html5history)
                window.onpopstate = onChanged;
            else
                window.onhashchange = onChanged;
        } else {
            var url = location.hash;
            if (url && url.indexOf('#') > -1) {
                var index = url.indexOf("#");
                url = url.substr(index + 1, url.length - index);
            }
            for (var i in that.routers) {
                if (url.match(that.routers[i].rule))
                    location.href = url;
            }
        }
    }
    wrouter.prototype.combine = function () {
        var res = "";
        for (var i in arguments)
            res += "/" + this.trim(arguments[i], arguments.length - 1 == i ? 1 : 0);
        return res;
    }
    wrouter.prototype.trim = function (str, c, type) {
        if (typeof c == "number")
            type = c, c = "/";
        else if (!type)
            type = 0;
        if (!c)
            c = "/";
        if ((type == 0 || type == 1) && str.indexOf(c) == 0)
            str = str.substr(1, str.length - 1);
        if ((type == 0 || type == 2) && str.lastIndexOf(c) == str.length - c.length)
            str = str.substr(0, str.length - c.length);
        return str;
    }
    wrouter.prototype.checkrouter = function () {
        if ("onpopstate" in window)
            return true;
        if ("onhashchange" in window) {
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && userAgent.indexOf("Opera") == -1) {
                var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
                reIE.test(userAgent);
                return parseFloat(RegExp["$1"]) >= 8.0;
            }
            return true;
        }
        return false;
    }
    wrouter.prototype.configure = function (options) {
        var that = this;
        that.routers = options && options.routers || [];
        for (var i in that.routers) {
            if (typeof that.routers[i].rule == "string")
                that.routers[i].rule = new RegExp(that.routers[i].rule, "g");
        }
        that.html5history = options && typeof options.html5history === "boolean" && !options.html5history ? options.html5history : window.history.pushState !== undefined;
        that.root = options && options.root || "/";
        that.progress = options && options.progress || "#progress";
        that.onprogress = options && options.onprogress || function (e) {
            $(that.progress).css("width", 0).show().animate({
                "width": (e.total == 0 ? 100 : e.loaded / e.total * 100) + "%"
            }, function () {
                if (e.total == 0 || e.loaded == e.total)
                    $(that.progress).fadeOut(100);
            });
        }
        return that;
    }
    wrouter.prototype.getxhr = function () {
        if (this.xhr) return this.xhr;
        this.xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        this.xhr.onprogress = this.onprogress;
        return this.xhr;
    }
    wrouter.prototype.ajax = function (url, callback) {
        var that = this;
        var xhr = that.getxhr();
        xhr.open("GET", url);
        xhr.setRequestHeader("WRouter", "1.0");
        xhr.send(null);
        xhr.onreadystatechange = function (e) {
            xhr.readyState == 4 && xhr.status == 200 && callback && callback(xhr.responseText);
            xhr.readyState == 4 && xhr.status != 200 && that.error && that.error(xhr.readyState);
        }
        return that;
    }
    wrouter.prototype.load = function (url) {
        var that = this;
        var isurl = url ? true : false;
        url = url || (that.html5history ? location.pathname + location.search : location.hash);
        if (that.html5history && url == that.root)
            return;
        var index = url.indexOf("#");
        if (index > -1) url = that.html5history ? url.substr(0, index) : url.substr(index + 1, url.length - index);
        if (isurl && !that.html5history) {
            location.href = "#" + url;
            return true;
        }
        for (var i in that.routers) {
            if (url.match(that.routers[i].rule)) {
                if (that.routers[i].title) document.title = that.routers[i].title;
                that.ajax(url, function (result) {
                    that.routers[i].container && $(that.routers[i].container).html(that.routers[i].action ? that.routers[i].action(result) : result);
                    !that.routers[i].container && that.routers[i].action(result);
                });
                isurl && window.history.pushState(null, null, url);
                return true;
            }
        }
    }
    win.wrouter = function (options) { return new wrouter(options) }
}(window);