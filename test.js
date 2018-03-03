const { createServer, createClient } = require("./");

let addr = "udp://127.0.0.1:12345";
var server = createServer(addr);
var client = createClient(addr);

server.on("listening", () => {
    let { address, port } = server.address();
    console.log("Server listening at: %s:%d", address, port);
}).on("greet", (msg, rinfo) => {
    console.log(msg); // => Hello, World!

    // reply
    server.to(rinfo.address, rinfo.port).emit("reply", "Message recieved.");
});

client.bind(0); // the client binds a random port and wait for reply.
client.on("reply", (msg) => {
    console.log(msg); // => Message recieved.

    client.close();
    server.close();
}).emit("greet", "Hello, World!");