/** Response from getdigidollarbalance */
export interface DDBalance {
  confirmed: string;
  unconfirmed: string;
  total: string;
  address?: string;
  address_count?: number;
}
