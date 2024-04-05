import { cache } from "../config/cache";

export const addLoggedInAccount = async (igname: string) => {
    // let accounts = await listAccounts()
    // accounts.push(igname)
    // accounts = JSON.stringify(accounts)
    // console.log("setting....", accounts)
    // await cache.hset("api", {
    //     loggedInAccounts: accounts,
    //   });

    await cache.hset("api.accounts.loggedin", igname, "false")
}
export const isConnectedAccount = async (igname: string) => {
    let accounts = await getConnectedAccounts()
    return accounts.includes(igname)
}
export const isDisconnectedAccount = async (igname: string) => {
    let accounts = await getDisconnectedAccounts()
    return accounts.includes(igname)
}
export const addConnectedAccount = async (igname: string) => {
    let isConnected = await isConnectedAccount(igname)
    if (!isConnected)
        await cache.hset("api.accounts.loggedin", igname, "true")
}

export const removeConnectedAccount = async (igname: string) => {
    let isConnected = await isConnectedAccount(igname)
    if (isConnected)
        await cache.hset("api.accounts.loggedin", igname, "false")
}

export const removeLoggedInAccount = async (igname: string) => {
    // // console.log(`Removing logged in account: ${igname}`)
    // let accounts: any = await cache.hget("api", "loggedInAccounts") || JSON.stringify([]);
    // accounts = JSON.parse(accounts)
    // accounts = accounts.filter((account: string) => account != igname)
    // accounts = JSON.stringify(accounts)
    // await cache.hset("api", {
    //     loggedInAccounts: accounts,
    // });
    await cache.hdel("api.accounts.loggedin", igname);
}

export const isALoggedInAccount = async (igname: string) => {
    let accounts: any = await listAccounts()
    return accounts.includes(igname)
}

export const clearLoggedInAccounts = async () => {
    const loggedInAccounts = await cache.hkeys("api.accounts.loggedin");

    // Remove each account key from the loggedin key in Redis
    if (loggedInAccounts && loggedInAccounts.length > 0) {
        await Promise.all(loggedInAccounts.map(async (account) => {
            await cache.hdel("api.accounts.loggedin", account);
        }));
    }
}

export const listAccounts = async () => {
    // let accounts:any = await cache.hget("api", "loggedInAccounts") || JSON.stringify([]);
    // accounts = JSON.parse(accounts)
    let accounts: any = []
    try {
        const loggedInAccounts = cache.hkeys("api.accounts.loggedin");
        if (loggedInAccounts !== null && loggedInAccounts !== undefined) {
            accounts = loggedInAccounts;
        }
    } catch (error) {
        // silently
    }
    return accounts
}

export const getConnectedAccounts = async () => {
    let ret: any = []
    try {
        const loggedInAccounts = await cache.hgetall("api.accounts.loggedin");
        if (loggedInAccounts !== null && loggedInAccounts !== undefined) {
            for (let account in loggedInAccounts) {
                if (loggedInAccounts[account] == "true") ret.push(account)
            }
        }
    } catch (error) {
        // silently
    }
    return ret
}

export const getDisconnectedAccounts = async () => {
    let ret: any = []
    try {
        const loggedInAccounts = await cache.hgetall("api.accounts.loggedin");
        if (loggedInAccounts !== null && loggedInAccounts !== undefined) {
            for (let account in loggedInAccounts) {
                if (loggedInAccounts[account] == "false") ret.push(account)
            }
        }
    } catch (error) {
        // silently
    }
    return ret
}



