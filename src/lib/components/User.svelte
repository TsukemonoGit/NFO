<script lang="ts">
	import { getProfile } from '$lib/utils/nostr';

	import {
		Button,
		Checkbox,
		Dropdown,
		DropdownLi,
		DropdownUl,
		Modal,
		uiHelpers
	} from 'svelte-5-ui-lib';
	import { DotsVerticalOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';

	import ModalUserDetail from './ModalUserDetail.svelte';
	import { sineIn } from 'svelte/easing';
	import { nip19 } from 'nostr-tools';
	import { deleteList, multiple } from '$lib/store/store';
	import { t as _ } from '@konemono/svelte5-i18n';

	import UserLayout from './UserLayout.svelte';
	import { kind0Events } from '$lib/store/runes.svelte';

	let {
		pubkey,

		handleDelete
	}: {
		pubkey: string;

		handleDelete: (pubkey: string) => void;
	} = $props();
	//userの
	//kind0 表示と
	//kind3 自分が含まれるか
	//最新の kind1 表示
	let kind0 = $derived(kind0Events.get().get(pubkey)?.event);

	const profile = $derived(getProfile(kind0));

	let dropdown = uiHelpers();
	let dropdownStatus = $state(false);
	let closeDropdownIcon = dropdown.close;
	$effect(() => {
		dropdownStatus = dropdown.isOpen;
	});

	const dropdowmMenu = [
		{ name: 'detail', value: $_('dropdownMenu.detail') },
		{ name: 'njump', value: $_('dropdownMenu.njump') },
		{ name: 'delete', value: $_('dropdownMenu.delete') }
	];
	const modalUserDetail = uiHelpers();
	let modalStatus = $derived(modalUserDetail.isOpen);

	const closeModal = modalUserDetail.close;
	// $effect(() => {
	// 	modalStatus = modalUserDetail.isOpen;
	// });

	const modalTitle = $derived(
		`${profile?.display_name ?? ''}@${profile?.name && profile.name !== '' ? profile.name : 'noname'}`
	);

	const handleClickMenu = async (name: string) => {
		console.log(name);
		switch (name) {
			case 'detail':
				modalUserDetail.toggle();
				dropdown.toggle();
				break;
			case 'njump':
				try {
					const url = `https://njump.me/${nip19.npubEncode(pubkey)}`;
					window.open(url, '_blank', 'noreferrer');
				} catch (error) {
					console.log(error);
				}
				dropdown.toggle();
				break;
			case 'delete':
				//確認画面出す
				//await handleDelete(pubkey);
				modalDeletePopup.toggle();
				dropdown.toggle();
				break;
		}
	};
	const modalDeletePopup = uiHelpers();
	let modalDeleteStatus = $state(false);
	const closeDeleteModal = modalDeletePopup.close;
	$effect(() => {
		modalDeleteStatus = modalDeletePopup.isOpen;
	});

	const handleClickCheck = (e: Event) => {
		//	console.log((e.target as HTMLInputElement)?.checked);
		if ((e.target as HTMLInputElement)?.checked) {
			$deleteList.push(pubkey);
		} else {
			$deleteList = $deleteList.filter((pub) => pub !== pubkey);
		}
		$deleteList = $deleteList;
	};
</script>

<div class="grid w-full grid-cols-[1fr_auto] p-1">
	<UserLayout {pubkey} />
	<div>
		<div class="flex items-start justify-center">
			{#if $multiple}
				<Checkbox onchange={handleClickCheck} style="min-height:24px;min-width:24px;" />
				<!---->
			{:else}
				<Button onclick={dropdown.toggle} pill={true} class=" !p-1.5" color="secondary"
					><DotsVerticalOutline class="dots-menu cursor-pointer dark:text-white" /></Button
				>{/if}
			<div class="relative">
				<Dropdown
					{dropdownStatus}
					closeDropdown={closeDropdownIcon}
					params={{ y: 0, duration: 200, easing: sineIn }}
					class="absolute top-[20px]   w-40  -translate-x-full  break-keep"
				>
					<DropdownUl>
						{#each dropdowmMenu as { name, value }}
							<DropdownLi liClass="hover:bg-primary-300/50  cursor-pointer px-2 py-1 "
								><button class="w-full text-left" onclick={() => handleClickMenu(name)}
									>{value}</button
								></DropdownLi
							>{/each}
					</DropdownUl>
				</Dropdown>
			</div>
		</div>
		<!-- <Button onclick={modalUserDetail.toggle}>detail</Button> -->
	</div>
</div>
<Modal title={modalTitle} {modalStatus} {closeModal}>
	<ModalUserDetail {pubkey} />
</Modal>
<Modal size="xs" modalStatus={modalDeleteStatus} closeModal={closeDeleteModal}>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			{$_('unfollow.text')}
		</h3>
		<Button
			color="red"
			class="me-2"
			onclick={async () => {
				modalDeletePopup.isOpen = false;

				handleDelete(pubkey);
			}}>{$_('unfollow.sure')}</Button
		>
		<Button color="alternative" onclick={() => (modalDeletePopup.isOpen = false)}
			>{$_('unfollow.cancel')}</Button
		>
	</div>
</Modal>
