import { IgApiClientRealtime } from "instagram_mqtt";

export type AccountInstanceWithId = {
  userId: number;
  instance: IgApiClientRealtime;
};

export type TAccountInstances = Map<string, AccountInstanceWithId>;

export class AccountInstances {
  private static _accountInstances: TAccountInstances = new Map();

  public static allAccountInstances(): TAccountInstances {
    return this._accountInstances;
  }

  public static addAccountInstance(
    username: string,
    instance: AccountInstanceWithId
  ) {
    this._accountInstances.set(username, instance);
  }

  public static removeAccountInstance(username: string) {
    this._accountInstances.delete(username);
  }
}
