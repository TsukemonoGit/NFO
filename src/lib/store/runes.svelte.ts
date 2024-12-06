import type { EventPacket } from 'rx-nostr';
import { SvelteMap } from 'svelte/reactivity';

export const kind0Events = createKind0Events();
export const userNameList = createUserNameList();

export interface UserNames {
	petname: string | undefined;
	name: string | undefined;
	display_name: string | undefined;
}

// kind:0 イベント管理用
function createKind0Events() {
	let kind0Events: SvelteMap<string, EventPacket> = new SvelteMap();

	return {
		get: () => kind0Events,
		set: (evs: SvelteMap<string, EventPacket>) => (kind0Events = evs)
	};
}

// ユーザー名リスト管理用
function createUserNameList() {
	let _userNameList: SvelteMap<string, UserNames> = new SvelteMap();

	return {
		get: () => _userNameList,
		update: (updater: (current: SvelteMap<string, UserNames>) => void) => {
			updater(_userNameList);
		},
		set: (evs: SvelteMap<string, UserNames>) => (_userNameList = evs)
	};
}
