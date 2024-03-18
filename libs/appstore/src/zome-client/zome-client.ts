/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  AppAgentCallZomeRequest,
  AppAgentClient,
  RoleName,
  ZomeName,
} from '@holochain/client';

export class ZomeClient {
  constructor(
    public client: AppAgentClient,
    public roleName: RoleName,
    public zomeName: ZomeName,
  ) {}

  // onSignal(listener: (eventData: SIGNAL_PAYLOAD) => void | Promise<void>): UnsubscribeFunction {
  // 	return this.client.on('signal', async (signal) => {
  // 		if (
  // 			(await isSignalFromCellWithRole(this.client, this.roleName, signal)) &&
  // 			this.zomeName === signal.zome_name
  // 		) {
  // 			listener(signal.payload as SIGNAL_PAYLOAD);
  // 		}
  // 	});
  // }

  protected callZome(fn_name: string, payload: unknown, timeoutMs?: number) {
    const req: AppAgentCallZomeRequest = {
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name,
      payload,
    };
    return this.client.callZome(req, timeoutMs);
  }
}
