const { createServer, createClient } = require("./");
const assert = require("assert");

let addr = "udp://127.0.0.1:12345";
var server = createServer(addr);
var client = createClient(addr);

server.on("listening", () => {
    let { address, port } = server.address();
    assert(typeof address == "string" && typeof port == "number" && port > 0);
}).on("greet", (msg, rinfo) => {
    assert.equal(msg, "Hello, World!");

    // reply
    server.to(rinfo.address, rinfo.port).emit("reply", "Message recieved.");
});

client.bind(0); // the client binds a random port and wait for reply.
client.on("reply", (msg) => {
    assert.equal(msg, "Message recieved.");

    client.close();
    server.close();

    console.log("All tests passed!");
}).emit("greet", "Hello, World!");