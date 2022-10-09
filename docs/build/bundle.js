
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.50.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Lib\define.svelte generated by Svelte v3.50.1 */

    const MAX = {
    	gatetime: 100,
    	volume: 100,
    	int16: 32_767,
    	int32: 2_147_483_647,
    	uint16: 65_535,
    	uint32: 4_294_967_295
    };

    /* src\Parameters\Base.svelte generated by Svelte v3.50.1 */
    const file$7 = "src\\Parameters\\Base.svelte";

    function create_fragment$7(ctx) {
    	let fieldset;
    	let legend;
    	let t1;
    	let table;
    	let tr0;
    	let th0;
    	let t2;
    	let th1;
    	let t3;
    	let th2;
    	let t4;
    	let tr1;
    	let td0;
    	let t6;
    	let td1;
    	let input0;
    	let t7;
    	let td2;
    	let t9;
    	let tr2;
    	let td3;
    	let t11;
    	let td4;
    	let input1;
    	let t12;
    	let td5;
    	let t14;
    	let tr3;
    	let td6;
    	let t16;
    	let td7;
    	let input2;
    	let t17;
    	let td8;
    	let t19;
    	let tr4;
    	let td9;
    	let t21;
    	let td10;
    	let input3;
    	let input3_max_value;
    	let t22;
    	let td11;
    	let t24;
    	let tr5;
    	let td12;
    	let t26;
    	let td13;
    	let input4;
    	let input4_max_value;
    	let t27;
    	let td14;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			legend = element("legend");
    			legend.textContent = "Effect Base Parameters";
    			t1 = space();
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			t2 = space();
    			th1 = element("th");
    			t3 = space();
    			th2 = element("th");
    			t4 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Frequency";
    			t6 = space();
    			td1 = element("td");
    			input0 = element("input");
    			t7 = space();
    			td2 = element("td");
    			td2.textContent = "[Hz]";
    			t9 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			td3.textContent = "Gate time";
    			t11 = space();
    			td4 = element("td");
    			input1 = element("input");
    			t12 = space();
    			td5 = element("td");
    			td5.textContent = "[sec]";
    			t14 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.textContent = "Volume";
    			t16 = space();
    			td7 = element("td");
    			input2 = element("input");
    			t17 = space();
    			td8 = element("td");
    			td8.textContent = "[min] 0 ～ 100 [max]";
    			t19 = space();
    			tr4 = element("tr");
    			td9 = element("td");
    			td9.textContent = "Effect Delay";
    			t21 = space();
    			td10 = element("td");
    			input3 = element("input");
    			t22 = space();
    			td11 = element("td");
    			td11.textContent = "[sec]";
    			t24 = space();
    			tr5 = element("tr");
    			td12 = element("td");
    			td12.textContent = "Effect Gate time";
    			t26 = space();
    			td13 = element("td");
    			input4 = element("input");
    			t27 = space();
    			td14 = element("td");
    			td14.textContent = "[sec]";
    			add_location(legend, file$7, 8, 1, 121);
    			attr_dev(th0, "class", "w1 svelte-1ps72wy");
    			add_location(th0, file$7, 11, 3, 185);
    			attr_dev(th1, "class", "w1 svelte-1ps72wy");
    			add_location(th1, file$7, 12, 3, 207);
    			attr_dev(th2, "class", "w2 svelte-1ps72wy");
    			add_location(th2, file$7, 13, 3, 229);
    			add_location(tr0, file$7, 10, 2, 176);
    			attr_dev(td0, "class", "f90 svelte-1ps72wy");
    			add_location(td0, file$7, 16, 3, 268);
    			attr_dev(input0, "class", "b0r svelte-1ps72wy");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", "0");
    			add_location(input0, file$7, 18, 4, 325);
    			attr_dev(td1, "class", "r svelte-1ps72wy");
    			add_location(td1, file$7, 17, 3, 305);
    			attr_dev(td2, "class", "f80 svelte-1ps72wy");
    			add_location(td2, file$7, 20, 3, 408);
    			add_location(tr1, file$7, 15, 2, 259);
    			attr_dev(td3, "class", "f90 svelte-1ps72wy");
    			add_location(td3, file$7, 23, 3, 457);
    			attr_dev(input1, "class", "b0r svelte-1ps72wy");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", MAX.gatetime);
    			add_location(input1, file$7, 25, 4, 514);
    			attr_dev(td4, "class", "r svelte-1ps72wy");
    			add_location(td4, file$7, 24, 3, 494);
    			attr_dev(td5, "class", "f80 svelte-1ps72wy");
    			add_location(td5, file$7, 33, 3, 650);
    			add_location(tr2, file$7, 22, 2, 448);
    			attr_dev(td6, "class", "f90 svelte-1ps72wy");
    			add_location(td6, file$7, 36, 3, 700);
    			attr_dev(input2, "class", "b0r svelte-1ps72wy");
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "min", "0");
    			attr_dev(input2, "max", MAX.volume);
    			add_location(input2, file$7, 38, 4, 754);
    			attr_dev(td7, "class", "r svelte-1ps72wy");
    			add_location(td7, file$7, 37, 3, 734);
    			attr_dev(td8, "class", "f80 svelte-1ps72wy");
    			add_location(td8, file$7, 46, 3, 886);
    			add_location(tr3, file$7, 35, 2, 691);
    			attr_dev(td9, "class", "f90 svelte-1ps72wy");
    			add_location(td9, file$7, 50, 3, 952);
    			attr_dev(input3, "class", "b0r svelte-1ps72wy");
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "min", "0");
    			attr_dev(input3, "max", input3_max_value = /*p*/ ctx[0].gatetime);
    			add_location(input3, file$7, 52, 4, 1012);
    			attr_dev(td10, "class", "r svelte-1ps72wy");
    			add_location(td10, file$7, 51, 3, 992);
    			attr_dev(td11, "class", "f80 svelte-1ps72wy");
    			add_location(td11, file$7, 60, 3, 1145);
    			add_location(tr4, file$7, 49, 2, 943);
    			attr_dev(td12, "class", "f90 svelte-1ps72wy");
    			add_location(td12, file$7, 63, 3, 1195);
    			attr_dev(input4, "class", "b0r svelte-1ps72wy");
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "min", "0");
    			attr_dev(input4, "max", input4_max_value = /*p*/ ctx[0].gatetime - /*p*/ ctx[0].e_delay);
    			add_location(input4, file$7, 65, 4, 1259);
    			attr_dev(td13, "class", "r svelte-1ps72wy");
    			add_location(td13, file$7, 64, 3, 1239);
    			attr_dev(td14, "class", "f80 svelte-1ps72wy");
    			add_location(td14, file$7, 73, 3, 1407);
    			add_location(tr5, file$7, 62, 2, 1186);
    			attr_dev(table, "class", "svelte-1ps72wy");
    			add_location(table, file$7, 9, 1, 165);
    			attr_dev(fieldset, "class", "svelte-1ps72wy");
    			add_location(fieldset, file$7, 7, 0, 108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, legend);
    			append_dev(fieldset, t1);
    			append_dev(fieldset, table);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t2);
    			append_dev(tr0, th1);
    			append_dev(tr0, t3);
    			append_dev(tr0, th2);
    			append_dev(table, t4);
    			append_dev(table, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t6);
    			append_dev(tr1, td1);
    			append_dev(td1, input0);
    			set_input_value(input0, /*p*/ ctx[0].frequency);
    			append_dev(tr1, t7);
    			append_dev(tr1, td2);
    			append_dev(table, t9);
    			append_dev(table, tr2);
    			append_dev(tr2, td3);
    			append_dev(tr2, t11);
    			append_dev(tr2, td4);
    			append_dev(td4, input1);
    			set_input_value(input1, /*p*/ ctx[0].gatetime);
    			append_dev(tr2, t12);
    			append_dev(tr2, td5);
    			append_dev(table, t14);
    			append_dev(table, tr3);
    			append_dev(tr3, td6);
    			append_dev(tr3, t16);
    			append_dev(tr3, td7);
    			append_dev(td7, input2);
    			set_input_value(input2, /*p*/ ctx[0].volume);
    			append_dev(tr3, t17);
    			append_dev(tr3, td8);
    			append_dev(table, t19);
    			append_dev(table, tr4);
    			append_dev(tr4, td9);
    			append_dev(tr4, t21);
    			append_dev(tr4, td10);
    			append_dev(td10, input3);
    			set_input_value(input3, /*p*/ ctx[0].e_delay);
    			append_dev(tr4, t22);
    			append_dev(tr4, td11);
    			append_dev(table, t24);
    			append_dev(table, tr5);
    			append_dev(tr5, td12);
    			append_dev(tr5, t26);
    			append_dev(tr5, td13);
    			append_dev(td13, input4);
    			set_input_value(input4, /*p*/ ctx[0].e_gatetime);
    			append_dev(tr5, t27);
    			append_dev(tr5, td14);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[2]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[4]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[5]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*p*/ 1 && to_number(input0.value) !== /*p*/ ctx[0].frequency) {
    				set_input_value(input0, /*p*/ ctx[0].frequency);
    			}

    			if (dirty & /*p*/ 1 && to_number(input1.value) !== /*p*/ ctx[0].gatetime) {
    				set_input_value(input1, /*p*/ ctx[0].gatetime);
    			}

    			if (dirty & /*p*/ 1 && to_number(input2.value) !== /*p*/ ctx[0].volume) {
    				set_input_value(input2, /*p*/ ctx[0].volume);
    			}

    			if (dirty & /*p*/ 1 && input3_max_value !== (input3_max_value = /*p*/ ctx[0].gatetime)) {
    				attr_dev(input3, "max", input3_max_value);
    			}

    			if (dirty & /*p*/ 1 && to_number(input3.value) !== /*p*/ ctx[0].e_delay) {
    				set_input_value(input3, /*p*/ ctx[0].e_delay);
    			}

    			if (dirty & /*p*/ 1 && input4_max_value !== (input4_max_value = /*p*/ ctx[0].gatetime - /*p*/ ctx[0].e_delay)) {
    				attr_dev(input4, "max", input4_max_value);
    			}

    			if (dirty & /*p*/ 1 && to_number(input4.value) !== /*p*/ ctx[0].e_gatetime) {
    				set_input_value(input4, /*p*/ ctx[0].e_gatetime);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Base', slots, []);
    	let { Param } = $$props;
    	let p = Param;
    	const writable_props = ['Param'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Base> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		p.frequency = to_number(this.value);
    		$$invalidate(0, p);
    	}

    	function input1_input_handler() {
    		p.gatetime = to_number(this.value);
    		$$invalidate(0, p);
    	}

    	function input2_input_handler() {
    		p.volume = to_number(this.value);
    		$$invalidate(0, p);
    	}

    	function input3_input_handler() {
    		p.e_delay = to_number(this.value);
    		$$invalidate(0, p);
    	}

    	function input4_input_handler() {
    		p.e_gatetime = to_number(this.value);
    		$$invalidate(0, p);
    	}

    	$$self.$$set = $$props => {
    		if ('Param' in $$props) $$invalidate(1, Param = $$props.Param);
    	};

    	$$self.$capture_state = () => ({ MAX, Param, p });

    	$$self.$inject_state = $$props => {
    		if ('Param' in $$props) $$invalidate(1, Param = $$props.Param);
    		if ('p' in $$props) $$invalidate(0, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		p,
    		Param,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler
    	];
    }

    class Base extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { Param: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Base",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Param*/ ctx[1] === undefined && !('Param' in props)) {
    			console.warn("<Base> was created without expected prop 'Param'");
    		}
    	}

    	get Param() {
    		throw new Error("<Base>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Param(value) {
    		throw new Error("<Base>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Lib\util.svelte generated by Svelte v3.50.1 */

    function calcVolume(volume) {
    	return Math.cos((1.0 - volume / 100.0) * 0.5 * Math.PI);
    }

    /* src\Components\Vibrato.svelte generated by Svelte v3.50.1 */
    const file$6 = "src\\Components\\Vibrato.svelte";

    function create_fragment$6(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = `${/*p*/ ctx[0].v_name}`;
    			attr_dev(button, "class", "w svelte-1t7ig7m");
    			add_location(button, file$6, 48, 0, 1309);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*Exec*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Vibrato', slots, []);
    	let { Param } = $$props;
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

    	const writable_props = ['Param'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Vibrato> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Param' in $$props) $$invalidate(2, Param = $$props.Param);
    	};

    	$$self.$capture_state = () => ({ calcVolume, Param, p, Exec });

    	$$self.$inject_state = $$props => {
    		if ('Param' in $$props) $$invalidate(2, Param = $$props.Param);
    		if ('p' in $$props) $$invalidate(0, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [p, Exec, Param];
    }

    class Vibrato extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { Param: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Vibrato",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Param*/ ctx[2] === undefined && !('Param' in props)) {
    			console.warn("<Vibrato> was created without expected prop 'Param'");
    		}
    	}

    	get Param() {
    		throw new Error("<Vibrato>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Param(value) {
    		throw new Error("<Vibrato>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Parameters\Vibrato.svelte generated by Svelte v3.50.1 */
    const file$5 = "src\\Parameters\\Vibrato.svelte";

    function create_fragment$5(ctx) {
    	let fieldset;
    	let legend;
    	let t1;
    	let vibrato;
    	let t2;
    	let table;
    	let tr0;
    	let th0;
    	let t3;
    	let th1;
    	let t4;
    	let th2;
    	let t5;
    	let tr1;
    	let td0;
    	let t7;
    	let td1;
    	let t8;
    	let input0;
    	let t9;
    	let td2;
    	let t11;
    	let tr2;
    	let td3;
    	let t13;
    	let td4;
    	let input1;
    	let t14;
    	let td5;
    	let current;
    	let mounted;
    	let dispose;

    	vibrato = new Vibrato({
    			props: { Param: /*Param*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			legend = element("legend");
    			legend.textContent = "Vibrato Parameters";
    			t1 = space();
    			create_component(vibrato.$$.fragment);
    			t2 = space();
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			t3 = space();
    			th1 = element("th");
    			t4 = space();
    			th2 = element("th");
    			t5 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Depth";
    			t7 = space();
    			td1 = element("td");
    			t8 = text("± ");
    			input0 = element("input");
    			t9 = space();
    			td2 = element("td");
    			td2.textContent = "[Frequency ± Depth]";
    			t11 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			td3.textContent = "Speed";
    			t13 = space();
    			td4 = element("td");
    			input1 = element("input");
    			t14 = space();
    			td5 = element("td");
    			td5.textContent = "[Hz]";
    			add_location(legend, file$5, 8, 1, 129);
    			attr_dev(th0, "class", "w1 svelte-1ps72wy");
    			add_location(th0, file$5, 14, 3, 215);
    			attr_dev(th1, "class", "w1 svelte-1ps72wy");
    			add_location(th1, file$5, 15, 3, 237);
    			attr_dev(th2, "class", "w2 svelte-1ps72wy");
    			add_location(th2, file$5, 16, 3, 259);
    			add_location(tr0, file$5, 13, 2, 206);
    			attr_dev(td0, "class", "f90 svelte-1ps72wy");
    			add_location(td0, file$5, 19, 3, 298);
    			attr_dev(input0, "class", "b0r svelte-1ps72wy");
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$5, 21, 6, 353);
    			attr_dev(td1, "class", "r svelte-1ps72wy");
    			add_location(td1, file$5, 20, 3, 331);
    			attr_dev(td2, "class", "f80 svelte-1ps72wy");
    			add_location(td2, file$5, 23, 3, 426);
    			add_location(tr1, file$5, 18, 2, 289);
    			attr_dev(td3, "class", "f90 svelte-1ps72wy");
    			add_location(td3, file$5, 26, 3, 490);
    			attr_dev(input1, "class", "b0r svelte-1ps72wy");
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$5, 28, 4, 543);
    			attr_dev(td4, "class", "r svelte-1ps72wy");
    			add_location(td4, file$5, 27, 3, 523);
    			attr_dev(td5, "class", "f80 svelte-1ps72wy");
    			add_location(td5, file$5, 30, 3, 616);
    			add_location(tr2, file$5, 25, 2, 481);
    			attr_dev(table, "class", "svelte-1ps72wy");
    			add_location(table, file$5, 12, 1, 195);
    			attr_dev(fieldset, "class", "svelte-1ps72wy");
    			add_location(fieldset, file$5, 7, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, legend);
    			append_dev(fieldset, t1);
    			mount_component(vibrato, fieldset, null);
    			append_dev(fieldset, t2);
    			append_dev(fieldset, table);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t3);
    			append_dev(tr0, th1);
    			append_dev(tr0, t4);
    			append_dev(tr0, th2);
    			append_dev(table, t5);
    			append_dev(table, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t7);
    			append_dev(tr1, td1);
    			append_dev(td1, t8);
    			append_dev(td1, input0);
    			set_input_value(input0, /*p*/ ctx[1].v_depth);
    			append_dev(tr1, t9);
    			append_dev(tr1, td2);
    			append_dev(table, t11);
    			append_dev(table, tr2);
    			append_dev(tr2, td3);
    			append_dev(tr2, t13);
    			append_dev(tr2, td4);
    			append_dev(td4, input1);
    			set_input_value(input1, /*p*/ ctx[1].v_speed);
    			append_dev(tr2, t14);
    			append_dev(tr2, td5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[2]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const vibrato_changes = {};
    			if (dirty & /*Param*/ 1) vibrato_changes.Param = /*Param*/ ctx[0];
    			vibrato.$set(vibrato_changes);

    			if (dirty & /*p*/ 2 && to_number(input0.value) !== /*p*/ ctx[1].v_depth) {
    				set_input_value(input0, /*p*/ ctx[1].v_depth);
    			}

    			if (dirty & /*p*/ 2 && to_number(input1.value) !== /*p*/ ctx[1].v_speed) {
    				set_input_value(input1, /*p*/ ctx[1].v_speed);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(vibrato.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(vibrato.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    			destroy_component(vibrato);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Vibrato', slots, []);
    	let { Param } = $$props;
    	let p = Param;
    	const writable_props = ['Param'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Vibrato> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		p.v_depth = to_number(this.value);
    		$$invalidate(1, p);
    	}

    	function input1_input_handler() {
    		p.v_speed = to_number(this.value);
    		$$invalidate(1, p);
    	}

    	$$self.$$set = $$props => {
    		if ('Param' in $$props) $$invalidate(0, Param = $$props.Param);
    	};

    	$$self.$capture_state = () => ({ Vibrato, Param, p });

    	$$self.$inject_state = $$props => {
    		if ('Param' in $$props) $$invalidate(0, Param = $$props.Param);
    		if ('p' in $$props) $$invalidate(1, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Param, p, input0_input_handler, input1_input_handler];
    }

    class Vibrato_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { Param: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Vibrato_1",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Param*/ ctx[0] === undefined && !('Param' in props)) {
    			console.warn("<Vibrato> was created without expected prop 'Param'");
    		}
    	}

    	get Param() {
    		throw new Error("<Vibrato>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Param(value) {
    		throw new Error("<Vibrato>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Tremolo.svelte generated by Svelte v3.50.1 */
    const file$4 = "src\\Components\\Tremolo.svelte";

    function create_fragment$4(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = `${/*p*/ ctx[0].t_name}`;
    			attr_dev(button, "class", "w svelte-1t7ig7m");
    			add_location(button, file$4, 48, 0, 1295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*Exec*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tremolo', slots, []);
    	let { Param } = $$props;
    	let p = Param;

    	function Exec() {
    		let context = new AudioContext();
    		const tm_zero = context.currentTime;

    		// Create the instance of OscillatorNode
    		let osc = context.createOscillator();

    		osc.type = "square";
    		osc.frequency.value = p.frequency;
    		osc.frequency.setValueAtTime(p.frequency, tm_zero);

    		// Set Amplitude
    		let amp = context.createGain();

    		amp.gain.value = calcVolume(p.volume);

    		// Set Depth          [vol][amp ± dep]
    		let dep = context.createGain();

    		dep.gain.value = 0;
    		dep.gain.setValueAtTime(calcVolume(p.t_depth), tm_zero + p.e_delay);
    		dep.gain.setValueAtTime(0, tm_zero + p.e_delay + p.e_gatetime);

    		// Set Speed          [Hz]
    		let lfo = context.createOscillator();

    		lfo.frequency.value = 0;
    		lfo.frequency.setValueAtTime(p.t_speed, tm_zero + p.e_delay);
    		lfo.frequency.setValueAtTime(0, tm_zero + p.e_delay + p.e_gatetime);

    		// Connection
    		amp.connect(context.destination);

    		osc.connect(amp);
    		dep.connect(amp.gain);
    		lfo.connect(dep);

    		// Start Sound & Effect
    		osc.start(tm_zero);

    		lfo.start(tm_zero);

    		// Stop Sound & Effect
    		osc.stop(tm_zero + p.gatetime);

    		lfo.stop(tm_zero + p.gatetime);
    	}

    	const writable_props = ['Param'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tremolo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Param' in $$props) $$invalidate(2, Param = $$props.Param);
    	};

    	$$self.$capture_state = () => ({ calcVolume, Param, p, Exec });

    	$$self.$inject_state = $$props => {
    		if ('Param' in $$props) $$invalidate(2, Param = $$props.Param);
    		if ('p' in $$props) $$invalidate(0, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [p, Exec, Param];
    }

    class Tremolo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { Param: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tremolo",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Param*/ ctx[2] === undefined && !('Param' in props)) {
    			console.warn("<Tremolo> was created without expected prop 'Param'");
    		}
    	}

    	get Param() {
    		throw new Error("<Tremolo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Param(value) {
    		throw new Error("<Tremolo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Parameters\Tremolo.svelte generated by Svelte v3.50.1 */
    const file$3 = "src\\Parameters\\Tremolo.svelte";

    function create_fragment$3(ctx) {
    	let fieldset;
    	let legend;
    	let t1;
    	let tremolo;
    	let t2;
    	let table;
    	let tr0;
    	let th0;
    	let t3;
    	let th1;
    	let t4;
    	let th2;
    	let t5;
    	let tr1;
    	let td0;
    	let t7;
    	let td1;
    	let t8;
    	let input0;
    	let t9;
    	let td2;
    	let t11;
    	let tr2;
    	let td3;
    	let t13;
    	let td4;
    	let input1;
    	let t14;
    	let td5;
    	let current;
    	let mounted;
    	let dispose;

    	tremolo = new Tremolo({
    			props: { Param: /*Param*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			legend = element("legend");
    			legend.textContent = "Tremolo Parameters";
    			t1 = space();
    			create_component(tremolo.$$.fragment);
    			t2 = space();
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			t3 = space();
    			th1 = element("th");
    			t4 = space();
    			th2 = element("th");
    			t5 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Depth";
    			t7 = space();
    			td1 = element("td");
    			t8 = text("± ");
    			input0 = element("input");
    			t9 = space();
    			td2 = element("td");
    			td2.textContent = "[Amplitude ± Depth]";
    			t11 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			td3.textContent = "Speed";
    			t13 = space();
    			td4 = element("td");
    			input1 = element("input");
    			t14 = space();
    			td5 = element("td");
    			td5.textContent = "[Hz]";
    			add_location(legend, file$3, 8, 1, 129);
    			attr_dev(th0, "class", "w1 svelte-1ps72wy");
    			add_location(th0, file$3, 14, 3, 215);
    			attr_dev(th1, "class", "w1 svelte-1ps72wy");
    			add_location(th1, file$3, 15, 3, 237);
    			attr_dev(th2, "class", "w2 svelte-1ps72wy");
    			add_location(th2, file$3, 16, 3, 259);
    			add_location(tr0, file$3, 13, 2, 206);
    			attr_dev(td0, "class", "f90 svelte-1ps72wy");
    			add_location(td0, file$3, 19, 3, 298);
    			attr_dev(input0, "class", "b0r svelte-1ps72wy");
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$3, 21, 6, 353);
    			attr_dev(td1, "class", "r svelte-1ps72wy");
    			add_location(td1, file$3, 20, 3, 331);
    			attr_dev(td2, "class", "f80 svelte-1ps72wy");
    			add_location(td2, file$3, 23, 3, 426);
    			add_location(tr1, file$3, 18, 2, 289);
    			attr_dev(td3, "class", "f90 svelte-1ps72wy");
    			add_location(td3, file$3, 26, 3, 490);
    			attr_dev(input1, "class", "b0r svelte-1ps72wy");
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$3, 28, 4, 543);
    			attr_dev(td4, "class", "r svelte-1ps72wy");
    			add_location(td4, file$3, 27, 3, 523);
    			attr_dev(td5, "class", "f80 svelte-1ps72wy");
    			add_location(td5, file$3, 30, 3, 616);
    			add_location(tr2, file$3, 25, 2, 481);
    			attr_dev(table, "class", "svelte-1ps72wy");
    			add_location(table, file$3, 12, 1, 195);
    			attr_dev(fieldset, "class", "svelte-1ps72wy");
    			add_location(fieldset, file$3, 7, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, legend);
    			append_dev(fieldset, t1);
    			mount_component(tremolo, fieldset, null);
    			append_dev(fieldset, t2);
    			append_dev(fieldset, table);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t3);
    			append_dev(tr0, th1);
    			append_dev(tr0, t4);
    			append_dev(tr0, th2);
    			append_dev(table, t5);
    			append_dev(table, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t7);
    			append_dev(tr1, td1);
    			append_dev(td1, t8);
    			append_dev(td1, input0);
    			set_input_value(input0, /*p*/ ctx[1].t_depth);
    			append_dev(tr1, t9);
    			append_dev(tr1, td2);
    			append_dev(table, t11);
    			append_dev(table, tr2);
    			append_dev(tr2, td3);
    			append_dev(tr2, t13);
    			append_dev(tr2, td4);
    			append_dev(td4, input1);
    			set_input_value(input1, /*p*/ ctx[1].t_speed);
    			append_dev(tr2, t14);
    			append_dev(tr2, td5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[2]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const tremolo_changes = {};
    			if (dirty & /*Param*/ 1) tremolo_changes.Param = /*Param*/ ctx[0];
    			tremolo.$set(tremolo_changes);

    			if (dirty & /*p*/ 2 && to_number(input0.value) !== /*p*/ ctx[1].t_depth) {
    				set_input_value(input0, /*p*/ ctx[1].t_depth);
    			}

    			if (dirty & /*p*/ 2 && to_number(input1.value) !== /*p*/ ctx[1].t_speed) {
    				set_input_value(input1, /*p*/ ctx[1].t_speed);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tremolo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tremolo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    			destroy_component(tremolo);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tremolo', slots, []);
    	let { Param } = $$props;
    	let p = Param;
    	const writable_props = ['Param'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tremolo> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		p.t_depth = to_number(this.value);
    		$$invalidate(1, p);
    	}

    	function input1_input_handler() {
    		p.t_speed = to_number(this.value);
    		$$invalidate(1, p);
    	}

    	$$self.$$set = $$props => {
    		if ('Param' in $$props) $$invalidate(0, Param = $$props.Param);
    	};

    	$$self.$capture_state = () => ({ Tremolo, Param, p });

    	$$self.$inject_state = $$props => {
    		if ('Param' in $$props) $$invalidate(0, Param = $$props.Param);
    		if ('p' in $$props) $$invalidate(1, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Param, p, input0_input_handler, input1_input_handler];
    }

    class Tremolo_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { Param: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tremolo_1",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Param*/ ctx[0] === undefined && !('Param' in props)) {
    			console.warn("<Tremolo> was created without expected prop 'Param'");
    		}
    	}

    	get Param() {
    		throw new Error("<Tremolo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Param(value) {
    		throw new Error("<Tremolo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\VibraTremolo.svelte generated by Svelte v3.50.1 */
    const file$2 = "src\\Components\\VibraTremolo.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = `${/*p*/ ctx[0].vt_name}`;
    			attr_dev(button, "class", "w svelte-1t7ig7m");
    			add_location(button, file$2, 64, 0, 1921);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*Exec*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VibraTremolo', slots, []);
    	let { Param } = $$props;
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

    	const writable_props = ['Param'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VibraTremolo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Param' in $$props) $$invalidate(2, Param = $$props.Param);
    	};

    	$$self.$capture_state = () => ({ calcVolume, Param, p, Exec });

    	$$self.$inject_state = $$props => {
    		if ('Param' in $$props) $$invalidate(2, Param = $$props.Param);
    		if ('p' in $$props) $$invalidate(0, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [p, Exec, Param];
    }

    class VibraTremolo$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { Param: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VibraTremolo",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Param*/ ctx[2] === undefined && !('Param' in props)) {
    			console.warn("<VibraTremolo> was created without expected prop 'Param'");
    		}
    	}

    	get Param() {
    		throw new Error("<VibraTremolo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Param(value) {
    		throw new Error("<VibraTremolo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Parameters\VibraTremolo.svelte generated by Svelte v3.50.1 */
    const file$1 = "src\\Parameters\\VibraTremolo.svelte";

    function create_fragment$1(ctx) {
    	let fieldset;
    	let legend;
    	let t1;
    	let vitr;
    	let current;

    	vitr = new VibraTremolo$1({
    			props: { Param: /*Param*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");
    			legend = element("legend");
    			legend.textContent = "Vibrato & Tremolo";
    			t1 = space();
    			create_component(vitr.$$.fragment);
    			add_location(legend, file$1, 6, 1, 112);
    			add_location(fieldset, file$1, 5, 0, 99);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, legend);
    			append_dev(fieldset, t1);
    			mount_component(vitr, fieldset, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const vitr_changes = {};
    			if (dirty & /*Param*/ 1) vitr_changes.Param = /*Param*/ ctx[0];
    			vitr.$set(vitr_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(vitr.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(vitr.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    			destroy_component(vitr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VibraTremolo', slots, []);
    	let { Param } = $$props;
    	const writable_props = ['Param'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VibraTremolo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Param' in $$props) $$invalidate(0, Param = $$props.Param);
    	};

    	$$self.$capture_state = () => ({ ViTr: VibraTremolo$1, Param });

    	$$self.$inject_state = $$props => {
    		if ('Param' in $$props) $$invalidate(0, Param = $$props.Param);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Param];
    }

    class VibraTremolo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { Param: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VibraTremolo",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Param*/ ctx[0] === undefined && !('Param' in props)) {
    			console.warn("<VibraTremolo> was created without expected prop 'Param'");
    		}
    	}

    	get Param() {
    		throw new Error("<VibraTremolo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Param(value) {
    		throw new Error("<VibraTremolo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.50.1 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let base;
    	let t0;
    	let br0;
    	let t1;
    	let vibr;
    	let t2;
    	let br1;
    	let t3;
    	let trml;
    	let t4;
    	let br2;
    	let t5;
    	let vitr;
    	let t6;
    	let br3;
    	let current;

    	base = new Base({
    			props: { Param: /*Param*/ ctx[0] },
    			$$inline: true
    		});

    	vibr = new Vibrato_1({
    			props: { Param: /*Param*/ ctx[0] },
    			$$inline: true
    		});

    	trml = new Tremolo_1({
    			props: { Param: /*Param*/ ctx[0] },
    			$$inline: true
    		});

    	vitr = new VibraTremolo({
    			props: { Param: /*Param*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(base.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			create_component(vibr.$$.fragment);
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			create_component(trml.$$.fragment);
    			t4 = space();
    			br2 = element("br");
    			t5 = space();
    			create_component(vitr.$$.fragment);
    			t6 = space();
    			br3 = element("br");
    			add_location(br0, file, 31, 0, 679);
    			add_location(br1, file, 34, 0, 707);
    			add_location(br2, file, 37, 0, 735);
    			add_location(br3, file, 40, 0, 763);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(base, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br0, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(vibr, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, br1, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(trml, target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, br2, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(vitr, target, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, br3, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const base_changes = {};
    			if (dirty & /*Param*/ 1) base_changes.Param = /*Param*/ ctx[0];
    			base.$set(base_changes);
    			const vibr_changes = {};
    			if (dirty & /*Param*/ 1) vibr_changes.Param = /*Param*/ ctx[0];
    			vibr.$set(vibr_changes);
    			const trml_changes = {};
    			if (dirty & /*Param*/ 1) trml_changes.Param = /*Param*/ ctx[0];
    			trml.$set(trml_changes);
    			const vitr_changes = {};
    			if (dirty & /*Param*/ 1) vitr_changes.Param = /*Param*/ ctx[0];
    			vitr.$set(vitr_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(base.$$.fragment, local);
    			transition_in(vibr.$$.fragment, local);
    			transition_in(trml.$$.fragment, local);
    			transition_in(vitr.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(base.$$.fragment, local);
    			transition_out(vibr.$$.fragment, local);
    			transition_out(trml.$$.fragment, local);
    			transition_out(vitr.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(base, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(t1);
    			destroy_component(vibr, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br1);
    			if (detaching) detach_dev(t3);
    			destroy_component(trml, detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(br2);
    			if (detaching) detach_dev(t5);
    			destroy_component(vitr, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(br3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let { Param = {
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
    		vt_name: ""
    	} } = $$props;

    	const writable_props = ['Param'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('Param' in $$props) $$invalidate(0, Param = $$props.Param);
    	};

    	$$self.$capture_state = () => ({ Base, Vibr: Vibrato_1, Trml: Tremolo_1, ViTr: VibraTremolo, Param });

    	$$self.$inject_state = $$props => {
    		if ('Param' in $$props) $$invalidate(0, Param = $$props.Param);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [Param];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { Param: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get Param() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Param(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

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

    return app;

})();
//# sourceMappingURL=bundle.js.map
