var createServer = require("./").createServer;
var createClient = require("./").createClient;
const assert = require("assert");

var addr = "udp://127.0.0.1:12345";
var server = createServer(addr);
var client = createClient(addr);

server.on("listening", function () {
    var addr = server.address(),
        address = addr.address,
        port = addr.port;

    assert.equal(address, "127.0.0.1");
    assert.strictEqual(port, 12345);
}).on("greet", function (msg, rinfo) {
    assert.equal(msg, "Hello, World!");

    // reply
    server.to(rinfo.address, rinfo.port);
    assert(server.emit("reply", "Message recieved."));
}).on("greet2", function (msg, rinfo) {
    assert.deepStrictEqual(msg, {
        name: "Ayon",
        message: "Hello, World!"
    });

    // reply
    server.to(rinfo.address, rinfo.port);
    assert(server.emit("reply2", ["Luna", "Message recieved."]));
});

client.bind(0); // the client binds a random port and wait for reply.
client.on("reply", function (msg) {
    assert.equal(msg, "Message recieved.");

    assert(client.emit("greet2", {
        name: "Ayon",
        message: "Hello, World!"
    }));
}).on("reply2", function (msg) {
    assert.deepStrictEqual(msg, ["Luna", "Message recieved."]);

    client.close();
    server.close();

    console.log("#### OK ####");
});

assert(client.emit("greet", "Hello, World!"));