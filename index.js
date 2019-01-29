"use strict";

var dgram = require("dgram");
var url = require("url");
var net = require("net");
var extend = require("tslib").__extends;
var bsp = require("bsp");

for (var x in dgram) {
    exports[x] = dgram[x];
}

var Socket = (function (_super) {
    extend(Socket, _super);

    function Socket() {
        var _this = _super.apply(this, arguments) || this;

        /** @type {Array<{address: string, port: number}>} */
        _this.receivers = [];
        _this.defaultPeer = null;
        _this.remains = [];

        _this.on("message", function (msg, rinfo) {
            for (let data of bsp.receive(msg, _this.remains)) {
                data.push(rinfo);
                _super.prototype.emit.apply(this, data);
            }
        });
    }

    /**
     * @param {string} event
     * @param {any} msg 
     * @param {()=>void} cb 
     */
    Socket.prototype.emit = function (event, msg, cb) {
        if (Socket.ReservedEvents.indexOf(event) >= 0)
            return _super.prototype.emit.apply(this, arguments);

        if (typeof msg == "function") {
            cb = msg;
            msg = undefined;
        }

        if (this.receivers.length || this.defaultPeer) {
            var data = bsp.send(event, msg),
                receivers = this.receivers.length
                    ? this.receivers
                    : [this.defaultPeer];

            for (var i in receivers) {
                var address = receivers[i].address,
                    port = receivers[i].port;

                this.send(data, 0, data.byteLength, port, address, cb);
            }

            this.receivers = [];

            return true;
        }

        return false;
    };

    /**
     * @param {string|number} addr 
     * @param {number} port
     */
    Socket.prototype.to = function (addr, port) {
        if (addr && port === undefined) {
            if (typeof addr == "string") {
                var matches = addr.match(/\[(.+)\]:(\d+)|(.+):(\d+)/);
                if (matches) {
                    addr = matches[1] || matches[3];
                    port = matches[2] || matches[4];
                    this.receivers.push({ address: addr, port: port });
                    return this;
                }
            } else if (typeof addr == "number") {
                this.receivers.push({ address: undefined, port: addr });
                return this;
            } else if (addr instanceof Array) {
                this.receivers.push({ address: addr[0], port: addr[1] });
                return this;
            }
        } else if (addr && port) {
            this.receivers.push({ address: addr, port: port });
            return this;
        }

        throw new TypeError("The argument is not a valid address.");
    };

    Socket.ReservedEvents = ["close", "error", "listening", "message"];

    return Socket;
}(dgram.Socket));
exports.Socket = Socket;

/**
 * @param {string} addr
 */
function parseAddr(addr) {
    var i = addr.indexOf(":");
    if (addr.substr(i + 1, 2) !== "//")
        addr = addr.substring(0, i) + "://" + addr.substring(i + 1);

    var urlObj = url.parse(addr),
        type = urlObj.protocol;

    if (type != "udp:" && type != "udp4:" && type != "udp6:")
        throw new TypeError("The argument is not a valid udp address.");

    return {
        family: net.isIPv6(urlObj.hostname) ? "IPv6" : "IPv4",
        address: urlObj.hostname,
        port: parseInt(urlObj.port)
    };
}
exports.parseAddr = parseAddr;

function createSocket() {
    return new Socket(arguments);
}
exports.createSocket = createSocket;

/**
 * Creates a UDP server according to the given address.
 * @param {string} addr 
 * @param {()=>void} callback 
 * @returns {Socket}
 */
function createServer(addr, callback) {
    var _addr = parseAddr(addr),
        family = _addr.family,
        address = _addr.address,
        port = _addr.port,
        server = new Socket(family == "IPv6" ? "udp6" : "udp4");

    process.nextTick(function () {
        server.bind(port, address, callback);
    });

    return server;
}
exports.createServer = createServer;

/**
 * Creates a UDP client ready to the given server.
 * @param {string} addr The server address.
 * @returns {Socket}
 */
function createClient(addr) {
    var _addr = parseAddr(addr),
        family = _addr.family,
        address = _addr.address,
        port = _addr.port,
        client = new Socket(family == "IPv6" ? "udp6" : "udp4");

    client.defaultPeer = { address: address, port: port };

    return client;
}
exports.createClient = createClient;