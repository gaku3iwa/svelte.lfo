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

		// Set Depth          [Hz][osc ± vdep]
		let vdep = context.createGain();
		vdep.gain.value = 0;
		vdep.gain.setValueAtTime(p.v_depth, tm_zero + p.e_delay);
		vdep.gain.setValueAtTime(0, tm_zero + p.e_delay + p.e_gatetime);

		// Set Depth          [vol][amp ± tdep]
		let tdep = context.createGain();
		tdep.gain.value = 0;
		tdep.gain.setValueAtTime(calcVolume(p.t_depth), tm_zero + p.e_delay);
		tdep.gain.setValueAtTime(0, tm_zero + p.e_delay + p.e_gatetime);

		// Set Speed          [Hz]
		let vlfo = context.createOscillator();
		vlfo.frequency.value = 0;
		vlfo.frequency.setValueAtTime(p.v_speed, tm_zero + p.e_delay);
		vlfo.frequency.setValueAtTime(0, tm_zero + p.e_delay + p.e_gatetime);

		// Set Speed          [Hz]
		let tlfo = context.createOscillator();
		tlfo.frequency.value = 0;
		tlfo.frequency.setValueAtTime(p.t_speed, tm_zero + p.e_delay);
		tlfo.frequency.setValueAtTime(0, tm_zero + p.e_delay + p.e_gatetime);

		// Connection
		amp.connect(context.destination);
		osc.connect(amp);
		vdep.connect(osc.frequency);
		vlfo.connect(vdep);
		tdep.connect(amp.gain);
		tlfo.connect(tdep);

		// Start Sound & Effect
		osc.start(tm_zero);
		vlfo.start(tm_zero);
		tlfo.start(tm_zero);

		// Stop Sound & Effect
		osc.stop(tm_zero + p.gatetime);
		vlfo.stop(tm_zero + p.gatetime);
		tlfo.stop(tm_zero + p.gatetime);
	}
</script>

<button class="w" on:click={Exec}>{p.vt_name}</button>

<style>
	.w {
		margin: 0;
		width: 200px;
	}
</style>
