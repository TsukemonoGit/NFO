<script lang="ts">
	import * as Nostr from 'nostr-typedef';
	import type { Profile } from '../../types/types';

	let {
		kind0,
		kind1,
		isFollower,
		profile
	}: {
		kind0: Nostr.Event | undefined;
		kind1: Nostr.Event | undefined;
		isFollower: boolean | undefined;
		profile: Profile | undefined;
	} = $props();
</script>

{profile?.about}
