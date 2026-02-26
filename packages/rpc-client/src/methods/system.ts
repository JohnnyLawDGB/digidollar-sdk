import type { Transport } from '../transport.js';
import type { DDStats, DcaMultiplier, DeploymentInfo, ProtectionStatus } from '../types/system.js';

export interface SystemMethods {
  /** Get DigiDollar system stats (health, supply, collateral, oracle price) */
  getStats(): Promise<DDStats>;

  /** Get DCA multiplier for current or specified system health */
  getDcaMultiplier(systemHealth?: number): Promise<DcaMultiplier>;

  /** Get DigiDollar deployment info (BIP9 activation status) */
  getDeploymentInfo(): Promise<DeploymentInfo>;

  /** Get protection mechanism status (DCA, ERR, volatility) */
  getProtectionStatus(): Promise<ProtectionStatus>;
}

export function createSystemMethods(transport: Transport): SystemMethods {
  return {
    getStats() {
      return transport.call<DDStats>('getdigidollarstats');
    },

    getDcaMultiplier(systemHealth?: number) {
      const args: unknown[] = [];
      if (systemHealth !== undefined) args.push(systemHealth);
      return transport.call<DcaMultiplier>('getdcamultiplier', args);
    },

    getDeploymentInfo() {
      return transport.call<DeploymentInfo>('getdigidollardeploymentinfo');
    },

    getProtectionStatus() {
      return transport.call<ProtectionStatus>('getprotectionstatus');
    },
  };
}
