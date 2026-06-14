"use client";

import { ChatCircleDots, ClipboardText, UserCheck } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 440;
const PATH_D = "M76,56 C206,78 238,148 224,200 C210,252 164,322 104,380";

const SURFACE_COLOR = "#F1F4EC";
const PRIMARY_COLOR = "#0B6B55";
const SPARK_COLOR = "#D98B5F";
const MUTED_COLOR = "#5E5A4F";
const PRIMARY_FOREGROUND_COLOR = "#FBF7EF";

type Waypoint = {
  icon: Icon;
  label: string;
  body: string;
  x: number;
  y: number;
};

const WAYPOINTS: Waypoint[] = [
  {
    icon: ChatCircleDots,
    label: "Ask",
    body: "Chat with us about renting or letting.",
    x: 76,
    y: 56,
  },
  {
    icon: ClipboardText,
    label: "Register",
    body: "Share your details in a short form.",
    x: 224,
    y: 200,
  },
  {
    icon: UserCheck,
    label: "Agent follow-up",
    body: "A Proper Rent agent takes it from here.",
    x: 104,
    y: 380,
  },
];

function toPercent(value: number, axis: "x" | "y") {
  return `${(value / (axis === "x" ? VIEW_WIDTH : VIEW_HEIGHT)) * 100}%`;
}

export function JourneyPath() {
  const pathRef = useRef<SVGPathElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      progress.set(1);
      return;
    }
    const controls = animate(progress, 1, {
      duration: 1.6,
      ease: "easeInOut",
      delay: 0.4,
    });
    return () => controls.stop();
  }, [progress, shouldReduceMotion]);

  const registerColor = useTransform(progress, [0.45, 0.6], [SURFACE_COLOR, PRIMARY_COLOR]);
  const registerIconColor = useTransform(
    progress,
    [0.45, 0.6],
    [MUTED_COLOR, PRIMARY_FOREGROUND_COLOR],
  );
  const followUpColor = useTransform(progress, [0.9, 1], [SURFACE_COLOR, PRIMARY_COLOR]);
  const followUpIconColor = useTransform(
    progress,
    [0.9, 1],
    [MUTED_COLOR, PRIMARY_FOREGROUND_COLOR],
  );

  const markerLeft = useTransform(progress, (latest) => {
    const path = pathRef.current;
    if (!path) return toPercent(WAYPOINTS[0].x, "x");
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * latest);
    return toPercent(point.x, "x");
  });
  const markerTop = useTransform(progress, (latest) => {
    const path = pathRef.current;
    if (!path) return toPercent(WAYPOINTS[0].y, "y");
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * latest);
    return toPercent(point.y, "y");
  });

  if (shouldReduceMotion) {
    return (
      <JourneyPathFrame>
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="absolute inset-0 size-full"
          aria-hidden="true"
        >
          <path
            d={PATH_D}
            fill="none"
            stroke={PRIMARY_COLOR}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="1 10"
          />
        </svg>
        <WaypointMarker waypoint={WAYPOINTS[0]} circleColor={PRIMARY_COLOR} iconColor={PRIMARY_FOREGROUND_COLOR} />
        <WaypointMarker waypoint={WAYPOINTS[1]} circleColor={PRIMARY_COLOR} iconColor={PRIMARY_FOREGROUND_COLOR} />
        <WaypointMarker waypoint={WAYPOINTS[2]} circleColor={PRIMARY_COLOR} iconColor={PRIMARY_FOREGROUND_COLOR} />
      </JourneyPathFrame>
    );
  }

  return (
    <JourneyPathFrame>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <path
          d={PATH_D}
          fill="none"
          stroke={SURFACE_COLOR}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="1 10"
        />
        <motion.path
          ref={pathRef}
          d={PATH_D}
          fill="none"
          stroke={PRIMARY_COLOR}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="1 10"
          style={{ pathLength: progress }}
        />
      </svg>
      <motion.div
        className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-soft"
        style={{ left: markerLeft, top: markerTop, backgroundColor: SPARK_COLOR }}
        aria-hidden="true"
      />
      <WaypointMarker waypoint={WAYPOINTS[0]} circleColor={PRIMARY_COLOR} iconColor={PRIMARY_FOREGROUND_COLOR} />
      <WaypointMarker waypoint={WAYPOINTS[1]} circleColor={registerColor} iconColor={registerIconColor} />
      <WaypointMarker waypoint={WAYPOINTS[2]} circleColor={followUpColor} iconColor={followUpIconColor} />
    </JourneyPathFrame>
  );
}

function JourneyPathFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-[4/5] w-full max-w-md">
      {children}
      <ol className="sr-only">
        {WAYPOINTS.map((waypoint) => (
          <li key={waypoint.label}>
            {waypoint.label}: {waypoint.body}
          </li>
        ))}
      </ol>
    </div>
  );
}

function WaypointMarker({
  waypoint,
  circleColor,
  iconColor,
}: {
  waypoint: Waypoint;
  circleColor: string | ReturnType<typeof useTransform<number, string>>;
  iconColor: string | ReturnType<typeof useTransform<number, string>>;
}) {
  const WaypointIcon = waypoint.icon;

  return (
    <>
      <motion.div
        className="absolute grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border shadow-soft"
        style={{ left: toPercent(waypoint.x, "x"), top: toPercent(waypoint.y, "y"), backgroundColor: circleColor }}
      >
        <motion.span style={{ color: iconColor }}>
          <WaypointIcon size={24} weight="bold" aria-hidden="true" />
        </motion.span>
      </motion.div>
      <div
        className="absolute w-36 -translate-x-1/2 text-center"
        style={{ left: toPercent(waypoint.x, "x"), top: toPercent(waypoint.y + 46, "y") }}
      >
        <p className="text-sm font-bold text-foreground">{waypoint.label}</p>
        <p className="text-xs leading-5 text-muted">{waypoint.body}</p>
      </div>
    </>
  );
}
