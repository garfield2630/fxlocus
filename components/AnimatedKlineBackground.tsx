"use client";

import { useEffect, useRef } from "react";

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#02010a";
  ctx.fillRect(0, 0, w, h);

  // main blue glow around the logo area (center-right)
  const glow = ctx.createRadialGradient(w * 0.6, h * 0.4, 0, w * 0.6, h * 0.4, h * 0.7);
  glow.addColorStop(0, "rgba(37, 99, 235, 0.85)");
  glow.addColorStop(0.5, "rgba(37, 99, 235, 0.35)");
  glow.addColorStop(1, "rgba(15, 23, 42, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

interface Node {
  x: number;
  y: number;
  radius: number;
  phase: number;
}

function drawNeural(ctx: CanvasRenderingContext2D, nodes: Node[], t: number, w: number, h: number) {
  ctx.lineWidth = 1.1;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = w * 0.2;
      if (dist < maxDist) {
        const alpha = 0.32 - (dist / maxDist) * 0.32;
        ctx.strokeStyle = `rgba(125, 211, 252, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const n of nodes) {
    const pulse = 0.4 + 0.3 * Math.sin(t * 2 + n.phase);
    const r = n.radius * (0.7 + pulse);
    const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
    gradient.addColorStop(0, "rgba(59,130,246,0.95)");
    gradient.addColorStop(0.5, "rgba(59,130,246,0.4)");
    gradient.addColorStop(1, "rgba(59,130,246,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function AnimatedKlineBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<Node[] | null>(null);

  useEffect(() => {
    function resize() {
      const canvasEl = canvasRef.current;
      if (!canvasEl || typeof window === "undefined") return;

      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;

      const rect = canvasEl.parentElement?.getBoundingClientRect();
      const width = rect?.width ?? window.innerWidth;
      const height = rect?.height ?? 420;
      const dpr = window.devicePixelRatio || 1;
      canvasEl.width = width * dpr;
      canvasEl.height = height * dpr;
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const nodes: Node[] = [];
      const count = 40;
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: width * (0.08 + Math.random() * 0.84),
          y: height * (0.05 + Math.random() * 0.9),
          radius: 10 + Math.random() * 10,
          phase: Math.random() * Math.PI * 2
        });
      }
      nodesRef.current = nodes;
    }

    let frameId: number;
    let start = performance.now();

    const canvasElInitial = canvasRef.current;
    if (!canvasElInitial || typeof window === "undefined") return;
    const ctx = canvasElInitial.getContext("2d");
    if (!ctx) return;

    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      const t = (now - start) / 1000;
      const canvasEl = canvasRef.current;
      if (!canvasEl) {
        frameId = requestAnimationFrame(render);
        return;
      }

      const w = canvasEl.clientWidth;
      const h = canvasEl.clientHeight;
      if (w === 0 || h === 0) {
        frameId = requestAnimationFrame(render);
        return;
      }

      drawBackground(ctx, w, h);

      const nodes = nodesRef.current;
      if (nodes) {
        nodes.forEach((n, idx) => {
          n.x += Math.sin(t * 0.2 + idx) * 0.08;
          n.y += Math.cos(t * 0.18 + idx * 1.3) * 0.08;
        });
        drawNeural(ctx, nodes, t, w, h);
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
