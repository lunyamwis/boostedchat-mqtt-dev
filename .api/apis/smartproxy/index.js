"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'smartproxy/unknown (api/6.1.2)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Get a list of endpoints by a specified type for Residential subscription
     *
     * @summary Get endpoints by type
     * @throws FetchError<400, types.GetEndpointsByTypeResponse400> 400
     */
    SDK.prototype.getEndpointsByType = function (metadata) {
        return this.core.fetch('/v2/endpoints/{type}', 'get', metadata);
    };
    /**
     * Get types of endpoints for Residential subscription
     *
     * @summary Get endpoints
     * @throws FetchError<400, types.GetEndpointsResponse400> 400
     */
    SDK.prototype.getEndpoints = function () {
        return this.core.fetch('/v2/endpoints', 'get');
    };
    /**
     * Generate custom back connect endpoints for proxying for Residential subscription. If a
     * default value is preset you don't need to actually include it in the request param
     * query.
     *
     * @summary Generate custom back connect endpoints
     * @throws FetchError<400, types.GenerateCustomBackConnectEndpointsResponse400> 400
     */
    SDK.prototype.generateCustomBackConnectEndpoints = function (metadata) {
        return this.core.fetch('/v2/endpoints-custom/back-connect', 'get', metadata);
    };
    /**
     * Generate custom endpoints for proxying for Residential and Datacenter Pay per GB
     * (DEPRECATED) subscriptions. If a default value is preset you don't need to actually
     * include it in the request param query.
     *
     * @summary Generate custom endpoints
     * @throws FetchError<400, types.GenerateCustomEndpointsResponse400> 400
     */
    SDK.prototype.generateCustomEndpoints = function (metadata) {
        return this.core.fetch('/v2/endpoints-custom', 'get', metadata);
    };
    /**
     * Get a list of active sub users for Residential and Datacenter Pay per GB (DEPRECATED)
     * subscriptions
     *
     * @summary Get sub users
     * @throws FetchError<400, types.GetSubUsersResponse400> 400
     */
    SDK.prototype.getSubUsers = function (metadata) {
        return this.core.fetch('/v2/sub-users', 'get', metadata);
    };
    /**
     * Create a new sub user for Residential and Datacenter Pay per GB (DEPRECATED)
     * subscriptions
     *
     * @summary Create sub user
     * @throws FetchError<400, types.CreateSubUserResponse400> 400
     */
    SDK.prototype.createSubUser = function (body) {
        return this.core.fetch('/v2/sub-users', 'post', body);
    };
    /**
     * Get a single active sub user
     *
     * @summary Get sub user
     * @throws FetchError<400, types.GetSubUserResponse400> 400
     */
    SDK.prototype.getSubUser = function (metadata) {
        return this.core.fetch('/v2/sub-users/{sub_user_id}', 'get', metadata);
    };
    SDK.prototype.updateSubUser = function (body, metadata) {
        return this.core.fetch('/v2/sub-users/{sub_user_id}', 'put', body, metadata);
    };
    /**
     * Delete specified sub user
     *
     * @summary Delete sub user
     * @throws FetchError<400, types.DeleteSubUserResponse400> 400
     */
    SDK.prototype.deleteSubUser = function (metadata) {
        return this.core.fetch('/v2/sub-users/{sub_user_id}', 'delete', metadata);
    };
    /**
     * Get traffic usage of specified sub user
     *
     * @summary Get sub user traffic
     * @throws FetchError<400, types.GetSubUserTrafficResponse400> 400
     */
    SDK.prototype.getSubUserTraffic = function (metadata) {
        return this.core.fetch('/v2/sub-users/{sub_user_id}/traffic', 'get', metadata);
    };
    /**
     * Get allocated traffic across all of your sub users for Residential and Datacenter Pay
     * per GB (DEPRECATED) subscriptions
     *
     * @summary Get allocated sub user traffic
     * @throws FetchError<400, types.GetAllocatedSubUserTrafficResponse400> 400
     */
    SDK.prototype.getAllocatedSubUserTraffic = function (metadata) {
        return this.core.fetch('/v2/allocated-traffic-limit', 'get', metadata);
    };
    /**
     * Get a list of whitelisted IPs for Residential subscription
     *
     * @summary Get whitelisted IPs
     * @throws FetchError<400, types.GetWhitelistedIpsResponse400> 400
     */
    SDK.prototype.getWhitelistedIps = function () {
        return this.core.fetch('/v2/whitelisted-ips', 'get');
    };
    /**
     * Whitelist your IPs here for Residential subscription
     *
     * @summary Add whitelisted IPs
     * @throws FetchError<400, types.AddWhitelistedIpsResponse400> 400
     */
    SDK.prototype.addWhitelistedIps = function (body) {
        return this.core.fetch('/v2/whitelisted-ips', 'post', body);
    };
    /**
     * Delete a specified whitelisted IP
     *
     * @summary Delete whitelisted IP
     * @throws FetchError<400, types.DeleteWhitelistedIpResponse400> 400
     */
    SDK.prototype.deleteWhitelistedIp = function (metadata) {
        return this.core.fetch('/v2/whitelisted-ips/{id}', 'delete', metadata);
    };
    /**
     * Detailed information about your current subscription for Residential and Datacenter Pay
     * per GB (DEPRECATED) subscriptions
     *
     * @summary Get subscriptions
     * @throws FetchError<400, types.GetSubscriptionsResponse400> 400
     */
    SDK.prototype.getSubscriptions = function () {
        return this.core.fetch('/v2/subscriptions', 'get');
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
