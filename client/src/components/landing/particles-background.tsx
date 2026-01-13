import { useEffect, useState, useMemo, useCallback } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

interface ParticlesBackgroundProps {
  enabled?: boolean;
  color?: string;
  quantity?: number;
  speed?: number;
  opacity?: number;
}

let engineInitialized = false;

export function ParticlesBackground({
  enabled = true,
  color = "#6366f1",
  quantity = 50,
  speed = 0.5,
  opacity = 0.3,
}: ParticlesBackgroundProps) {
  const [init, setInit] = useState(engineInitialized);

  useEffect(() => {
    if (engineInitialized) {
      setInit(true);
      return;
    }
    
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      engineInitialized = true;
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container?: Container) => {
    console.log("Particles loaded", container);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          grab: {
            distance: 140,
            links: {
              opacity: 0.5,
            },
          },
        },
      },
      particles: {
        color: {
          value: color,
        },
        links: {
          color: color,
          distance: 150,
          enable: true,
          opacity: opacity * 0.5,
          width: 1,
        },
        move: {
          enable: true,
          speed: speed,
          direction: "none" as const,
          random: false,
          straight: false,
          outModes: {
            default: "out" as const,
          },
        },
        number: {
          density: {
            enable: true,
            height: 800,
            width: 800,
          },
          value: quantity,
        },
        opacity: {
          value: opacity,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
      fullScreen: false,
    }),
    [color, quantity, speed, opacity]
  );

  if (!enabled || !init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles-hero"
      particlesLoaded={particlesLoaded}
      options={options}
      className="w-full h-full"
    />
  );
}
