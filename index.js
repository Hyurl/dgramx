const dgram = require("dgram");
const url = require("url");
const net = require("net");
const { encode, decode } = require("encoded-buffer");

for (let x in dgram) {
    exports[x] = dgram[x];
}

class Socket extends dgram.Socket {
    constructor(...args) {
        super(...args);

        /**
         * @type {[string, number]}
         */
        this.receiver = undefined;

        this.on("message", (msg, rinfo) => {
            let data = decode(msg);
            if (data) {
                let event = data.shift();
                super.emit(event, ...data, rinfo);
            }
        });
    }

    /**
     * @param {string} event 
     * @param {any[]} args 
     */
    emit(event, ...args) {
        if (this.constructor.ReservedEvents.includes(event))
            return super.emit(event, ...args);

        if (this.receiver) {
            let cb;
            if (typeof args[args.length - 1] == "function")
                cb = args.pop();

            let [addr, port] = this.receiver,
                msg = encode(event, ...args);

            this.send(msg, 0, msg.length, port, addr, cb);
            return true;
        }

        return false;
    }

    /**
     * @param {string|number} addr 
     * @param {number} port
     */
    to(addr, port = undefined) {
        if (addr && port === undefined) {
            if (typeof addr == "string") {
                let matches = addr.match(/\[(.+)\]:(\d+)|(.+):(\d+)/);
                if (matches) {
                    addr = matches[1] || matches[3];
                    port = matches[2] || matches[4];
                    this.receiver = [addr, port];
                    return this;
                }
            } else if (typeof addr == "number") {
                this.receiver = [undefined, addr];
                return this;
            } else if (Array.isArray(addr)) {
                this.receiver = addr;
                return this;
            }
        } else if (addr && port) {
            this.receiver = [addr, port];
            return this;
        }

        throw new TypeError("The argument is not a valid address.");
    }
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

function createSocket(...args) {
    return new Socket(...args);
}
exports.createSocket = createSocket;

/**
 * Creates a UDP server according to the given address.
 * @param {string} addr 
 * @param {()=>void} callback 
 * @returns {Socket}
 */
function createServer(addr, callback = null) {
    let { family, address, port } = parseAddr(addr);
    let server = new Socket(family == "IPv6" ? "udp6" : "udp4");
    process.nextTick(() => {
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
    let { family, address, port } = parseAddr(addr);
    let client = new Socket(family == "IPv6" ? "udp6" : "udp4");
    client.receiver = [address, port];
    return client;
}
exports.createClient = createClient;