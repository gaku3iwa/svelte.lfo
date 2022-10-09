<script>
	import { calcVolume } from "../Lib/util.svelte";
	export let Param;

	let p = Param;

	function Exec() {
		let context = new AudioContext();
		const tm_zero = context.currentTime;

		// Create the instance of OscillatorNode
		let osc = context.createOscillator();
		osc.type = "square";
		osc.frequency.value = p.frequency;
		osc.frequency.setValueAtTime(p.frequency, tm_zero);

		// Set Amplitude      [vol][amp ± dep]
		let amp = context.createGain();
		amp.gain.value = calcVolume(p.volume);

		// Set Depth          [Hz][osc ± dep]
		let dep = context.createGain();
		dep.gain.value = 0;
		dep.gain.setValueAtTime(p.v_depth, tm_zero + p.e_delay);
		dep.gain.setValueAtTime(0, tm_zero + p.e_delay + p.e_gatetime);

		// Set Speed          [Hz]
		let lfo = context.createOscillator();
		lfo.frequency.value = 0;
		lfo.frequency.setValueAtTime(p.v_speed, tm_zero + p.e_delay);
		lfo.frequency.setValueAtTime(0, tm_zero + p.e_delay + p.e_gatetime);

		// Connection
		amp.connect(context.destination);
		osc.connect(amp);
		dep.connect(osc.frequency);
		lfo.connect(dep);

		// Start Sound & Effect
		osc.start(tm_zero);
		lfo.start(tm_zero);

		// Stop Sound & Effect
		osc.stop(tm_zero + p.gatetime);
		lfo.stop(tm_zero + p.gatetime);
	}
</script>

<button class="w" on:click={Exec}>{p.v_name}</button>

<style>
	.w {
		margin: 0;
		width: 200px;
	}
</style>
