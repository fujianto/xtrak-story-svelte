<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf'
	import MyButton from './MyButton.svelte'
	import { fn } from '@storybook/test'

	const { Story } = defineMeta({
		title: 'Input/MyButton',
		component: MyButton,
		tags: ['autodocs'],
		args: {
			primary: false,
			backgroundColor: 'Example Label',
			size: 'small',
			label: 'Example Label',
			onClick: fn(),
		},
	})
</script>

<Story
	name="Default"
	args={{
		primary: false,
		backgroundColor: 'Example Label',
		size: 'small',
		label: 'Example Label',
		onClick: fn(),
	}}
/>
