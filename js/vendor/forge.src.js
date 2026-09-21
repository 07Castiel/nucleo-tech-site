// Núcleo Tech — abertura 3D ("forge"). Fase que roda antes do intro leve
// existente (js/modules/intro.js): as letras caem, assentam, e então a cena
// se apaga enquanto a marca "N•" + contador (o intro original) aparece no
// lugar — como se uma virasse a outra.
//
// Único arquivo do site que usa uma dependência de terceiro (three.js), por
// isso vive isolado em js/vendor/ e é carregado via dynamic import, nunca no
// caminho crítico. Rebuild do bundle:
//   npx esbuild js/vendor/forge.src.js --bundle --minify --format=esm --outfile=js/vendor/forge.bundle.js
import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	Group,
	Mesh,
	MeshStandardMaterial,
	ShadowMaterial,
	MeshBasicMaterial,
	PlaneGeometry,
	ExtrudeGeometry,
	ShapePath,
	DirectionalLight,
	AmbientLight,
	Color,
	CanvasTexture,
	SRGBColorSpace,
	PCFSoftShadowMap,
	MathUtils,
	DoubleSide,
} from 'three';

export const FORGE_TEXT = 'NÚCLEO TECH';

const GRAPHITE = '#22262C'; // --ink-3 (#1C2026) levemente clareado p/ legibilidade fosca
const SIGNAL = '#00E5C7'; // --signal
const LINE = '#EDEEEA'; // --paper, opacidade controlada separadamente (== --line-2)

const [WORD_A, WORD_B] = FORGE_TEXT.split(' ');
const WORD_NUCLEO = { chars: Array.from(WORD_A), color: GRAPHITE };
const WORD_TECH = { chars: Array.from(WORD_B), color: GRAPHITE };

// Timeline (ms). Fase curta de propósito: esta é só o prelúdio antes do
// intro leve assumir (que por sua vez tem teto de 1500ms próprio).
const T = {
	BG: 150,
	STAGGER: 50,
	FALL: 460,
	SQUASH: 65,
	BOUNCE: 250,
	MICRO: 110,
	PAUSE: 200,
	EXIT: 380,
	SKIP_EXIT: 160,
};

const DROP_HEIGHT = 3.2;
const HOP_FRAC = 0.15;
const MICRO_FRAC = 0.04;

function easeInQuad(p) {
	return p * p;
}
function easeOutQuad(p) {
	return 1 - (1 - p) * (1 - p);
}
function clamp01(v) {
	return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Reimplementação mínima do FontLoader/TextGeometry (examples/jsm) do
// three.js — evita vendorizar os módulos jsm extra. Formato typeface.json:
// outline 'q'/'b' vêm como [end.x end.y ctrl(s).x ctrl(s).y ...].
function glyphToShapes(glyphData, size, resolution) {
	const scale = size / resolution;
	const path = new ShapePath();
	const outline = glyphData.o.split(' ');
	let i = 0;
	while (i < outline.length) {
		const action = outline[i++];
		switch (action) {
			case 'm':
				path.moveTo(+outline[i++] * scale, +outline[i++] * scale);
				break;
			case 'l':
				path.lineTo(+outline[i++] * scale, +outline[i++] * scale);
				break;
			case 'q': {
				const x = +outline[i++] * scale, y = +outline[i++] * scale;
				const cx = +outline[i++] * scale, cy = +outline[i++] * scale;
				path.quadraticCurveTo(cx, cy, x, y);
				break;
			}
			case 'b': {
				const x = +outline[i++] * scale, y = +outline[i++] * scale;
				const c1x = +outline[i++] * scale, c1y = +outline[i++] * scale;
				const c2x = +outline[i++] * scale, c2y = +outline[i++] * scale;
				path.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
				break;
			}
			case 'z':
				break;
		}
	}
	return path.toShapes();
}

function buildLetterGeometry(fontData, char, size, curveSegments) {
	const glyph = fontData.glyphs[char];
	const shapes = glyphToShapes(glyph, size, fontData.resolution);
	const capHeight = (fontData.boundingBox.yMax - fontData.boundingBox.yMin) * (size / fontData.resolution);
	const depth = capHeight * 0.22;
	const bevelThickness = capHeight * 0.02;
	const bevelSize = capHeight * 0.015;

	const geometry = new ExtrudeGeometry(shapes, {
		depth,
		bevelEnabled: true,
		bevelThickness,
		bevelSize,
		bevelSegments: 2,
		curveSegments,
	});

	const xMin = glyph.x_min * (size / fontData.resolution);
	const xMax = glyph.x_max * (size / fontData.resolution);
	const xMid = (xMin + xMax) / 2;
	geometry.translate(-xMid, 0, -depth / 2);

	return { geometry, advance: glyph.ha * (size / fontData.resolution), xMin: xMin - xMid, xMax: xMax - xMid, height: capHeight, depth };
}

function makeContactShadowTexture() {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const ctx = c.getContext('2d');
	const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
	g.addColorStop(0, 'rgba(0,0,0,0.55)');
	g.addColorStop(1, 'rgba(0,0,0,0)');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, 128, 128);
	return new CanvasTexture(c);
}

