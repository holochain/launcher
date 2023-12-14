import type { QueryClient } from '@tanstack/svelte-query';
import { createTRPCProxyClient } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';
import { svelteQueryWrapper } from 'trpc-svelte-query-adapter';

import type { AppRouter } from '../../../../main';

const client = createTRPCProxyClient<AppRouter>({
	links: [ipcLink()]
});

export function trpc(queryClient?: QueryClient) {
	return svelteQueryWrapper<AppRouter>({
		client,
		queryClient
	});
}
