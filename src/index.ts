import {Req, ReqEvents, ReqRequestOptions} from "./Req";
import {parse} from "node-html-parser";

const options: ReqRequestOptions = {
    method: 'GET',
    host: 'www.cashplayers.gg',
}

const req = new Req(options);

req.addEvent(ReqEvents.SUCCESS, (ev) => {
   ev.response.setEncoding("utf-8");

   ev.response.on("data", (data) => {
      console.log(parse(data).valid, Date.now());
   });
});

req.addEvent(ReqEvents.ERROR, (ev) => {
    console.log(ev);
});

req.trail = true;

req.send();
