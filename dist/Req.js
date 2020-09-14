"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Req = exports.ReqEvents = void 0;
var http = require("http");
var https = require("https");
var url_1 = require("url");
var ReqEvents;
(function (ReqEvents) {
    ReqEvents[ReqEvents["ERROR"] = 0] = "ERROR";
    ReqEvents[ReqEvents["SUCCESS"] = 1] = "SUCCESS";
})(ReqEvents = exports.ReqEvents || (exports.ReqEvents = {}));
var Req = /** @class */ (function () {
    function Req(_options) {
        this._options = _options;
        this._res = null;
        this._statusCode = null;
        this.trail = false;
        this.maxTrail = 5;
        this.actTrail = 0;
        this._eventListener = {};
        this.actTrail++;
    }
    /**
     *
     */
    Req.prototype.send = function () {
        var _this = this;
        var c = function (res) {
            _this._res = res;
            _this._statusCode = _this._res.statusCode;
            _this._requestHandler();
        };
        if (!this._options.protocol || this._options.protocol === 'http:') {
            http.get(this._options, function (res) {
                c(res);
            });
        }
        else if (this._options.protocol === 'https:') {
            https.get(this._options, function (res) {
                c(res);
            });
        }
        else {
            this._callEvent(ReqEvents.ERROR, 400, 'Bad Request');
        }
    };
    /**
     * @param event
     * @param callback
     */
    Req.prototype.addEvent = function (event, callback) {
        if (!Array.isArray(this._eventListener[event])) {
            this._eventListener[event] = [];
        }
        this._eventListener[event].push(callback);
        return this;
    };
    /**
     * @private
     */
    Req.prototype._requestHandler = function () {
        if (this._statusCode >= 200 && this._statusCode < 300) {
            this._callEvent(ReqEvents.SUCCESS, this._statusCode);
        }
        else if (this._statusCode >= 300 && this._statusCode < 400 && this.trail) {
            if (this.actTrail >= this.maxTrail) {
                this._callEvent(ReqEvents.ERROR, this._statusCode, 'To manny redirects');
                return;
            }
            var url = new url_1.URL(this._res.headers.location);
            var options = Object.assign(this._options, {
                protocol: url.protocol || null,
                port: url.port || null,
                host: url.host,
                hostname: url.hostname,
                path: url.pathname,
            });
            var req = new Req(options);
            req._eventListener = this._eventListener;
            req.maxTrail = this.maxTrail;
            req.actTrail = this.actTrail;
            req.trail = true;
            req.send();
        }
        else {
            this._callEvent(ReqEvents.ERROR, this._statusCode, 'Not supported handler');
        }
    };
    /**
     * @param event
     * @param status
     * @param message
     * @private
     */
    Req.prototype._callEvent = function (event, status, message) {
        var _this = this;
        if (!this._eventListener[event]) {
            return false;
        }
        this._eventListener[event].forEach(function (c) {
            c({ status: status || null, message: message || null, response: _this._res || null });
        });
    };
    return Req;
}());
exports.Req = Req;
