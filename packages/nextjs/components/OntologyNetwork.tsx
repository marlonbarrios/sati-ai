"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { ONTOLOGY_GROUPS, PALI_ONTOLOGY, ontologyById } from "@/lib/ontology";

const P5Sketch = dynamic(() => import("react-p5"), { ssr: false });

type SimNode = {
  id: string;
  pali: string;
  gloss: string;
  group: string;
  degree: number;
  mass: number;
  phase: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type SimEdge = { a: number; b: number };

type Graph = {
  nodes: SimNode[];
  edges: SimEdge[];
  hover: number;
  drag: number;
};

function buildGraph(width: number, height: number): Graph {
  const index = new Map(PALI_ONTOLOGY.map((entry, i) => [entry.id, i]));
  const edgeKeys = new Set<string>();
  const edges: SimEdge[] = [];

  PALI_ONTOLOGY.forEach((entry, i) => {
    for (const target of entry.see ?? []) {
      const j = index.get(target);
      if (j === undefined || j === i) continue;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ a: Math.min(i, j), b: Math.max(i, j) });
    }
  });

  const degree = PALI_ONTOLOGY.map(() => 0);
  for (const edge of edges) {
    degree[edge.a] += 1;
    degree[edge.b] += 1;
  }

  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.4;
  const ry = height * 0.36;
  const nodes: SimNode[] = PALI_ONTOLOGY.map((entry, i) => {
    const groupIndex = Math.max(0, ONTOLOGY_GROUPS.indexOf(entry.group));
    const members = PALI_ONTOLOGY.filter(item => item.group === entry.group);
    const memberIndex = members.findIndex(item => item.id === entry.id);
    const angle = (groupIndex / ONTOLOGY_GROUPS.length) * Math.PI * 2 + (memberIndex - members.length / 2) * 0.11;
    const links = degree[i];
    return {
      id: entry.id,
      pali: entry.pali,
      gloss: entry.gloss,
      group: entry.group,
      degree: links,
      mass: 1 + links * 0.45,
      phase: i * 0.73,
      x: cx + Math.cos(angle) * rx * (0.78 + (i % 4) * 0.07),
      y: cy + Math.sin(angle) * ry * (0.78 + (i % 4) * 0.07),
      vx: 0,
      vy: 0,
    };
  });

  const graph = { nodes, edges, hover: -1, drag: -1 };
  for (let i = 0; i < 240; i += 1) step(graph, width, height, i / 60);
  return graph;
}

function diameter(node: SimNode) {
  return 4.5 + Math.min(node.degree, 14) * 1.45;
}

function canvasPalette() {
  const dark = document.documentElement.getAttribute("data-theme") === "satiDark";
  return dark
    ? { r: 249, g: 251, b: 255, paper: [33, 38, 56] as const }
    : { r: 33, g: 38, b: 56, paper: [244, 248, 255] as const };
}

function step(graph: Graph, width: number, height: number, seconds: number) {
  const { nodes, edges } = graph;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const reach = (diameter(a) + diameter(b)) * 0.5 + Math.min(width, height) * 0.34;
      const force = (reach * 2.4) / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx -= fx / a.mass;
      a.vy -= fy / a.mass;
      b.vx += fx / b.mass;
      b.vy += fy / b.mass;
    }
  }

  for (const edge of edges) {
    const a = nodes[edge.a];
    const b = nodes[edge.b];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 0.01;
    const rest = Math.max(width * 0.16, height * 0.38) + diameter(a) + diameter(b);
    const force = (dist - rest) * 0.02;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx / a.mass;
    a.vy += fy / a.mass;
    b.vx -= fx / b.mass;
    b.vy -= fy / b.mass;
  }

  const cx = width / 2;
  const cy = height / 2;
  for (const node of nodes) {
    node.vx += ((cx - node.x) * 0.0014) / node.mass;
    node.vy += ((cy - node.y) * 0.0014) / node.mass;
    node.vx += Math.sin(seconds * 0.45 + node.phase) * 0.016;
    node.vy += Math.cos(seconds * 0.37 + node.phase * 1.3) * 0.016;

    const pad = 16 + diameter(node) / 2;
    if (node.x < pad) node.vx += (pad - node.x) * 0.14;
    if (node.x > width - pad) node.vx -= (node.x - (width - pad)) * 0.14;
    if (node.y < pad) node.vy += (pad - node.y) * 0.14;
    if (node.y > height - pad) node.vy -= (node.y - (height - pad)) * 0.14;

    node.vx *= 0.92;
    node.vy *= 0.92;
    const speed = Math.hypot(node.vx, node.vy);
    const maxSpeed = 1.05 / Math.sqrt(node.mass);
    if (speed > maxSpeed) {
      node.vx = (node.vx / speed) * maxSpeed;
      node.vy = (node.vy / speed) * maxSpeed;
    }
    const held = (graph.drag >= 0 && nodes[graph.drag] === node) || (graph.hover >= 0 && nodes[graph.hover] === node);
    if (held) {
      node.vx = 0;
      node.vy = 0;
    } else {
      node.x += node.vx;
      node.y += node.vy;
    }
  }
}

function nodeAt(graph: Graph, x: number, y: number) {
  const order = graph.nodes
    .map((node, index) => ({ index, degree: node.degree }))
    .sort((a, b) => b.degree - a.degree);
  for (const item of order) {
    const node = graph.nodes[item.index];
    if (Math.hypot(node.x - x, node.y - y) <= diameter(node) / 2 + 4) return item.index;
  }
  return -1;
}

