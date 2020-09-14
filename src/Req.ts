import * as http from 'http';
import {IncomingMessage, RequestOptions} from 'http';
import * as https from 'https';
import {URL} from "url";

export enum ReqEvents {
    ERROR = 0,
    SUCCESS = 1,
}

export interface EventReq {
    status?: number;
    message?: string;
    response?: IncomingMessage;
}

export interface ReqRequestOptions extends RequestOptions {
}

export class Req {
    private _res: IncomingMessage = null;

    private _statusCode: number = null;

    public trail: boolean = false;

    public maxTrail: number = 5;

    public actTrail: number = 0;

    private _eventListener: {[key: number]: ((ev: EventReq) => void)[]} = {};

    constructor(
        private _options: ReqRequestOptions
    ) {
        this.actTrail++;
    }

    /**
     *
     */
    public send(): void {
        const c = (res: IncomingMessage) => {
            this._res = res;
            this._statusCode = this._res.statusCode;
            this._requestHandler();
        };

        if (!this._options.protocol || this._options.protocol === 'http:') {
            http.get(this._options, (res) => {
                c(res);
            });

        } else if (this._options.protocol === 'https:') {
            https.get(this._options, (res) => {
                c(res);
            });

        } else {
            this._callEvent(ReqEvents.ERROR, 400, 'Bad Request')
        }
    }

    /**
     * @param event
     * @param callback
     */
    public addEvent(event: ReqEvents, callback: (ev: EventReq) => void): Req {
        if (!Array.isArray(this._eventListener[event])) {
            this._eventListener[event] = [];
        }

        this._eventListener[event].push(callback);

        return this;
    }

    /**
     * @private
     */
    private _requestHandler(): void {
        if (this._statusCode >= 200 && this._statusCode < 300) {
            this._callEvent(ReqEvents.SUCCESS, this._statusCode);

        } else if (this._statusCode >= 300 && this._statusCode < 400 && this.trail) {
            if (this.actTrail >= this.maxTrail) {
                this._callEvent(ReqEvents.ERROR, this._statusCode, 'To manny redirects');
                return;
            }

            const url = new URL(this._res.headers.location);

            const options = Object.assign(this._options, {
                protocol: url.protocol || null,
                port: url.port || null,
                host: url.host,
                hostname: url.hostname,
                path: url.pathname,
            });

            const req = new Req(options);
            req._eventListener = this._eventListener;
            req.maxTrail = this.maxTrail;
            req.actTrail = this.actTrail;
            req.trail = true;
            req.send();

        } else {
            this._callEvent(ReqEvents.ERROR, this._statusCode, 'Not supported handler');
        }
    }

    /**
     * @param event
     * @param status
     * @param message
     * @private
     */
    private _callEvent(event: ReqEvents, status?: number, message?: string): boolean {
        if (!this._eventListener[event]) {
            return false;
        }

        this._eventListener[event].forEach((c) => {
           c({status: status||null, message: message||null, response: this._res||null});
        });
    }
}
