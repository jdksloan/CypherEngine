export class NeoKeyModel {
  public urlKey: string;
  public userKey: string;
  public passwordKey: string;
  public encryptedKey: string;
  public trustKey: string;
  public defaultQueryTimeoutKey: string;

  constructor(urlKey: string, userKey: string, passwordKey: string, encryptedKey: string, trustKey: string, defaultQueryTimeoutKey: string) {
    this.urlKey = urlKey;
    this.userKey = userKey;
    this.passwordKey = passwordKey;
    this.encryptedKey = encryptedKey;
    this.trustKey = trustKey;
    this.defaultQueryTimeoutKey = defaultQueryTimeoutKey;
  }
}