function buildRow(fontData, words, geometryCache, shadowTex, curveSegments) {
	const rowGroup = new Group();
	const letters = [];
	let cursor = 0;
	const chars = [];
	words.forEach((word, wi) => {
		word.chars.forEach((ch) => chars.push({ ch, color: word.color }));
		if (wi < words.length - 1) chars.push({ ch: null, color: null });
	});

	const materials = new Map();
	function materialFor(color) {
		if (!materials.has(color)) {
			materials.set(color, new MeshStandardMaterial({ color: new Color(color), roughness: 0.62, metalness: 0.15 }));
		}
		return materials.get(color);
	}

	let minX = Infinity, maxX = -Infinity;
	let stepIndex = 0;

	for (const { ch, color } of chars) {
		if (ch === null) {
			cursor += 0.45;
			stepIndex++;
			continue;
		}

		let entry = geometryCache.get(ch);
		if (!entry) {
			entry = buildLetterGeometry(fontData, ch, 1, curveSegments);
			geometryCache.set(ch, entry);
		}

		const pivot = new Group();
		const mesh = new Mesh(entry.geometry, materialFor(color));
		mesh.castShadow = true;
		pivot.add(mesh);

		const blobMat = new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0, depthWrite: false });
		const blobSize = entry.height * 1.6;
		const blob = new Mesh(new PlaneGeometry(blobSize, blobSize), blobMat);
		blob.rotation.x = -Math.PI / 2;
		blob.position.set(cursor, 0.002, 0);
		rowGroup.add(blob);

		pivot.position.set(cursor, 0, 0);
		rowGroup.add(pivot);

		const rotX = MathUtils.degToRad((Math.random() * 2 - 1) * 10);
		const rotZ = MathUtils.degToRad((Math.random() * 2 - 1) * 10);

		letters.push({ pivot, mesh, blob, blobMat, startDelay: 0, localStep: stepIndex, rotX, rotZ, height: entry.height });

		minX = Math.min(minX, cursor + entry.xMin);
		maxX = Math.max(maxX, cursor + entry.xMax);
		cursor += entry.advance;
		stepIndex++;
	}

	const mid = (minX + maxX) / 2;
	for (const l of letters) {
		l.pivot.position.x -= mid;
		l.blob.position.x -= mid;
	}

	return { rowGroup, letters, naturalWidth: maxX - minX, stepsUsed: stepIndex };
}

function scheduleStagger(rows) {
	let offset = 0;
	for (const row of rows) {
		for (const l of row.letters) l.startDelay = T.BG + (offset + l.localStep) * T.STAGGER;
		offset += row.stepsUsed;
	}
	return offset;
}

