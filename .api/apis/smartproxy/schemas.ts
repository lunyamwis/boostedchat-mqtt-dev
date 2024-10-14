const AddWhitelistedIps = {"body":{"type":"object","properties":{"IPAddressList":{"type":"array","items":{"type":"string"}}},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"response":{"200":{"type":"object","properties":{},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const CreateSubUser = {"body":{"type":"object","required":["username","password","service_type"],"properties":{"username":{"type":"string","description":"From 3 to 64 characters long. Only letters, numbers and underscores allowed.","format":"json"},"password":{"type":"string","description":"9 or more characters. Must include at least one upper case letter and a number. Symbols @ and : are not allowed","format":"json"},"service_type":{"type":"string","description":"Possible parameters: residential_proxies, shared_proxies","default":"residential_proxies"},"traffic_limit":{"type":"number","format":"float","minimum":-3.402823669209385e+38,"maximum":3.402823669209385e+38},"auto_disable":{"type":"boolean","description":"Disables subuser when the traffic limit is hit","default":false},"traffic_count_from":{"type":"string","description":"Handles subuser subscription traffic starting from the specified date. Use date format yyyy-mm-dd hh:mm:ss.","format":"date"}},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"response":{"201":{"type":"object","properties":{},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"type":"object","properties":{"error_code":{"type":"string","examples":["bad_request"]},"message":{"type":"string","examples":["Can not process request"]},"error":{"type":"object","properties":{"username":{"type":"string","examples":["username must be between 3 and 64 characters. Only numbers, characters and underscore are allowed"]},"password":{"type":"string","examples":["password must be between 9 and 64 characters and must contain at least one number. Symbols @ and : are invalid"]}}}},"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const DeleteSubUser = {"metadata":{"allOf":[{"type":"object","properties":{"sub_user_id":{"type":"integer","format":"int32","minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#","description":"\"Get sub users\" received sub user ID"}},"required":["sub_user_id"]}]},"response":{"204":{"type":"object","properties":{},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const DeleteWhitelistedIp = {"metadata":{"allOf":[{"type":"object","properties":{"id":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Type in the ID of IP here - [Get Whitelisted IPs](https://help.smartproxy.com/reference#get-whitelisted-ips)"}},"required":["id"]}]},"response":{"204":{"type":"object","properties":{},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GenerateCustomBackConnectEndpoints = {"metadata":{"allOf":[{"type":"object","properties":{"username":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Provide username for authorization. This param is **required**."},"password":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Provide password for authorization. This param is **required**."},"session_type":{"type":"string","enum":["sticky","random"],"default":"sticky","description":"Choose what session type should be used. Choose `sticky` for sticky sessions or `random` for rotating sessions. Default is `sticky`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"session_time":{"type":"integer","format":"int32","default":10,"minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Session time in minutes, range is 1-1440(inclusive).  This param is **required** if param `sessionType` value is `sticky`. Default value is 10."},"country":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Country Alpha2 code in lower case."},"state":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"You can select state if country is USA(`us`). Provide full state name with underscore instead of a space. E.g. `new_york`."},"city":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Full city name in lowercase with underscore instead of a space. E.g. `new_orleans`."},"output_format":{"type":"string","enum":["protocol:auth@endpoint","endpoint:auth","auth@endpoint"],"default":"protocol:auth@endpoint","description":"Output format type. Default is `protocol:auth@endpoint`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"count":{"type":"integer","format":"int32","default":10,"minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Count of routes that will be generated and returned. Min value is 1. Default is 10."},"page":{"type":"integer","format":"int32","default":1,"minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Page of the routes(pagination). Min value is 1. Default is 1."},"response_format":{"type":"string","enum":["json","txt","html"],"default":"json","description":"What response type will be returned. Could be `json`, `txt` or `html`. Default is `json`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"line_break":{"type":"string","enum":["\\n","\\r\\n","\\r","\\t"],"default":"\\n","description":"What line break will be used in response content. This is **required** if param `responseType` value is `txt`. Default is `\\n`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"domain":{"type":"string","default":"smartproxy.com","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"What domain should be used for routes. `visitxiangtan.com` is for Mainland China customers, `smartproxy.com` for the rest, `ip` is for using IP address instead of a domain. Default is `smartproxy.com`."},"ip":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"IP address to be used instead of a domain. This field is **required** if param `domain` value is `ip`. It always must contain port at the end e.g. `1.1.1.1:7000`."},"protocol":{"type":"string","enum":["http","https"],"default":"http","description":"What protocol should be used. Default is `http`. Works only with domains `china-gate.visitxiangtan.com` and `china-gate.visitxiangtan.com:8000`.","$schema":"https://json-schema.org/draft/2020-12/schema#"}},"required":[]}]},"response":{"200":{"type":"array","items":{"type":"string","examples":["http://user-smith-sessionduration-1:ao5nf23j4n@gate.visitxiangtan.com:10000"]},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"type":"object","properties":{"message":{"type":"string","examples":["Invalid data provided."]},"violations":{"type":"array","items":{"type":"string","examples":["sessionType: The value you selected is not a valid choice."]}}},"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GenerateCustomEndpoints = {"metadata":{"allOf":[{"type":"object","properties":{"proxy_type":{"type":"string","enum":["residential_proxies","shared_proxies"],"default":"residential_proxies","description":"For what proxy type wish to generate routes. For residential proxies choose `residential_proxies`, for datacenter choose `shared_proxies`. Default is `residential_proxies`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"auth_type":{"type":"string","enum":["basic","whitelist"],"default":"basic","description":"Provide what authorization method you want to use, it could be `basic` or `whitelist`. Default is `basic`. `whitelist` only works when param `proxyType` value is `residential_proxies`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"username":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Provide username for authorization. This param is **required** if param `authType` value is `basic`."},"password":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Provide password for authorization. This param is **required** if param `authType` value is `basic`."},"session_type":{"type":"string","enum":["sticky","random"],"default":"sticky","description":"Choose what session type should be used. Choose `sticky` for sticky sessions or `random` for rotating sessions. Default is `sticky`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"session_time":{"type":"integer","format":"int32","default":10,"minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Session time in minutes, range is 1-1440(inclusive).  This param is **required** if param `proxyType` value is `residential_proxies` and param `authType` value is `basic` and param `sessionType` value is `sticky`. Default is 10."},"location":{"type":"string","default":"random","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"One of available locations in lowercase, could be country Alpha-2 code, city or state name. To get available places, please check _Get endpoints by type_. Default is `random`."},"output_format":{"type":"string","enum":["protocol:auth@endpoint","endpoint:auth","auth@endpoint"],"default":"protocol:auth@endpoint","description":"Output format type. Default is `protocol:auth@endpoint`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"count":{"type":"integer","format":"int32","default":10,"minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Count of routes that will be generated and returned. Min value is 1, max value depends on param `page` and specific location. Default is 10."},"page":{"type":"integer","format":"int32","default":1,"minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Page of the routes(pagination). Min value is 1, max value depends on param `count` and specific location. Default is 1."},"response_format":{"type":"string","enum":["json","txt","html"],"default":"json","description":"What response type will be returned. Could be `json`, `txt` or `html`. Default is `json`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"line_break":{"type":"string","enum":["\\n","\\r\\n","\\r","\\t"],"default":"\\n","description":"What line break will be used in response content. This is **required** if param `responseType` value is `txt`. Default is `\\n`.","$schema":"https://json-schema.org/draft/2020-12/schema#"},"domain":{"type":"string","default":"smartproxy.com","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"What domain should be used for routes. `visitxiangtan.com` is for Mainland China customers, `smartproxy.com` for the rest, `ip` is for using IP address instead of a domain. Default is `smartproxy.com`."},"ip":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"IP address to be used instead of a domain. This field is **required** if param `domain` value is `ip`."}},"required":[]}]},"response":{"200":{"type":"array","items":{"type":"string","examples":["http://user-smith-sessionduration-1:ao5nf23j4n@gate.visitxiangtan.com:10000"]},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"type":"object","properties":{"message":{"type":"string","examples":["Invalid data provided."]},"violations":{"type":"array","items":{"type":"string","examples":["sessionType: The value you selected is not a valid choice."]}}},"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GetAllocatedSubUserTraffic = {"metadata":{"allOf":[{"type":"object","properties":{"service_type":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Possible parameters: residential_proxies, shared_proxies"}},"required":[]}]},"response":{"200":{"type":"object","properties":{"allocated_traffic_limit":{"type":"integer","default":0,"examples":[728]}},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GetEndpoints = {"response":{"200":{"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"type":"object","properties":{},"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GetEndpointsByType = {"metadata":{"allOf":[{"type":"object","properties":{"type":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Possible parameters: random, sticky"}},"required":["type"]}]},"response":{"200":{"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GetSubUser = {"metadata":{"allOf":[{"type":"object","properties":{"sub_user_id":{"type":"integer","format":"int32","minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#"}},"required":["sub_user_id"]}]},"response":{"200":{"type":"object","properties":{"id":{"type":"integer","default":0,"examples":[1]},"username":{"type":"string","examples":["name"]},"status":{"type":"string","examples":["active"]},"created_at":{"type":"string","examples":["2021-07-01 00:00"]},"traffic":{"type":"integer","default":0,"examples":[0]},"traffic_limit":{},"service_type":{"type":"string","examples":["type"]},"traffic_count_from":{},"auto_disable":{"type":"boolean","default":true,"examples":[false]}},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"type":"object","properties":{"error_code":{"type":"string","examples":["bad_request"]},"message":{"type":"string","examples":["Can not process request"]}},"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GetSubUserTraffic = {"metadata":{"allOf":[{"type":"object","properties":{"sub_user_id":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"\"Get sub users\" received sub user ID"}},"required":["sub_user_id"]},{"type":"object","properties":{"type":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Available types: 24h, 7days, month, custom. If custom type is selected you can provide **from** and **to** parameters or leave them empty and then they will have default values, sub-user creation date, and current date respectively."},"from":{"type":"string","format":"date","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Use date format yyyy-mm-dd"},"to":{"type":"string","format":"date","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Use date format yyyy-mm-dd"},"service_type":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Possible parameters: residential_proxies, [shared_proxies](https://smartproxy.com/proxies/datacenter-proxies)"}},"required":["type"]}]},"response":{"200":{"type":"object","properties":{"traffic":{"type":"number","default":0,"examples":[4.7]},"traffic_rx":{"type":"number","default":0,"examples":[4.2]},"traffic_tx":{"type":"number","default":0,"examples":[0.5]}},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GetSubUsers = {"metadata":{"allOf":[{"type":"object","properties":{"service_type":{"type":"string","$schema":"https://json-schema.org/draft/2020-12/schema#","description":"Possible parameters: residential_proxies, shared_proxies"}},"required":[]}]},"response":{"200":{"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GetSubscriptions = {"response":{"200":{"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const GetWhitelistedIps = {"response":{"200":{"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
const UpdateSubUser = {"body":{"type":"object","properties":{"traffic_limit":{"type":"number","description":"Traffic limit","format":"float","minimum":-3.402823669209385e+38,"maximum":3.402823669209385e+38},"auto_disable":{"type":"boolean","description":"Disables subuser when the traffic limit is hit","default":false},"password":{"type":"string","format":"json"},"traffic_count_from":{"type":"string","description":"Handles subuser subscription traffic starting from the specified date. Use date format yyyy-mm-dd hh:mm:ss.","format":"date"},"status":{"type":"string","description":"Possible values: 'active' or 'disabled'"}},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"metadata":{"allOf":[{"type":"object","properties":{"sub_user_id":{"type":"integer","format":"int32","minimum":-2147483648,"maximum":2147483647,"$schema":"https://json-schema.org/draft/2020-12/schema#","description":"\"Get sub users\" received sub user ID"}},"required":["sub_user_id"]}]},"response":{"201":{"type":"object","properties":{},"$schema":"https://json-schema.org/draft/2020-12/schema#"},"400":{"type":"object","properties":{"error_code":{"type":"string","examples":["bad_request"]},"message":{"type":"string","examples":["Can not process request"]},"error":{"type":"object","properties":{"password":{"type":"string","examples":["password must be between 9 and 64 characters and must contain at least one number. Symbols @ and : are invalid"]}}}},"$schema":"https://json-schema.org/draft/2020-12/schema#"}}} as const
;
export { AddWhitelistedIps, CreateSubUser, DeleteSubUser, DeleteWhitelistedIp, GenerateCustomBackConnectEndpoints, GenerateCustomEndpoints, GetAllocatedSubUserTraffic, GetEndpoints, GetEndpointsByType, GetSubUser, GetSubUserTraffic, GetSubUsers, GetSubscriptions, GetWhitelistedIps, UpdateSubUser }
