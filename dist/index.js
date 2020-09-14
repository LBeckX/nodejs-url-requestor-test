"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Req_1 = require("./Req");
var node_html_parser_1 = require("node-html-parser");
var options = {
    method: 'GET',
    host: 'www.cashplayers.gg',
};
var req = new Req_1.Req(options);
req.addEvent(Req_1.ReqEvents.SUCCESS, function (ev) {
    ev.response.setEncoding("utf-8");
    ev.response.on("data", function (data) {
        console.log(node_html_parser_1.parse(data).valid, Date.now());
    });
});
req.addEvent(Req_1.ReqEvents.ERROR, function (ev) {
    console.log(ev);
});
req.trail = true;
req.send();
