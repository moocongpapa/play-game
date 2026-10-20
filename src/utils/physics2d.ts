export interface PhysicsBody {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  omega: number;
  restitution: number;
  mass: number;
  color: number;
  secondaryColor: number;
  kind: 'star' | 'fruit' | 'candy' | 'bubble';
  life: number;
  maxLife: number;
}

export interface PhysicsWorldOptions {
  width: number;
  height: number;
  gravity?: number;
  maxBodies?: number;
}

/**
 * 60fps 2D Rigid-Body Circle Physics Engine with elastic impulse collision
 * resolution, positional slop correction, angular rolling spin, and wind forces.
 */
export function createPhysicsWorld(options: PhysicsWorldOptions) {
  let width = Math.max(120, options.width);
  let height = Math.max(120, options.height);
  const gravity = options.gravity ?? 0.36;
  const maxBodies = options.maxBodies ?? 28;
  const bodies: PhysicsBody[] = [];
  let nextId = 1;

  function resize(w: number, h: number) {
    width = Math.max(120, w);
    height = Math.max(120, h);
  }

  function spawn(partial: Partial<PhysicsBody> & { x: number; y: number }): PhysicsBody {
    while (bodies.length >= maxBodies) {
      bodies.shift();
    }
    const radius = partial.radius ?? 14;
    const body: PhysicsBody = {
      id: nextId++,
      x: Math.max(radius, Math.min(width - radius, partial.x)),
      y: Math.max(radius, Math.min(height - radius, partial.y)),
      vx: partial.vx ?? (Math.random() - 0.5) * 6,
      vy: partial.vy ?? -3 - Math.random() * 4,
      radius,
      angle: partial.angle ?? Math.random() * Math.PI * 2,
      omega: partial.omega ?? (Math.random() - 0.5) * 0.2,
      restitution: partial.restitution ?? 0.72,
      mass: partial.mass ?? Math.max(1, (radius * radius) / 100),
      color: partial.color ?? 0xfacc15,
      secondaryColor: partial.secondaryColor ?? 0xf472b6,
      kind: partial.kind ?? 'star',
      life: 0,
      maxLife: partial.maxLife ?? 260,
    };
    bodies.push(body);
    return body;
  }

  function applyWind(fx: number, fy = -1.8) {
    for (const b of bodies) {
      b.vx += fx / Math.sqrt(b.mass);
      b.vy += fy / Math.sqrt(b.mass);
      b.omega += fx * 0.015;
    }
  }

  function impulseAt(px: number, py: number, radius = 90) {
    let hit = 0;
    for (const b of bodies) {
      const dx = b.x - px;
      const dy = b.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist < radius + b.radius) {
        const nx = dist > 0.001 ? dx / dist : (Math.random() - 0.5);
        const factor = 1 - Math.min(1, dist / (radius + b.radius));
        b.vx += nx * (5 + factor * 6);
        b.vy = -5.5 - factor * 5;
        b.omega += nx * 0.25;
        hit++;
      }
    }
    return hit;
  }

  function step(dt = 1) {
    const clampedDt = Math.min(2.5, Math.max(0.1, dt));
    const floorY = height - 10;
    const leftX = 10;
    const rightX = width - 10;

    // 1. Integrate forces & velocities
    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      b.life += clampedDt;
      if (b.life >= b.maxLife) {
        bodies.splice(i, 1);
        continue;
      }

      const g = b.kind === 'bubble' ? -0.05 : gravity;
      b.vy += g * clampedDt;
      b.vx *= 0.992;
      b.vy *= 0.995;

      b.x += b.vx * clampedDt;
      b.y += b.vy * clampedDt;
      b.angle += b.omega * clampedDt;
      b.omega *= 0.98;

      // Wall collisions
      if (b.x - b.radius < leftX) {
        b.x = leftX + b.radius;
        b.vx = Math.abs(b.vx) * b.restitution;
        b.omega = b.vx / b.radius;
      } else if (b.x + b.radius > rightX) {
        b.x = rightX - b.radius;
        b.vx = -Math.abs(b.vx) * b.restitution;
        b.omega = b.vx / b.radius;
      }

      // Ceiling / Floor collisions
      if (b.y - b.radius < 10) {
        b.y = 10 + b.radius;
        b.vy = Math.abs(b.vy) * b.restitution;
      } else if (b.y + b.radius > floorY) {
        b.y = floorY - b.radius;
        if (Math.abs(b.vy) > 0.8) {
          b.vy = -Math.abs(b.vy) * b.restitution;
        } else {
          b.vy = 0;
        }
        // Rolling friction on the floor
        b.vx *= 0.96;
        b.omega = (b.vx / b.radius) * 0.85;
      }
    }

    // 2. Pairwise Rigid-Body Elastic Collision Resolution (2 iterations for stable stacking)
    for (let iter = 0; iter < 2; iter++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minDist = a.radius + b.radius;
          const distSq = dx * dx + dy * dy;
          if (distSq >= minDist * minDist || distSq === 0) continue;

          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          // Positional correction (prevent sinking when stacked)
          const penetration = minDist - dist;
          const totalMass = a.mass + b.mass;
          const corrA = (penetration * (b.mass / totalMass)) * 0.8;
          const corrB = (penetration * (a.mass / totalMass)) * 0.8;
          a.x -= nx * corrA;
          a.y -= ny * corrA;
          b.x += nx * corrB;
          b.y += ny * corrB;

          // Relative velocity along normal
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;
          if (velAlongNormal > 0) continue;

          const e = Math.min(a.restitution, b.restitution);
          const invMassA = 1 / a.mass;
          const invMassB = 1 / b.mass;
          const impulse = (-(1 + e) * velAlongNormal) / (invMassA + invMassB);

          const ix = impulse * nx;
          const iy = impulse * ny;
          a.vx -= ix * invMassA;
          a.vy -= iy * invMassA;
          b.vx += ix * invMassB;
          b.vy += iy * invMassB;

          // Tangential spin transfer
          const tx = -ny;
          const ty = nx;
          const tangentVel = rvx * tx + rvy * ty;
          a.omega += (tangentVel / a.radius) * 0.08;
          b.omega -= (tangentVel / b.radius) * 0.08;
        }
      }
    }
  }

  function clear() {
    bodies.length = 0;
  }

  return {
    bodies,
    spawn,
    step,
    resize,
    applyWind,
    impulseAt,
    clear,
  };
}