export function runForge({ container, canvas, fontData, isMobile, onDone }) {
	const scene = new Scene();
	const width = window.innerWidth;
	const height = window.innerHeight;

	const camera = new PerspectiveCamera(34, width / height, 0.1, 100);
	const camDist = 6.2;
	const tiltRad = MathUtils.degToRad(10);
	camera.position.set(0, Math.tan(tiltRad) * camDist, camDist);
	camera.lookAt(0, 0, 0);

	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.setSize(width, height);
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;

	const key = new DirectionalLight(0xfff4e6, 2.2);
	key.position.set(2, 6, 5);
	key.castShadow = true;
	const shadowRes = isMobile ? 512 : 1024;
	key.shadow.mapSize.set(shadowRes, shadowRes);
	key.shadow.camera.near = 1;
	key.shadow.camera.far = 20;
	key.shadow.camera.left = -6;
	key.shadow.camera.right = 6;
	key.shadow.camera.top = 6;
	key.shadow.camera.bottom = -6;
	key.shadow.bias = -0.002;
	scene.add(key);

	const rim = new DirectionalLight(new Color(SIGNAL), 1.4);
	rim.position.set(-4, 1.5, -4);
	scene.add(rim);

	const fill = new DirectionalLight(new Color(SIGNAL), 0.35);
	fill.position.set(3, 1, -3);
	scene.add(fill);

	const ambient = new AmbientLight(0x30343c, 0.85);
	scene.add(ambient);

	const curveSegments = isMobile ? 4 : 8;
	const geometryCache = new Map();
	const shadowTex = makeContactShadowTexture();

	function addFloor(rowGroup, worldWidth) {
		const floorGeo = new PlaneGeometry(worldWidth * 2.4, 6);
		const floor = new Mesh(floorGeo, new ShadowMaterial({ opacity: 0.5 }));
		floor.rotation.x = -Math.PI / 2;
		floor.receiveShadow = true;
		rowGroup.add(floor);

		const lineGeo = new PlaneGeometry(worldWidth * 1.3, 0.012);
		const lineMat = new MeshBasicMaterial({ color: new Color(LINE), transparent: true, opacity: 0.16, side: DoubleSide });
		const line = new Mesh(lineGeo, lineMat);
		line.rotation.x = -Math.PI / 2;
		line.position.y = 0.001;
		rowGroup.add(line);
	}

	const rowGroups = [];
	let usedSteps = 0;

	if (isMobile) {
		const row1 = buildRow(fontData, [WORD_NUCLEO], geometryCache, shadowTex, curveSegments);
		const row2 = buildRow(fontData, [WORD_TECH], geometryCache, shadowTex, curveSegments);

		const visibleWidthAt = (dist) => 2 * dist * Math.tan(MathUtils.degToRad(camera.fov) / 2) * camera.aspect;
		const targetWidth = visibleWidthAt(camDist) * 0.8;
		const scaleFactor = targetWidth / row1.naturalWidth;

		row1.rowGroup.scale.setScalar(scaleFactor);
		row2.rowGroup.scale.setScalar(scaleFactor);

		const gap = row1.letters[0].height * scaleFactor * 2.6;
		row1.rowGroup.position.y = gap / 2;
		row2.rowGroup.position.y = -gap / 2;

		addFloor(row1.rowGroup, row1.naturalWidth);
		addFloor(row2.rowGroup, row2.naturalWidth);

		scene.add(row1.rowGroup, row2.rowGroup);
		rowGroups.push(row1, row2);
	} else {
		const row = buildRow(fontData, [WORD_NUCLEO, WORD_TECH], geometryCache, shadowTex, curveSegments);

		const visibleWidthAt = (dist) => 2 * dist * Math.tan(MathUtils.degToRad(camera.fov) / 2) * camera.aspect;
		const targetWidth = visibleWidthAt(camDist) * 0.75;
		const scaleFactor = targetWidth / row.naturalWidth;

		row.rowGroup.scale.setScalar(scaleFactor);
		addFloor(row.rowGroup, row.naturalWidth);

		scene.add(row.rowGroup);
		rowGroups.push(row);
	}

	usedSteps = scheduleStagger(rowGroups);

	for (const group of rowGroups) {
		for (const l of group.letters) {
			l.pivot.position.y = DROP_HEIGHT;
			l.pivot.rotation.x = l.rotX;
			l.pivot.rotation.z = l.rotZ;
		}
	}

	const lastStart = T.BG + (usedSteps - 1) * T.STAGGER;
	const allSettledAt = lastStart + T.FALL + T.SQUASH + T.BOUNCE + T.MICRO;
	const pauseEndsAt = allSettledAt + T.PAUSE;

	let rafId = null;
	let skipped = false;
	let finished = false;

	function updateLetter(l, elapsed) {
		const t0 = l.startDelay;
		let y, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0;

		if (elapsed < t0) {
			y = DROP_HEIGHT;
			rx = l.rotX;
			rz = l.rotZ;
		} else if (elapsed < t0 + T.FALL) {
			const p = (elapsed - t0) / T.FALL;
			y = DROP_HEIGHT * (1 - easeInQuad(p));
			const rp = easeOutQuad(p);
			rx = l.rotX * (1 - rp);
			rz = l.rotZ * (1 - rp);
		} else if (elapsed < t0 + T.FALL + T.SQUASH) {
			const p = (elapsed - t0 - T.FALL) / T.SQUASH;
			y = 0;
			sy = 1 + (0.82 - 1) * easeOutQuad(p);
			sx = 1 + (1.12 - 1) * easeOutQuad(p);
		} else if (elapsed < t0 + T.FALL + T.SQUASH + T.BOUNCE) {
			const p = (elapsed - t0 - T.FALL - T.SQUASH) / T.BOUNCE;
			y = l.height * HOP_FRAC * Math.sin(Math.PI * p);
			sy = p < 0.5 ? 0.82 + (1.06 - 0.82) * (p / 0.5) : 1.06 + (1 - 1.06) * ((p - 0.5) / 0.5);
			sx = p < 0.5 ? 1.12 + (1 - 1.12) * (p / 0.5) : 1;
		} else if (elapsed < t0 + T.FALL + T.SQUASH + T.BOUNCE + T.MICRO) {
			const p = (elapsed - t0 - T.FALL - T.SQUASH - T.BOUNCE) / T.MICRO;
			y = l.height * MICRO_FRAC * Math.sin(Math.PI * p);
		} else {
			y = 0;
		}

		l.pivot.position.y = y;
		l.pivot.rotation.x = rx;
		l.pivot.rotation.z = rz;
		l.pivot.scale.set(sx, sy, sz);

		const heightFrac = clamp01(y / DROP_HEIGHT);
		l.blobMat.opacity = 0.55 * (1 - heightFrac);
		const s = 1 - 0.5 * heightFrac;
		l.blob.scale.set(s, s, s);
	}

	const rimBase = rim.intensity;
	const start = performance.now();

	function frame(now) {
		const elapsed = now - start;

		for (const group of rowGroups) {
			for (const l of group.letters) updateLetter(l, elapsed);
		}

		if (elapsed >= allSettledAt && elapsed < pauseEndsAt) {
			const p = (elapsed - allSettledAt) / T.PAUSE;
			rim.intensity = rimBase * (1 + 0.25 * Math.sin(Math.PI * clamp01(p)));
		} else {
			rim.intensity = rimBase;
		}

		renderer.render(scene, camera);

		if (!skipped && elapsed >= pauseEndsAt) {
			beginExit(false);
			return;
		}

		rafId = requestAnimationFrame(frame);
	}

	function disposeAll() {
		rowGroups.forEach((g) => {
			g.rowGroup.traverse((obj) => {
				if (obj.geometry) obj.geometry.dispose();
				if (obj.material) {
					if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
					else obj.material.dispose();
				}
			});
		});
		geometryCache.forEach((entry) => entry.geometry.dispose());
		shadowTex.dispose();
		renderer.dispose();
	}

	function beginExit(fast) {
		if (finished) return;
		if (rafId) cancelAnimationFrame(rafId);

		const dur = fast ? T.SKIP_EXIT : T.EXIT;
		container.style.setProperty('--forge-exit-duration', dur + 'ms');
		container.classList.add('is-forged');

		if (!fast) {
			const dollyStart = performance.now();
			function dollyFrame(now) {
				const p = clamp01((now - dollyStart) / dur);
				camera.position.z = camDist - 0.5 * p;
				renderer.render(scene, camera);
				if (p < 1) requestAnimationFrame(dollyFrame);
			}
			requestAnimationFrame(dollyFrame);
		}

		setTimeout(() => {
			finished = true;
			disposeAll();
			onDone();
		}, dur + 30);
	}

	function handleSkip() {
		if (skipped || finished) return;
		skipped = true;
		beginExit(true);
	}

	rafId = requestAnimationFrame(frame);

	return { skip: handleSkip };
}
