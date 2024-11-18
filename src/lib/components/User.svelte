<script lang="ts">
	import { getProfile } from '$lib/utils/nostr';
	import { datetime, formatAbsoluteDate, formatRelativeDate } from '$lib/utils/util';
	import * as Nostr from 'nostr-typedef';
	import { Button, Dropdown, DropdownLi, DropdownUl, Modal, uiHelpers } from 'svelte-5-ui-lib';
	import { DotsVerticalOutline, ExclamationCircleOutline } from 'flowbite-svelte-icons';

	import ModalUserDetail from './ModalUserDetail.svelte';
	import { sineIn } from 'svelte/easing';
	import { nip19 } from 'nostr-tools';
	import { dontCheckFollowState } from '$lib/store/store';
	import { _ } from 'svelte-i18n';
	import { locale } from 'svelte-i18n';

	let {
		pubkey,
		kind0,
		isFollower,
		kind1,

		handleDelete
	}: {
		pubkey: string;

		kind0: Nostr.Event | undefined;
		kind1: Nostr.Event | undefined;
		isFollower: boolean | undefined;
		handleDelete: (pubkey: string) => void;
	} = $props();
	//userの
	//kind0 表示と
	//kind3 自分が含まれるか
	//最新の kind1 表示
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
	let modalStatus = $state(false);

	const closeModal = modalUserDetail.close;
	$effect(() => {
		modalStatus = modalUserDetail.isOpen;
	});

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
</script>

<div class="grid w-full grid-cols-[auto_1fr_auto] p-1">
	<div>
		<div class="relative mr-1 mt-1 h-16 w-16">
			<div class="absolute h-16 w-16 overflow-hidden rounded-lg border border-secondary-600">
				{#if profile?.picture && profile?.picture !== ''}
					<img
						src={profile?.picture}
						alt="Avatar"
						class="absolute overflow-hidden object-cover"
						style="height: 100%; width: 100%; object-fit: cover; object-position: center;"
					/>{:else}<div class="flex h-full items-center justify-center text-center">
						no<br />Avatar
					</div>{/if}
			</div>
			{#if !$dontCheckFollowState}<div
					class="align-center absolute -left-1 -top-1 z-10 flex h-6 w-6 items-center justify-center overflow-visible rounded-full border border-secondary-600 bg-white"
				>
					{#if isFollower}🫂{:else if isFollower === false}😐{:else}❔️{/if}
				</div>{/if}
		</div>
	</div>
	<div class="flex flex-col">
		<div class=" text-secondary-600">
			{profile?.display_name ?? ''}@{profile?.name && profile.name !== '' ? profile.name : 'noname'}
		</div>
		{#if kind1}<div class="font-bold">
				latest note at
				<time class=" inline-flex" datetime={datetime(kind1.created_at)}
					>{formatAbsoluteDate(kind1.created_at)}</time
				>
				( {formatRelativeDate(kind1.created_at, $locale)} )
			</div>
			<div class="my-1 whitespace-pre-wrap break-words" style="word-break: break-word;">
				{kind1.content}
			</div>{/if}
	</div>
	<div>
		<div class="flex items-start justify-center">
			<Button onclick={dropdown.toggle} pill={true} class=" !p-1.5" color="secondary"
				><DotsVerticalOutline class="dots-menu cursor-pointer dark:text-white" /></Button
			>
			<div class="relative">
				<Dropdown
					{dropdownStatus}
					closeDropdown={closeDropdownIcon}
					params={{ y: 0, duration: 200, easing: sineIn }}
					class="absolute top-[20px]   w-fit -translate-x-full  break-keep"
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
	<ModalUserDetail {kind0} {profile} {kind1} {isFollower} />
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
