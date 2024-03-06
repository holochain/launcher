import {
	type AppAgentCallZomeRequest,
	type AppAgentClient,
	decodeHashFromBase64,
	encodeHashToBase64,
	type EntryHash
} from '@holochain/client';
import { gunzipSync, gzipSync } from 'fflate';
import { sha256 } from 'js-sha256';

export type MemoryEntry = {
	hash: string;
	compression: CompressionType | undefined;
	uncompressedSize: number | undefined;
	memorySize: number;
	blockAddresses: Array<EntryHash>;
};

export type MemoryBlockEntry = {
	sequence: SequencePosition;
	bytes: Uint8Array;
};

export type SequencePosition = {
	position: number;
	length: number;
};

// atm only gzip is supported
export type CompressionType = 'gzip';

export class MereMemoryClient {
	constructor(
		public client: AppAgentClient,
		public roleName = 'mere_memory',
		public zomeName = 'mere_memory_api'
	) {}

	hashBytes(bytes: Uint8Array): string {
		return sha256.hex(bytes);
	}

	async memoryExists(bytesHash: string): Promise<Array<EntryHash> | undefined> {
		const response: Array<EntryHash> | undefined = await this.callZome('memory_exists', bytesHash);
		if (!response) return undefined;

		// deduplicate entry hashes
		return Array.from(new Set(response.map((entryHash) => encodeHashToBase64(entryHash)))).map(
			(hash) => decodeHashFromBase64(hash)
		);
	}

	async createMemoryEntry(memoryEntry: MemoryEntry): Promise<EntryHash> {
		return this.callZome('create_memory_entry', memoryEntry);
	}

	async createMemoryBlockEntry(block: MemoryBlockEntry): Promise<EntryHash> {
		return this.callZome('create_memory_block_entry', block);
	}

	async saveBytes(bytes: Uint8Array): Promise<EntryHash> {
		const bytesHash = this.hashBytes(bytes);

		const uncompressedSize = bytes.length;

		// TODO potentially check whether it already exists to not recreate the same entries

		// set modification time to 0 to produce consistent hashes (assumption)
		const compressedBytes = gzipSync(bytes, { mtime: 0 });

		const compressedSize = compressedBytes.length;

		const chunks = new Chunker(compressedBytes);
		const blockAddresses = [];

		let position = 1;
		for (const chunk of chunks) {
			// create memory block entry
			const blockEntryHash = await this.createMemoryBlockEntry({
				sequence: {
					position: position++,
					length: chunks.length
				},
				bytes: chunk
			});

			blockAddresses.push(blockEntryHash);
		}

		return this.createMemoryEntry({
			hash: bytesHash,
			compression: 'gzip',
			uncompressedSize,
			memorySize: compressedSize,
			blockAddresses
		});
	}

	async getMereMemoryBytes(entryHash: EntryHash): Promise<Uint8Array> {
		const memoryEntry: MemoryEntry = await this.getMemoryEntry(entryHash);

		if (memoryEntry.compression !== 'gzip')
			throw new Error(`Got invalid compression type: ${memoryEntry.compression}`);

		const bytes = new Uint8Array(memoryEntry.memorySize);

		let index = 0;

		for (const blockAddress of memoryEntry.blockAddresses) {
			const block = await this.getMemoryBlockEntry(blockAddress);
			bytes.set(block.bytes, index);
			index += block.bytes.length;
		}
		// TODO verify bytes
		return gunzipSync(bytes);
	}

	async getMemoryEntry(entryHash: EntryHash): Promise<MemoryEntry> {
		return this.callZome('get_memory_entry', entryHash);
	}

	async getMemoryBlockEntry(blockAddress: EntryHash): Promise<MemoryBlockEntry> {
		return this.callZome('get_memory_block_entry', blockAddress);
	}

	protected callZome(fn_name: string, payload: unknown) {
		const req: AppAgentCallZomeRequest = {
			role_name: this.roleName,
			zome_name: this.zomeName,
			fn_name,
			payload
		};
		return this.client.callZome(req);
	}
}

export class Chunker {
	_chunk_size: number;
	_bytes: Uint8Array;

	constructor(bytes: Uint8Array, chunk_size: number = 1024 * 1024 * 2) {
		if (!(bytes instanceof Uint8Array) || bytes === null)
			throw new TypeError(`Expected Uint8Array for bytes but got type '${typeof bytes}'`);

		this._bytes = bytes;
		this._chunk_size = chunk_size;
	}

	get chunkSize() {
		return this._chunk_size;
	}

	get bytes() {
		return this._bytes;
	}

	get length() {
		return Math.ceil(this.bytes.length / this.chunkSize);
	}

	*iterator() {
		let index = -1;

		while ((index + 1) * this.chunkSize < this.bytes.length) {
			index++;

			const start = index * this.chunkSize;
			const end = Math.min((index + 1) * this.chunkSize, this.bytes.length);

			yield this.bytes.slice(start, end);
		}
	}

	[Symbol.iterator]() {
		return this.iterator();
	}

	toString() {
		return `Chunker { length: ${this.length} }`;
	}

	toJSON() {
		return `Chunker { length: ${this.length} }`;
	}
}
