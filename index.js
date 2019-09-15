"use strict";

const dgram = require("dgram");
const url = require("url");
const net = require("net");
const bsp = require("bsp");

for (let x in dgram) {
    exports[x] = dgram[x];
}

class Socket extends dgram.Socket {
    constructor(...args) {
        super(...args);
        /** @type {Array<{address: string, port: number}>} */
        this.receivers = [];
        /** @type {{address: string, port: number}} */
        this.defaultPeer = null;
        this.temp = [];

        this.on("message", (msg, rinfo) => {
            for (let data of bsp.decode(msg, this.temp)) {
                data.push(rinfo);
                super.emit.apply(this, data);
            }
        });
    }

    /**
     * @param {string} event
     * @param {any} msg 
     * @param {()=>void} cb 
     */
    emit(event, msg, cb) {
        if (Socket.ReservedEvents.indexOf(event) !== -1)
            return super.emit.apply(this, arguments);

        if (typeof msg == "function") {
            cb = msg;
            msg = undefined;
        }

        if (this.receivers.length || this.defaultPeer) {
            let data = bsp.encode([event, msg]),
                receivers = this.receivers.length
                    ? this.receivers
                    : [this.defaultPeer];

            for (let { address, port } of receivers) {
                this.send(data, 0, data.byteLength, port, address, cb);
            }

            this.receivers = [];

            return true;
        }

        return false;
    };

    /**
     * @param {string|number} address 
     * @param {number} [port]
     */
    to(address, port) {
        if (address && port === undefined) {
            if (typeof address == "string") {
                let matches = addr.match(/\[(.+)\]:(\d+)|(.+):(\d+)/);

                if (matches) {
                    address = matches[1] || matches[3];
                    port = matches[2] || matches[4];
                    this.receivers.push({ address, port });
                    return this;
                }
            } else if (typeof address == "number") {
                this.receivers.push({ address: undefined, port: address });
                return this;
            } else {
                throw new TypeError(
                    "argument 'address' must be a string or number"
                );
            }
        } else if (address && port) {
            this.receivers.push({ address, port });
            return this;
        }

        throw new TypeError("The argument is not a valid address.");
    };
}

Socket.ReservedEvents = ["close", "error", "listening", "message"];
exports.Socket = Socket;

/**
 * @param {string} addr
 */
function parseAddr(addr) {
    let i = addr.indexOf(":");

    if (addr.substr(i + 1, 2) !== "//")
        addr = addr.substring(0, i) + "://" + addr.substring(i + 1);

    let urlObj = url.parse(addr),
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

function createSocket(...args) {
    return new Socket(...args);
}
exports.createSocket = createSocket;

/**
 * Creates a UDP server according to the given address.
 * @param {string} address 
 * @param {()=>void} callback 
 * @returns {Socket}
 */
function createServer(address, callback) {
    let _addr = parseAddr(address),
        family = _addr.family,
        _address = _addr.address,
        port = _addr.port,
        server = new Socket(family == "IPv6" ? "udp6" : "udp4");

    server.bind(port, _address, callback);

    return server;
}
exports.createServer = createServer;

/**
 * Creates a UDP client ready to the given server.
 * @param {string} address The server address.
 * @returns {Socket}
 */
function createClient(address) {
    let _addr = parseAddr(address),
        family = _addr.family,
        _address = _addr.address,
        port = _addr.port,
        client = new Socket(family == "IPv6" ? "udp6" : "udp4");

    client.defaultPeer = { address: _address, port: port };

    return client;
}
exports.createClient = createClient;