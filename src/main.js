import App from "./App.svelte";

const app = new App({
	target: document.body,
	props: {
		Param: {
			frequency: 440,
			gatetime: 4,
			volume: 20,

			e_delay: 1,
			e_gatetime: 2,

			v_name: "ビブラート",
			v_depth: 10,
			v_speed: 8,

			t_name: "トレモロ",
			t_depth: 10,
			t_speed: 8,

			vt_name: "ビブラート＆トレモロ",
		},
	},
});

export default app;
