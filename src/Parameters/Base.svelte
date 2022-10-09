<script>
	import { MAX } from "../Lib/define.svelte";
	export let Param;

	let p = Param;
</script>

<fieldset>
	<legend> Effect Base Parameters </legend>
	<table>
		<tr>
			<th class="w1" />
			<th class="w1" />
			<th class="w2" />
		</tr>
		<tr>
			<td class="f90"> Frequency </td>
			<td class="r">
				<input class="b0r" type="number" bind:value={p.frequency} min="0" />
			</td>
			<td class="f80"> [Hz] </td>
		</tr>
		<tr>
			<td class="f90"> Gate time </td>
			<td class="r">
				<input
					class="b0r"
					type="number"
					bind:value={p.gatetime}
					min="0"
					max={MAX.gatetime}
				/>
			</td>
			<td class="f80"> [sec] </td>
		</tr>
		<tr>
			<td class="f90"> Volume </td>
			<td class="r">
				<input
					class="b0r"
					type="number"
					bind:value={p.volume}
					min="0"
					max={MAX.volume}
				/>
			</td>
			<td class="f80"> [min] 0 ～ 100 [max] </td>
		</tr>

		<tr>
			<td class="f90"> Effect Delay </td>
			<td class="r">
				<input
					class="b0r"
					type="number"
					bind:value={p.e_delay}
					min="0"
					max={p.gatetime}
				/>
			</td>
			<td class="f80"> [sec] </td>
		</tr>
		<tr>
			<td class="f90"> Effect Gate time </td>
			<td class="r">
				<input
					class="b0r"
					type="number"
					bind:value={p.e_gatetime}
					min="0"
					max={p.gatetime - p.e_delay}
				/>
			</td>
			<td class="f80"> [sec] </td>
		</tr>
	</table>
</fieldset>

<style>
	fieldset {
		margin: 0;
		padding: 8;
	}
	.w1 {
		width: 100px;
	}
	.w2 {
		width: 200px;
	}
	.f80 {
		padding-left: 0.5rem;
		font-size: 80%;
	}
	.f90 {
		font-size: 80%;
	}
	.b0r {
		border: 0;
		margin: 0;
		padding: 0;
		text-align: right;
	}
	.r {
		text-align: right;
	}
	input[type="number"] {
		border: 0;
		margin: 0;
		padding: 0;
		width: 3rem;
	}
	table,
	td {
		border: 0 #ff0000 solid;
	}
	td {
		vertical-align: middle;
	}
	th {
		border: 0;
		border-spacing: 0;
		margin: 0;
		padding: 0;
		height: 0;
		visibility: hidden;
	}
</style>
