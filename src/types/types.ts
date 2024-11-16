import type { Nip46SessionState } from 'nostr-signer-connector';

export type LoginData = {
	type: string;
	session?: Nip46SessionState;
};

export interface Profile {
	[key: string]: any;
	name?: string;
	about?: string;
	picture?: string;
	nip05?: string;
	display_name?: string;
	website?: string;
	banner?: string;
	bot?: boolean;
	lud16?: string;
	lud06?: string;
}
