import * as dgram from "dgram";
export * from "dgram";

export declare class Socket extends dgram.Socket {
    /** @private */
    private receiver: [string, number];
    static ReservedEvents: string[];

    constructor(type: "udp4" | "udp6");

    on(event: "close" | "listening", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "message", listener: (msg: Buffer, rinfo: dgram.RemoteInfo) => void): this;
    /**
     * Adds a listener function to the specified event, the function will be 
     * called when a remote peer emits the event.
     */
    on(event: string, listener: (...data: any[], rinfo: dgram.RemoteInfo) => void): this;

    once(event: "close" | "listening", listener: () => void): this;
    once(event: "error", listener: (err: Error) => void): this;
    once(event: "message", listener: (msg: Buffer, rinfo: dgram.RemoteInfo) => void): this;
    once(event: string, listener: (...data: any[], rinfo: dgram.RemoteInfo) => void): this;

    emit(event: "close" | "error"): boolean;
    emit(event: "error", err: Error): boolean;
    emit(event: "message", msg: Buffer, rinfo: dgram.RemoteInfo): boolean;
    /** Emits the specified event, and sends data to the remote peer. */
    emit(event: string, ...data: any[]): boolean;
    emit(event: string, ...data: any[], callback: (err: Error, bytes: number) => {}): boolean;

    /** Sets the remote peer address before emits an event. */
    to(addr: string): this;
    to(port: number): this;
    to(receiver: [string, number]): this;
    to(addr: string, port: number): this;
}

/**
 * Creates a UDP server according to the given address.
 * @example
 *  createServer("udp://localhost:41234")
 */
export declare function createServer(addr: string, callback?: () => void): Socket;

/**
 * Creates a UDP client ready to the given server.
 * @param addr The server address.
 * @example
 *  createClient("udp://localhost:41234")
 */
export declare function createClient(addr: string): Socket;