export function OntologyNetwork() {
  const holder = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const graph = useRef<Graph | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? ontologyById(selectedId) : undefined;
  const { isDark } = useTheme();

  return (
    <div ref={holder} className={`relative min-h-0 w-full flex-1 overflow-hidden ${isDark ? "bg-[#212638]" : "bg-[#f4f8ff]"}`}>
      <P5Sketch
        setup={(p5, canvasParentRef) => {
          const parent = holder.current;
          const width = parent?.clientWidth || p5.windowWidth;
          const height = parent?.clientHeight || Math.max(320, p5.windowHeight - 160);
          p5.createCanvas(width, height).parent(canvasParentRef);
          p5.textFont("Georgia");
          graph.current = buildGraph(width, height);
        }}
        draw={p5 => {
          const parent = holder.current;
          if (
            parent &&
            parent.clientWidth > 10 &&
            parent.clientHeight > 10 &&
            (Math.abs(parent.clientWidth - p5.width) > 2 || Math.abs(parent.clientHeight - p5.height) > 2)
          ) {
            p5.resizeCanvas(parent.clientWidth, parent.clientHeight);
            graph.current = buildGraph(parent.clientWidth, parent.clientHeight);
          }
          const current = graph.current;
          if (!current) return;
          step(current, p5.width, p5.height, p5.millis() / 1000);
          const ink = canvasPalette();
          p5.background(ink.paper[0], ink.paper[1], ink.paper[2]);

          const hover = current.hover;
          const neighbors = new Set<number>();
          if (hover >= 0) {
            for (const edge of current.edges) {
              if (edge.a === hover) neighbors.add(edge.b);
              if (edge.b === hover) neighbors.add(edge.a);
            }
          }

          for (const edge of current.edges) {
            const linked = hover >= 0 && (edge.a === hover || edge.b === hover);
            if (linked) continue;
            p5.stroke(ink.r, ink.g, ink.b, hover >= 0 ? 70 : 105);
            p5.strokeWeight(0.55);
            p5.line(current.nodes[edge.a].x, current.nodes[edge.a].y, current.nodes[edge.b].x, current.nodes[edge.b].y);
          }

          if (hover >= 0) {
            p5.stroke(ink.r, ink.g, ink.b, 235);
            p5.strokeWeight(1.75);
            for (const edge of current.edges) {
              if (edge.a !== hover && edge.b !== hover) continue;
              p5.line(current.nodes[edge.a].x, current.nodes[edge.a].y, current.nodes[edge.b].x, current.nodes[edge.b].y);
            }
          }

          const order = current.nodes
            .map((node, index) => ({ node, index }))
            .sort((a, b) => a.node.degree - b.node.degree);
          for (const item of order) {
            const { node, index } = item;
            const active = index === hover;
            const related = neighbors.has(index);
            const size = diameter(node) + (active ? 1.5 : 0);
            p5.noStroke();
            p5.fill(ink.r, ink.g, ink.b, active || related ? 235 : 90 + Math.min(node.degree, 12) * 8);
            p5.circle(node.x, node.y, size);
            if (active) {
              p5.fill(ink.r, ink.g, ink.b, 220);
              p5.textSize(13);
              p5.textAlign(p5.CENTER, p5.BOTTOM);
              p5.text(node.pali, node.x, node.y - size / 2 - 4);
            }
          }
        }}
        mouseMoved={p5 => {
          if (!graph.current) return;
          const next = nodeAt(graph.current, p5.mouseX, p5.mouseY);
          graph.current.hover = next;
          p5.cursor(next >= 0 ? "pointer" : "default");
        }}
        mousePressed={p5 => {
          if (!graph.current) return;
          const card = panel.current?.getBoundingClientRect();
          const canvas = holder.current?.querySelector("canvas")?.getBoundingClientRect();
          if (card && canvas) {
            const x = canvas.left + p5.mouseX;
            const y = canvas.top + p5.mouseY;
            if (x >= card.left && x <= card.right && y >= card.top && y <= card.bottom) return;
          }
          const hit = nodeAt(graph.current, p5.mouseX, p5.mouseY);
          graph.current.drag = hit;
          setSelectedId(hit >= 0 ? graph.current.nodes[hit].id : null);
        }}
        mouseDragged={p5 => {
          const current = graph.current;
          if (!current || current.drag < 0) return;
          const node = current.nodes[current.drag];
          node.x = p5.mouseX;
          node.y = p5.mouseY;
        }}
        mouseReleased={() => {
          if (graph.current) graph.current.drag = -1;
        }}
        windowResized={p5 => {
          const parent = holder.current;
          if (!parent) return;
          p5.resizeCanvas(parent.clientWidth, parent.clientHeight);
        }}
      />
      {selected && (
        <aside
          ref={panel}
          className={`absolute bottom-3 right-3 z-30 flex max-h-[calc(100%-1.5rem)] w-80 max-w-[calc(100%-1.5rem)] flex-col border px-4 py-3 text-sm leading-snug ${
            isDark ? "border-white/15 bg-[#212638]/95 text-[#F9FBFF]" : "border-black/10 bg-[#f4f8ff]/95 text-[#212638]"
          }`}
        >
          <div className="overflow-auto">
            <p className={`m-0 text-xs ${isDark ? "text-white/60" : "text-black/50"}`}>{selected.group}</p>
            <h2 className="m-0 text-xl leading-tight">{selected.pali}</h2>
            <p className="m-0">{selected.gloss}</p>
            <p className={`m-0 ${isDark ? "text-white/75" : "text-black/70"}`}>{selected.definition}</p>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <a className="btn btn-primary btn-sm" href={`/?term=${encodeURIComponent(selected.id)}#talk`}>
              Talk about this
            </a>
            <Link className="link" href={`/pali-ontology#${selected.id}`}>
              Glossary
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
