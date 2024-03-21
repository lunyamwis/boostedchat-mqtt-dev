import { cache } from "../config/cache";

export const addLoggedInAccount = async (igname:string) =>{
    // let accounts:any = await cache.hget("api", "loggedInAccounts") || JSON.stringify([]);
    // accounts = JSON.parse(accounts)
    let accounts = await listAccounts()
    accounts.push(igname)
    accounts = JSON.stringify(accounts)
    await cache.hset("api", {
        loggedInAccounts: accounts,
      });

}

export const removeLoggedInAccount = async (igname:string) =>{
    // console.log(`Removing logged in account: ${igname}`)
    let accounts:any = await cache.hget("api", "loggedInAccounts") || JSON.stringify([]);
    accounts = JSON.parse(accounts)
    accounts = accounts.filter((account:string)=> account != igname)
    accounts = JSON.stringify(accounts)
    await cache.hset("api", {
        loggedInAccounts: accounts,
      });
}

export const isALoggedInAccount = async (igname:string) =>{
    let accounts:any = await cache.hget("api", "loggedInAccounts") || JSON.stringify([]);
    accounts = JSON.parse(accounts)
    return accounts.includes(igname)
}

export const clearLoggedInAccounts = async () =>{
        await cache.hset("api", {
            loggedInAccounts: JSON.stringify([]),
          });
}

export const listAccounts = async () =>{
    let accounts:any = await cache.hget("api", "loggedInAccounts") || JSON.stringify([]);
    accounts = JSON.parse(accounts)
    return accounts
}



