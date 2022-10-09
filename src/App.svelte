<script>
	// ---------------------------------------------------------------------------
	// Effect parameter parts
	import Base from "./Parameters/Base.svelte";
	import Vibr from "./Parameters/Vibrato.svelte";
	import Trml from "./Parameters/Tremolo.svelte";
	import ViTr from "./Parameters/VibraTremolo.svelte";

	// ---------------------------------------------------------------------------
	// Effect arguments
	export let Param = {
		frequency: 0,
		gatetime: 0,
		volume: 0,

		e_delay: 0,
		e_gatetime: 0,

		v_name: "",
		v_depth: 0,
		v_speed: 0,

		t_name: "",
		t_depth: 0,
		t_speed: 0,

		vt_name: "",
	};
</script>

<Base {Param} />
<br />

<Vibr {Param} />
<br />

<Trml {Param} />
<br />

<ViTr {Param} />
<br />

<style>
</style>
