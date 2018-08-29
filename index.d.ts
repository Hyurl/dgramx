import * as dgram from "dgram";
export * from "dgram";

export class Socket extends dgram.Socket {
    /** @private */
    private receivers: Array<{address: string, port: number}>;
    private defaultPeer: {address: string, port: number};
    static ReservedEvents: string[];

    constructor(type: "udp4" | "udp6");

    on(event: "close" | "listening", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "message", listener: (msg: Buffer, rinfo: dgram.RemoteInfo) => void): this;
    /**
     * Adds a listener function to the specified event, the function will be 
     * called when a remote peer emits the event.
     */
    on(event: string, listener: (msg: any, rinfo: dgram.RemoteInfo) => void): this;

    once(event: "close" | "listening", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "message", listener: (msg: Buffer, rinfo: dgram.RemoteInfo) => void): this;
    once(event: string, listener: (msg: any, rinfo: dgram.RemoteInfo) => void): this;

    emit(event: "listening"): boolean;
    emit(event: "close" | "error"): boolean;
    emit(event: "error", err: Error): boolean;
    emit(event: "message", msg: Buffer, rinfo: dgram.RemoteInfo): boolean;
    /** Emits the specified event, and sends data to the remote peer. */
    emit(event: string, msg: any, callback?: (err: Error, bytes: number) => void): boolean;
    /** Emits the specified event. */
    emit(event: string, callback?: (err: Error, bytes: number) => void): boolean;

    /** Sets the remote peer address before emits an event. */
    to(addr: string): this;
    to(port: number): this;
    /** deprecated */
    to(receiver: [string, number]): this;
    to(addr: string, port: number): this;
}

/**
 * Creates a UDP server according to the given address.
 * @example
 *  createServer("udp://localhost:41234")
 */
export function createServer(addr: string, callback?: () => void): Socket;

/**
 * Creates a UDP client ready to the given server.
 * @param addr The server address.
 * @example
 *  createClient("udp://localhost:41234")
 */
export function createClient(addr: string): Socket;

export function parseAddr(addr: string): dgram.RemoteInfo;