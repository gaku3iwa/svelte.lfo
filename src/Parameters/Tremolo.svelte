<script>
	import Tremolo from "../Components/Tremolo.svelte";
	export let Param;

	let p = Param;
</script>

<fieldset>
	<legend> Tremolo Parameters </legend>

	<Tremolo {Param} />

	<table>
		<tr>
			<th class="w1" />
			<th class="w1" />
			<th class="w2" />
		</tr>
		<tr>
			<td class="f90"> Depth </td>
			<td class="r">
				± <input class="b0r" type="number" bind:value={p.t_depth} />
			</td>
			<td class="f80"> [Amplitude ± Depth] </td>
		</tr>
		<tr>
			<td class="f90"> Speed </td>
			<td class="r">
				<input class="b0r" type="number" bind:value={p.t_speed} />
			</td>
			<td class="f80"> [Hz] </td>
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
