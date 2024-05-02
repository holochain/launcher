import type { AgentPubKey } from '@holochain/client';

import type { Entity } from '../../devhub/types';
import { ZomeClient } from '../../zome-client/zome-client';
import type { CustomRemoteCallInput, DnaZomeFunction, HostAvailability, HostEntry } from '../types';

export interface Response<T> {
  type: 'success' | 'failure';
  payload: T;
}

export class PortalZomeClient extends ZomeClient {
  async getHostsForZomeFunction(input: DnaZomeFunction): Promise<Array<Entity<HostEntry>>> {
    return this.callZome('get_hosts_for_zome_function', input);
  }

  async customRemoteCall<T>(input: CustomRemoteCallInput): Promise<T> {
    try {
      const response = await this.callZome('custom_remote_call', input);
      return response;
    } catch (e) {
      throw new Error(
        `Failed to call remote function '${input.call.function}' of zome '${input.call.zome}': ${e}`,
      );
    }
  }

  /**
   * 1. get all registered hosts for the given zome function via the get_hosts_for_zome_function zome call
   *
   * 2. for each of those hosts, send a ping via portal_api/ping zome function, with Promise.any()
   *
   * 3. return the first that responds to the ping
   */
  async getAvailableHostForZomeFunction(input: DnaZomeFunction): Promise<AgentPubKey> {
    try {
      const hosts = await this.getHostsForZomeFunction(input);

      // 2. ping each of them and take the first one that responds
      try {
        const availableHost = await Promise.any(
          hosts.map(async (hostEntryEntity) => {
            const hostPubKey = hostEntryEntity.content.author;
            // console.log("@getAvailableHostForZomeFunction: trying to ping host: ", encodeHashToBase64(hostPubKey));

            try {
              const result: Response<boolean> = await this.callZome('ping', hostPubKey);

              if (result.type === 'failure') {
                return Promise.reject(`Failed to ping host: ${result.payload}`);
              }
            } catch (e) {
              // console.error("Failed to ping host: ", e);
              return Promise.reject('Failed to ping host.');
            }
            // what happens in the "false" case? Can this happen?
            return hostPubKey;
          }),
        );

        return availableHost;
      } catch (e) {
        return Promise.reject('No available peer host found.');
      }
    } catch (e) {
      return Promise.reject(
        `Failed to get available host for zome ${input.zome} and function ${input.function}: ${e}`,
      );
    }
  }

  async getVisibleHostsForZomeFunction(
    dnaZomeFunction: DnaZomeFunction,
    timeoutMs: number = 4000,
  ): Promise<HostAvailability> {
    const responded: AgentPubKey[] = [];

    const pingTimestamp = Date.now();

    try {
      const hosts = await this.getHostsForZomeFunction(dnaZomeFunction);

      // 2. ping each of them and take the first one that responds
      await Promise.allSettled(
        hosts.map(async (hostEntryEntity) => {
          try {
            // consider hosts that do not respond after 6 seconds as offline
            const result = await this.callZome('ping', hostEntryEntity.content.author, timeoutMs);

            if (result.type === 'failure') {
              return Promise.reject(`Failed to ping host: ${result.payload}`);
            }

            responded.push(hostEntryEntity.content.author);
          } catch (e) {
            return Promise.reject(`Failed to ping host: ${e}`);
          }
        }),
      );

      return {
        responded,
        totalHosts: hosts.length,
        pingTimestamp,
      };
    } catch (e) {
      return Promise.reject(
        `Failed to get visible hosts for zome ${dnaZomeFunction.zome} and function ${dnaZomeFunction.function}: ${e}`,
      );
    }
  }

  async tryWithHosts<T>(
    fn: (host: AgentPubKey) => Promise<T>,
    dnaZomeFunction: DnaZomeFunction,
    pingTimeout: number = 3000,
  ): Promise<T> {
    // try with first responding host
    const quickestHost: AgentPubKey = await this.getAvailableHostForZomeFunction(dnaZomeFunction);
    console.log('got quickest host: ', quickestHost);
    try {
      // console.log("@tryWithHosts: trying with first responding host: ", encodeHashToBase64(host));
      const result = await fn(quickestHost);
      return result;
    } catch (e: unknown) {
      console.log('Failed: ', e);
      const errors: Array<unknown> = [];
      errors.push(JSON.stringify(e));

      // console.log("@tryWithHosts: Failed with first host: ", JSON.stringify(e));
      // if it fails with the first host, try other hosts
      const pingResult = await this.getVisibleHostsForZomeFunction(dnaZomeFunction, pingTimeout);

      const otherAvailableHosts = pingResult.responded.filter(
        (host) => host.toString() !== quickestHost.toString(),
      );

      // console.log("@tryWithHosts: other available hosts: ", availableHosts.map((hash) => encodeHashToBase64(hash)));

      // for each host, try to get stuff and if it succeeded, return,
      // otherwise go to next host
      for (const host of otherAvailableHosts) {
        try {
          // console.log("@tryWithHosts: retrying with other host: ", encodeHashToBase64(otherHost));
          const response = await fn(host);
          return response;
        } catch (e) {
          errors.push(e);
        }
      }

      return Promise.reject(
        `Callback for function '${dnaZomeFunction.function}' of zome '${dnaZomeFunction.zome}' failed for all available hosts.\nErrors: ${JSON.stringify(
          errors,
        )}`,
      );
    }
  }
}
