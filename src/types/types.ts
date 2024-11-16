import type { Nip46SessionState } from 'nostr-signer-connector';

export type LoginData = {
	type: string;
	session?: Nip46SessionState;
};
