# dgramx

**An enhanced Node.js dgram module.**

This module extends the functionality of the internal 
[dgram](https://nodejs.org/dist/latest-v8.x/docs/api/dgram.html). By default, 
the `on()` and `emit()` method in **dgram** module acts just same as 
**EventEmitter** does, but this module change the way of how they bind a 
listener and emit an event.

This module allows you bind custom events, and instead of emitting them by the
current object, the event will be emitted by the remote peer, just like how 
[socket.io](https://socket.io) does, and build communication in a more easier way.

## Example

```javascript
const { createServer, createClient } = require("dgramx");

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
```

## API

### `Socket`

This class extends **dgram.Socket**, provides an easier way to communicate 
between two remote peers.

### `Socket.ReservedEvents: string[]`

Sets what events are reserved by the module (or your module) and should be 
avoid using for remote emitting. By default, these events is reserved:

- `close` triggered when the socket is closed.
- `error` triggered when any error occurred.
- `listening` triggered when `bind()` method is called.
- `message` triggered when receiving any message.

### `Socket.prototype.on(event: string, listener: Function): Socket`

If the event is reserved, then it acts just as talked above. But if the event 
is customized, then the listener function will be called when the remote peer 
emits the event. The signature of the listener function is:

`(msg: any, rinfo: dgram.RemoteInfo) => void`
- `msg` The message needed to be sent.
- `rinfo` Remote information contains:
    - `address: string` the address of the remote peer.
    - `port: number` binding port of the remote peer.
    - `family: "IPv4" | "IPv6"`

### `Socket.prototype.emit(event: string, msg: any): boolean`

Apart from reserved events, you can emit any customized event to the remote 
peer, and sends data when the event fires. Be aware, the number of `data` 
should be equal to the one specified by the remote peer `listener`.

### `Socket.prototype.to()`

Sets the receiver information of the remote peer, valid signatures are:

- `to(addr: string)` e.g. `to("localhost:12345")`.
- `to(port: number)` e.g. `to(1234)`.
- `to(addr: string, port: number)` e.g `to("localhost", 12345)`

You can call this method several times to set multiple receivers, but after 
`emit()` is called, the receivers will be set to empty.

### `createSocket()`

The same as **dgram.createSocket()**, only it returns the `Socket` of this 
module.

### `createServer(addr: string, callback?: () => void)`

Creates a UDP server according to the given address. This is a short-hand for 
`createSocket(type).bind(port, addr)`.

The `addr` must contain a protocol, could be either `udp`, `udp4`, `udp6`.
 
### `createClient(addr: string)`

Creates a UDP client ready to the given server. This is a short-hand for 
`createSocket(type).to(addr, port)`.

The `addr` of `createClient()` is the same and should be the same as the one 
of `createServer()`.

## The Data Frame

This module uses [encoded-buffer](https://github.com/Hyurl/encoded-buffer) to 
encode and decode data into and from buffer, you can check it's GitHub page to
see what kind of form of the message is transferred.