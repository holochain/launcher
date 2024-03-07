/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ActionHash, AgentPubKey, EntryHash } from '@holochain/client';

import type { EntityId, HRL } from '../devhub/types';

export type AppEntry = {
	title: string;
	subtitle: string;
	description: string;
	icon: EntryHash;
	publisher: EntityId;
	apphubHrl: HRL;
	editors: Array<AgentPubKey>;

	author: AgentPubKey;
	publishedAt: number;
	lastUpdated: number;
	metadata: any;

	deprecation?: DeprecationNotice;
};

export type CreateAppFrontendInput = {
	title: string;
	subtitle: string;
	description: string;
	icon: Uint8Array; // icon bytes
	publisher: EntityId;
	apphubHrl: HRL;
	editors?: Array<AgentPubKey>;

	publishedAt: number;
	lastUpdated: number;
	metadata: any;
};

export type CreateAppInput = {
	title: string;
	subtitle: string;
	description: string;
	icon: EntryHash;
	publisher: EntityId;
	apphubHrl: HRL;
	editors?: Array<AgentPubKey>;

	publishedAt: number;
	lastUpdated: number;
	metadata: any;
};

export type PublisherEntry = {
	name: string;
	location: LocationTriplet;
	website: WebAddress;
	icon: EntryHash;
	editors: Array<AgentPubKey>;

	author: AgentPubKey;
	publishedAt: number | undefined;
	lastUpdated: number | undefined;
	metadata: any;

	description: string | undefined;
	email: string | undefined;
	deprecation: DeprecationNotice | undefined;
};

export type CreatePublisherInput = {
	name: string;
	location: LocationTriplet;
	website: WebAddress;
	icon: EntryHash;

	description: string | undefined;
	email: string | undefined;
	editors: Array<AgentPubKey> | undefined;

	publishedAt: number | undefined;
	lastUpdated: number | undefined;
	metadata: any;
};

export type CreatePublisherFrontendInput = {
	name: string;
	location: LocationTriplet;
	website: WebAddress;
	icon: Uint8Array;

	description: string | undefined;
	email: string | undefined;
	editors: Array<AgentPubKey> | undefined;

	publishedAt: number | undefined;
	lastUpdated: number | undefined;
	metadata: any;
};

export type UpdatePublisherFrontendInput = {
	name?: string;
	location?: LocationTriplet;
	website?: WebAddress;
	icon?: Uint8Array;

	description?: string | undefined;
	email?: string | undefined;
	editors?: Array<AgentPubKey> | undefined;

	// TODO figure out whether that's really intentional that this is updateable
	// publishedAt?: number | undefined;
	lastUpdated?: number | undefined;
	metadata?: any;
};

export type UpdatePublisherInput = {
	name?: string;
	location?: LocationTriplet;
	website?: WebAddress;
	icon?: EntryHash;

	description?: string | undefined;
	email?: string | undefined;
	editors?: Array<AgentPubKey> | undefined;

	// TODO figure out whether that's really intentional that this is updateable
	// publishedAt?: number | undefined;
	lastUpdated?: number | undefined;
	metadata?: any;
};

export type DeprecateInput = {
	base: ActionHash;
	message: string;
};

export type UndeprecateInput = {
	base: ActionHash;
};

export type LocationTriplet = {
	country: string;
	region: string;
	city: string;
};

export type WebAddress = {
	url: string;
	context: string | undefined;
};

export type DeprecationNotice = {
	message: string;
	recommendedAlternatives: Array<ActionHash>;
};
