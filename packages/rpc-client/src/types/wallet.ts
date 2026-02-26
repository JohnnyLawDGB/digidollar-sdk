/** Single entry from listdigidollaraddresses */
export interface DDAddressInfo {
  address: string;
  label: string;
  balance: string;
  ismine: boolean;
  iswatchonly: boolean;
  txcount: number;
  created_date: string;
  last_used: string;
}

/** Response from validateddaddress */
export interface DDAddressValidation {
  isvalid: boolean;
  address?: string;
  network?: string;
  prefix?: string;
  ismine?: boolean;
  iswatchonly?: boolean;
  error?: string;
}

/** Response from importdigidollaraddress */
export interface ImportAddressResult {
  address: string;
  label: string;
  success: boolean;
  rescan_performed: boolean;
  transactions_found: number;
  warning?: string;
}
