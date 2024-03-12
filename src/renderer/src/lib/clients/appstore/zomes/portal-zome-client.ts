import { ZomeClient } from '../../app-client/app-client';
import type { Entity } from '../../devhub/types';
import type { CustomRemoteCallInput, DnaZomeFunction, HostEntry } from '../types';

export class PortalZomeClient extends ZomeClient {
	async getHostsForZomeFunction(input: DnaZomeFunction): Promise<Array<Entity<HostEntry>>> {
		return this.callZome('get_hosts_for_zome_function', input);
	}

	async customRemoteCall<T>(input: CustomRemoteCallInput): Promise<T> {
		const response = await this.callZome('custom_remote_call', input);

		if (response.type === 'success') {
			if (response.payload.type === 'success') {
				return response.payload.payload;
			} else {
				return Promise.reject(
					`remote call for function '${input.call.function}' of zome '${input.call.zome}' failed: ${JSON.stringify(
						response.payload.payload
					)}`
				);
			}
		} else {
			return Promise.reject(
				`remote call for function '${input.call.function}' of zome '${input.call.zome}' failed: ${JSON.stringify(
					response.payload
				)}`
			);
		}
	}
}
