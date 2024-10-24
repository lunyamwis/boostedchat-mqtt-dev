export * from './ig-action-spam.error';
export * from './ig-challenge-wrong-code.error';
export * from './ig-checkpoint.error';
export * from './ig-client.error';
export * from './ig-cookie-not-found.error';
export * from './ig-exact-user-not-found-error';
export * from './ig-inactive-user.error';
export * from './ig-login-bad-password.error';
export * from './ig-login-invalid-user.error';
export * from './ig-login-required.error';
export * from './ig-login-two-factor-required.error';
export * from './ig-network.error';
export * from './ig-no-checkpoint.error';
export * from './ig-not-found.error';
export * from './ig-parse.error';
export * from './ig-private-user.error';
export * from './ig-requests-limit.error';
export * from './ig-response.error';
export * from './ig-sentry-block.error';
export * from './ig-no-checkpoint.error';
export * from './ig-challenge-wrong-code.error';
export * from './ig-exact-user-not-found-error';
export * from './ig-user-id-not-found.error';
export * from './ig-upload-video-error';
export * from './ig-user-has-logged-out.error';
export * from './ig-configure-video-error';
class BaseError extends Error {
    constructor(message?: string) {
       super(message);
       // @ts-ignore -- set the name to the class's actual name
       this.name = this.__proto__.constructor.name;
    }
 }
 
 export class ClientDisconnectedError extends BaseError {}
 
 export class EmptyPacketError extends BaseError {}
 
 export class InvalidStateError extends BaseError {}
 
 export class ConnectionFailedError extends BaseError {}
 
 export class IllegalArgumentError extends BaseError {}
 
 // TODO: split further
 export class ThriftError extends BaseError {}
 