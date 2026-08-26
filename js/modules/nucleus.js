/**
 * NÚCLEO — instrumento do hero.
 *
 * Anéis concêntricos de pontos girando em velocidades diferentes, com um feixe
 * de varredura que atravessa o campo e um campo de força no ponteiro. Canvas 2D
 * puro: uma passada de fillRect por quadro, sem alocação dentro do loop.
 *
 * Desliga sozinho fora da viewport, com a aba oculta ou sob prefers-reduced-motion.
 */

import { clamp, lerp, observePresence, reducedMotion } from '../core/dom.js';
import { addTask, coalesce } from '../core/ticker.js';

const RING_COUNT_DESKTOP = 15;
const RING_COUNT_MOBILE = 9;
const POINTER_RADIUS = 190;
const POINTER_PUSH = 30;

export function initNucleus(canvas) {
  if (!canvas || reducedMotion()) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    centreX: 0,
    centreY: 0,
    radius: 0,
    scan: 0,
    breathe: 0,
    // Ponteiro em coordenadas de CSS pixels, e sua versão suavizada.
    pointerX: -9999,
    pointerY: -9999,
    smoothX: -9999,
    smoothY: -9999,
    driftX: 0,
    driftY: 0,
    targetDriftX: 0,
    targetDriftY: 0,
    active: false,
  };

  /** @type {{angle:number, radius:number, speed:number, size:number, base:number}[]} */
  let points = [];

  function build() {
    const isNarrow = state.width < 760;
    const rings = isNarrow ? RING_COUNT_MOBILE : RING_COUNT_DESKTOP;
    const inner = state.radius * 0.14;
    const step = (state.radius - inner) / rings;

    points = [];

    for (let ring = 0; ring < rings; ring += 1) {
      const radius = inner + step * ring;
      const count = Math.round(6 + ring * (isNarrow ? 2.2 : 3.1));
      const direction = ring % 2 === 0 ? 1 : -1;
      const speed = direction * (0.000055 + (rings - ring) * 0.0000135);

      for (let i = 0; i < count; i += 1) {
        points.push({
          angle: (Math.PI * 2 * i) / count + ring * 0.22,
          radius,
          speed,
          size: ring < 2 ? 2.4 : 1.7,
          base: 0.14 + (1 - ring / rings) * 0.3,
        });
      }
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = rect.width;
    state.height = rect.height;

    canvas.width = Math.round(rect.width * state.dpr);
    canvas.height = Math.round(rect.height * state.dpr);
    context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    const isNarrow = rect.width < 760;
    // No desktop o núcleo ocupa o quadrante superior direito, que a tipografia
    // deixa livre; no mobile ele sobe para o topo, acima do título.
    state.centreX = isNarrow ? rect.width * 0.5 : rect.width * 0.73;
    state.centreY = isNarrow ? rect.height * 0.3 : rect.height * 0.38;
    state.radius = Math.min(rect.width, rect.height) * (isNarrow ? 0.46 : 0.56);

    build();
  }

  function draw(delta) {
    const { width, height } = state;
    context.clearRect(0, 0, width, height);

    state.scan += delta * 0.00035;
    state.breathe += delta * 0.0006;

    state.smoothX = lerp(state.smoothX, state.pointerX, 0.12);
    state.smoothY = lerp(state.smoothY, state.pointerY, 0.12);
    state.driftX = lerp(state.driftX, state.targetDriftX, 0.05);
    state.driftY = lerp(state.driftY, state.targetDriftY, 0.05);

    const cx = state.centreX + state.driftX;
    const cy = state.centreY + state.driftY;
    const pulse = 1 + Math.sin(state.breathe) * 0.014;
    const scanAngle = state.scan % (Math.PI * 2);

    drawStructure(cx, cy, pulse);

    for (const point of points) {
      point.angle += point.speed * delta;

      let x = cx + Math.cos(point.angle) * point.radius * pulse;
      let y = cy + Math.sin(point.angle) * point.radius * pulse;

      let alpha = point.base;
      let size = point.size;

      // Realce pela varredura: distância angular até o feixe.
      let angular = Math.abs(((point.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - scanAngle);
      if (angular > Math.PI) angular = Math.PI * 2 - angular;
      if (angular < 0.5) {
        const beam = 1 - angular / 0.5;
        alpha += beam * 0.5;
        size += beam * 0.7;
      }

      // Campo de força do ponteiro.
      const dx = x - state.smoothX;
      const dy = y - state.smoothY;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq < POINTER_RADIUS * POINTER_RADIUS) {
        const distance = Math.sqrt(distanceSq) || 1;
        const force = 1 - distance / POINTER_RADIUS;
        const push = force * force * POINTER_PUSH;
        x += (dx / distance) * push;
        y += (dy / distance) * push;
        alpha += force * 0.55;
        size += force * 1.1;
      }

      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;

      alpha = clamp(alpha, 0, 0.95);
      context.fillStyle = alpha > 0.42
        ? `rgba(0, 229, 199, ${alpha})`
        : `rgba(237, 238, 234, ${alpha})`;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }

  function drawStructure(cx, cy, pulse) {
    context.save();
    context.lineWidth = 1;

    // Dois anéis de referência.
    context.strokeStyle = 'rgba(237, 238, 234, 0.12)';
    for (const factor of [0.42, 1]) {
      context.beginPath();
      context.arc(cx, cy, state.radius * factor * pulse, 0, Math.PI * 2);
      context.stroke();
    }

    // Retículo.
    const reach = state.radius * 1.12;
    context.strokeStyle = 'rgba(237, 238, 234, 0.085)';
    context.beginPath();
    context.moveTo(cx - reach, cy);
    context.lineTo(cx + reach, cy);
    context.moveTo(cx, cy - reach);
    context.lineTo(cx, cy + reach);
    context.stroke();

    // Feixe de varredura.
    const scanAngle = state.scan % (Math.PI * 2);
    const gradient = context.createLinearGradient(
      cx, cy,
      cx + Math.cos(scanAngle) * state.radius,
      cy + Math.sin(scanAngle) * state.radius
    );
    gradient.addColorStop(0, 'rgba(0, 229, 199, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 229, 199, 0)');
    context.strokeStyle = gradient;
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + Math.cos(scanAngle) * state.radius, cy + Math.sin(scanAngle) * state.radius);
    context.stroke();

    // Massa central.
    const core = context.createRadialGradient(cx, cy, 0, cx, cy, state.radius * 0.3);
    core.addColorStop(0, 'rgba(0, 229, 199, 0.16)');
    core.addColorStop(1, 'rgba(0, 229, 199, 0)');
    context.fillStyle = core;
    context.beginPath();
    context.arc(cx, cy, state.radius * 0.3, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  // — Ciclo de vida —

  let release = null;

  function play() {
    if (release) return;
    release = addTask(draw);
  }

  function pause() {
    if (!release) return;
    release();
    release = null;
  }

  resize();
  canvas.classList.add('is-ready');
  play();

  window.addEventListener('resize', coalesce(resize), { passive: true });

  window.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    state.pointerX = event.clientX - rect.left;
    state.pointerY = event.clientY - rect.top;

    // Paralaxe do conjunto: no máximo alguns pixels, quase subliminar.
    state.targetDriftX = (event.clientX / window.innerWidth - 0.5) * -26;
    state.targetDriftY = (event.clientY / window.innerHeight - 0.5) * -18;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    state.pointerX = -9999;
    state.pointerY = -9999;
  }, { passive: true });

  observePresence(canvas, (visible) => (visible ? play() : pause()));
}
