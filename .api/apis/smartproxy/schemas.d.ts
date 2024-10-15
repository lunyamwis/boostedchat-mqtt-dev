declare const AddWhitelistedIps: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly IPAddressList: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CreateSubUser: {
    readonly body: {
        readonly type: "object";
        readonly required: readonly ["username", "password", "service_type"];
        readonly properties: {
            readonly username: {
                readonly type: "string";
                readonly description: "From 3 to 64 characters long. Only letters, numbers and underscores allowed.";
                readonly format: "json";
            };
            readonly password: {
                readonly type: "string";
                readonly description: "9 or more characters. Must include at least one upper case letter and a number. Symbols @ and : are not allowed";
                readonly format: "json";
            };
            readonly service_type: {
                readonly type: "string";
                readonly description: "Possible parameters: residential_proxies, shared_proxies";
                readonly default: "residential_proxies";
            };
            readonly traffic_limit: {
                readonly type: "number";
                readonly format: "float";
                readonly minimum: -3.402823669209385e+38;
                readonly maximum: 3.402823669209385e+38;
            };
            readonly auto_disable: {
                readonly type: "boolean";
                readonly description: "Disables subuser when the traffic limit is hit";
                readonly default: false;
            };
            readonly traffic_count_from: {
                readonly type: "string";
                readonly description: "Handles subuser subscription traffic starting from the specified date. Use date format yyyy-mm-dd hh:mm:ss.";
                readonly format: "date";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly error_code: {
                    readonly type: "string";
                    readonly examples: readonly ["bad_request"];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Can not process request"];
                };
                readonly error: {
                    readonly type: "object";
                    readonly properties: {
                        readonly username: {
                            readonly type: "string";
                            readonly examples: readonly ["username must be between 3 and 64 characters. Only numbers, characters and underscore are allowed"];
                        };
                        readonly password: {
                            readonly type: "string";
                            readonly examples: readonly ["password must be between 9 and 64 characters and must contain at least one number. Symbols @ and : are invalid"];
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const DeleteSubUser: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sub_user_id: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "\"Get sub users\" received sub user ID";
                };
            };
            readonly required: readonly ["sub_user_id"];
        }];
    };
    readonly response: {
        readonly "204": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const DeleteWhitelistedIp: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Type in the ID of IP here - [Get Whitelisted IPs](https://help.smartproxy.com/reference#get-whitelisted-ips)";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "204": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GenerateCustomBackConnectEndpoints: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly username: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Provide username for authorization. This param is **required**.";
                };
                readonly password: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Provide password for authorization. This param is **required**.";
                };
                readonly session_type: {
                    readonly type: "string";
                    readonly enum: readonly ["sticky", "random"];
                    readonly default: "sticky";
                    readonly description: "Choose what session type should be used. Choose `sticky` for sticky sessions or `random` for rotating sessions. Default is `sticky`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly session_time: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 10;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Session time in minutes, range is 1-1440(inclusive).  This param is **required** if param `sessionType` value is `sticky`. Default value is 10.";
                };
                readonly country: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Country Alpha2 code in lower case.";
                };
                readonly state: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "You can select state if country is USA(`us`). Provide full state name with underscore instead of a space. E.g. `new_york`.";
                };
                readonly city: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Full city name in lowercase with underscore instead of a space. E.g. `new_orleans`.";
                };
                readonly output_format: {
                    readonly type: "string";
                    readonly enum: readonly ["protocol:auth@endpoint", "endpoint:auth", "auth@endpoint"];
                    readonly default: "protocol:auth@endpoint";
                    readonly description: "Output format type. Default is `protocol:auth@endpoint`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly count: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 10;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Count of routes that will be generated and returned. Min value is 1. Default is 10.";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Page of the routes(pagination). Min value is 1. Default is 1.";
                };
                readonly response_format: {
                    readonly type: "string";
                    readonly enum: readonly ["json", "txt", "html"];
                    readonly default: "json";
                    readonly description: "What response type will be returned. Could be `json`, `txt` or `html`. Default is `json`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly line_break: {
                    readonly type: "string";
                    readonly enum: readonly ["\\n", "\\r\\n", "\\r", "\\t"];
                    readonly default: "\\n";
                    readonly description: "What line break will be used in response content. This is **required** if param `responseType` value is `txt`. Default is `\\n`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly domain: {
                    readonly type: "string";
                    readonly default: "smartproxy.com";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "What domain should be used for routes. `visitxiangtan.com` is for Mainland China customers, `smartproxy.com` for the rest, `ip` is for using IP address instead of a domain. Default is `smartproxy.com`.";
                };
                readonly ip: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "IP address to be used instead of a domain. This field is **required** if param `domain` value is `ip`. It always must contain port at the end e.g. `1.1.1.1:7000`.";
                };
                readonly protocol: {
                    readonly type: "string";
                    readonly enum: readonly ["http", "https"];
                    readonly default: "http";
                    readonly description: "What protocol should be used. Default is `http`. Works only with domains `china-gate.visitxiangtan.com` and `china-gate.visitxiangtan.com:8000`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
                readonly examples: readonly ["http://user-smith-sessionduration-1:ao5nf23j4n@gate.visitxiangtan.com:10000"];
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid data provided."];
                };
                readonly violations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["sessionType: The value you selected is not a valid choice."];
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GenerateCustomEndpoints: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly proxy_type: {
                    readonly type: "string";
                    readonly enum: readonly ["residential_proxies", "shared_proxies"];
                    readonly default: "residential_proxies";
                    readonly description: "For what proxy type wish to generate routes. For residential proxies choose `residential_proxies`, for datacenter choose `shared_proxies`. Default is `residential_proxies`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly auth_type: {
                    readonly type: "string";
                    readonly enum: readonly ["basic", "whitelist"];
                    readonly default: "basic";
                    readonly description: "Provide what authorization method you want to use, it could be `basic` or `whitelist`. Default is `basic`. `whitelist` only works when param `proxyType` value is `residential_proxies`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly username: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Provide username for authorization. This param is **required** if param `authType` value is `basic`.";
                };
                readonly password: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Provide password for authorization. This param is **required** if param `authType` value is `basic`.";
                };
                readonly session_type: {
                    readonly type: "string";
                    readonly enum: readonly ["sticky", "random"];
                    readonly default: "sticky";
                    readonly description: "Choose what session type should be used. Choose `sticky` for sticky sessions or `random` for rotating sessions. Default is `sticky`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly session_time: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 10;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Session time in minutes, range is 1-1440(inclusive).  This param is **required** if param `proxyType` value is `residential_proxies` and param `authType` value is `basic` and param `sessionType` value is `sticky`. Default is 10.";
                };
                readonly location: {
                    readonly type: "string";
                    readonly default: "random";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "One of available locations in lowercase, could be country Alpha-2 code, city or state name. To get available places, please check _Get endpoints by type_. Default is `random`.";
                };
                readonly output_format: {
                    readonly type: "string";
                    readonly enum: readonly ["protocol:auth@endpoint", "endpoint:auth", "auth@endpoint"];
                    readonly default: "protocol:auth@endpoint";
                    readonly description: "Output format type. Default is `protocol:auth@endpoint`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly count: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 10;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Count of routes that will be generated and returned. Min value is 1, max value depends on param `page` and specific location. Default is 10.";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Page of the routes(pagination). Min value is 1, max value depends on param `count` and specific location. Default is 1.";
                };
                readonly response_format: {
                    readonly type: "string";
                    readonly enum: readonly ["json", "txt", "html"];
                    readonly default: "json";
                    readonly description: "What response type will be returned. Could be `json`, `txt` or `html`. Default is `json`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly line_break: {
                    readonly type: "string";
                    readonly enum: readonly ["\\n", "\\r\\n", "\\r", "\\t"];
                    readonly default: "\\n";
                    readonly description: "What line break will be used in response content. This is **required** if param `responseType` value is `txt`. Default is `\\n`.";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly domain: {
                    readonly type: "string";
                    readonly default: "smartproxy.com";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "What domain should be used for routes. `visitxiangtan.com` is for Mainland China customers, `smartproxy.com` for the rest, `ip` is for using IP address instead of a domain. Default is `smartproxy.com`.";
                };
                readonly ip: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "IP address to be used instead of a domain. This field is **required** if param `domain` value is `ip`.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
                readonly examples: readonly ["http://user-smith-sessionduration-1:ao5nf23j4n@gate.visitxiangtan.com:10000"];
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Invalid data provided."];
                };
                readonly violations: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["sessionType: The value you selected is not a valid choice."];
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetAllocatedSubUserTraffic: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly service_type: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Possible parameters: residential_proxies, shared_proxies";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly allocated_traffic_limit: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [728];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetEndpoints: {
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetEndpointsByType: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly type: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Possible parameters: random, sticky";
                };
            };
            readonly required: readonly ["type"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetSubUser: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sub_user_id: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["sub_user_id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [1];
                };
                readonly username: {
                    readonly type: "string";
                    readonly examples: readonly ["name"];
                };
                readonly status: {
                    readonly type: "string";
                    readonly examples: readonly ["active"];
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly examples: readonly ["2021-07-01 00:00"];
                };
                readonly traffic: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [0];
                };
                readonly traffic_limit: {};
                readonly service_type: {
                    readonly type: "string";
                    readonly examples: readonly ["type"];
                };
                readonly traffic_count_from: {};
                readonly auto_disable: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly error_code: {
                    readonly type: "string";
                    readonly examples: readonly ["bad_request"];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Can not process request"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetSubUserTraffic: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sub_user_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "\"Get sub users\" received sub user ID";
                };
            };
            readonly required: readonly ["sub_user_id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly type: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Available types: 24h, 7days, month, custom. If custom type is selected you can provide **from** and **to** parameters or leave them empty and then they will have default values, sub-user creation date, and current date respectively.";
                };
                readonly from: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Use date format yyyy-mm-dd";
                };
                readonly to: {
                    readonly type: "string";
                    readonly format: "date";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Use date format yyyy-mm-dd";
                };
                readonly service_type: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Possible parameters: residential_proxies, [shared_proxies](https://smartproxy.com/proxies/datacenter-proxies)";
                };
            };
            readonly required: readonly ["type"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly traffic: {
                    readonly type: "number";
                    readonly default: 0;
                    readonly examples: readonly [4.7];
                };
                readonly traffic_rx: {
                    readonly type: "number";
                    readonly default: 0;
                    readonly examples: readonly [4.2];
                };
                readonly traffic_tx: {
                    readonly type: "number";
                    readonly default: 0;
                    readonly examples: readonly [0.5];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetSubUsers: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly service_type: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Possible parameters: residential_proxies, shared_proxies";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetSubscriptions: {
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetWhitelistedIps: {
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const UpdateSubUser: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly traffic_limit: {
                readonly type: "number";
                readonly description: "Traffic limit";
                readonly format: "float";
                readonly minimum: -3.402823669209385e+38;
                readonly maximum: 3.402823669209385e+38;
            };
            readonly auto_disable: {
                readonly type: "boolean";
                readonly description: "Disables subuser when the traffic limit is hit";
                readonly default: false;
            };
            readonly password: {
                readonly type: "string";
                readonly format: "json";
            };
            readonly traffic_count_from: {
                readonly type: "string";
                readonly description: "Handles subuser subscription traffic starting from the specified date. Use date format yyyy-mm-dd hh:mm:ss.";
                readonly format: "date";
            };
            readonly status: {
                readonly type: "string";
                readonly description: "Possible values: 'active' or 'disabled'";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sub_user_id: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "\"Get sub users\" received sub user ID";
                };
            };
            readonly required: readonly ["sub_user_id"];
        }];
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly error_code: {
                    readonly type: "string";
                    readonly examples: readonly ["bad_request"];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Can not process request"];
                };
                readonly error: {
                    readonly type: "object";
                    readonly properties: {
                        readonly password: {
                            readonly type: "string";
                            readonly examples: readonly ["password must be between 9 and 64 characters and must contain at least one number. Symbols @ and : are invalid"];
                        };
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
export { AddWhitelistedIps, CreateSubUser, DeleteSubUser, DeleteWhitelistedIp, GenerateCustomBackConnectEndpoints, GenerateCustomEndpoints, GetAllocatedSubUserTraffic, GetEndpoints, GetEndpointsByType, GetSubUser, GetSubUserTraffic, GetSubUsers, GetSubscriptions, GetWhitelistedIps, UpdateSubUser };
