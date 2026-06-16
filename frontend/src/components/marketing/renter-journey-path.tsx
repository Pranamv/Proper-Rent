"use client";

import {
  CalendarCheck,
  ClipboardText,
  HouseLine,
  UserCheck,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import {
  animate,
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect } from "react";

const VIEW_WIDTH = 680;
const VIEW_HEIGHT = 400;
const PATH_D =
  "M116,160 C168,70 214,92 270,270 C314,358 376,64 430,126 C482,186 512,270 564,226";

const SURFACE_COLOR = "#F1F4EC";
const PRIMARY_COLOR = "#0B6B55";
const MUTED_COLOR = "#5E5A4F";
const FOREGROUND_COLOR = "#2A2E29";
const PRIMARY_FOREGROUND_COLOR = "#FBF7EF";

type RenterWaypoint = {
  icon: Icon;
  title: string;
  body: string;
  x: number;
  y: number;
  labelY: number;
};

const WAYPOINTS = [
  {
    icon: ClipboardText,
    title: "Register requirements",
    body: "Share your budget, areas, move timing, and rental situation.",
    x: 116,
    y: 160,
    labelY: 220,
  },
  {
    icon: UserCheck,
    title: "Agent review",
    body: "A Proper Rent agent checks your details and confirms suitable next steps.",
    x: 270,
    y: 270,
    labelY: 340,
  },
  {
    icon: CalendarCheck,
    title: "Book viewings",
    body: "Move toward real, available rental options with human support.",
    x: 430,
    y: 126,
    labelY: 26,
  },
  {
    icon: HouseLine,
    title: "Move forward",
    body: "If the right home is found, the agent guides the tenancy next steps.",
    x: 564,
    y: 226,
    labelY: 286,
  },
] as const satisfies readonly RenterWaypoint[];

function toPercent(value: number, axis: "x" | "y") {
  return `${(value / (axis === "x" ? VIEW_WIDTH : VIEW_HEIGHT)) * 100}%`;
}

export function RenterJourneyPath() {
  const shouldReduceMotion = useReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      progress.set(1);
      return;
    }

    const controls = animate(progress, 1, {
      duration: 3.1,
      ease: "easeInOut",
      delay: 0.35,
    });

    return () => controls.stop();
  }, [progress, shouldReduceMotion]);

  const agentColor = useTransform(progress, [0.28, 0.42], [SURFACE_COLOR, PRIMARY_COLOR]);
  const agentIconColor = useTransform(
    progress,
    [0.28, 0.42],
    [MUTED_COLOR, PRIMARY_FOREGROUND_COLOR],
  );
  const viewingColor = useTransform(progress, [0.58, 0.72], [SURFACE_COLOR, PRIMARY_COLOR]);
  const viewingIconColor = useTransform(
    progress,
    [0.58, 0.72],
    [MUTED_COLOR, PRIMARY_FOREGROUND_COLOR],
  );
  const moveColor = useTransform(progress, [0.86, 1], [SURFACE_COLOR, PRIMARY_COLOR]);
  const moveIconColor = useTransform(
    progress,
    [0.86, 1],
    [MUTED_COLOR, PRIMARY_FOREGROUND_COLOR],
  );

  return (
    <aside
      aria-label="Renter registration journey"
      className="relative mx-auto w-full max-w-2xl overflow-visible bg-background py-2 sm:py-4 lg:py-5"
    >
      <div className="relative aspect-[17/10]">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="absolute inset-0 size-full"
          aria-hidden="true"
        >
          <path
            d={PATH_D}
            fill="none"
            stroke={SURFACE_COLOR}
            strokeLinecap="round"
            strokeWidth={7}
          />
          <motion.path
            d={PATH_D}
            fill="none"
            stroke={PRIMARY_COLOR}
            strokeLinecap="round"
            strokeWidth={7}
            style={{ pathLength: progress }}
          />
        </svg>

        <WaypointMarker
          waypoint={WAYPOINTS[0]}
          circleColor={PRIMARY_COLOR}
          iconColor={PRIMARY_FOREGROUND_COLOR}
        />
        <WaypointMarker
          waypoint={WAYPOINTS[1]}
          circleColor={agentColor}
          iconColor={agentIconColor}
        />
        <WaypointMarker
          waypoint={WAYPOINTS[2]}
          circleColor={viewingColor}
          iconColor={viewingIconColor}
        />
        <WaypointMarker
          waypoint={WAYPOINTS[3]}
          circleColor={moveColor}
          iconColor={moveIconColor}
        />
      </div>
      <ol className="sr-only">
        {WAYPOINTS.map((waypoint, index) => (
          <li key={waypoint.title}>
            {index + 1}. {waypoint.title}: {waypoint.body}
          </li>
        ))}
      </ol>
    </aside>
  );
}

function WaypointMarker({
  circleColor,
  iconColor,
  waypoint,
}: {
  circleColor: string | MotionValue<string>;
  iconColor: string | MotionValue<string>;
  waypoint: RenterWaypoint;
}) {
  const WaypointIcon = waypoint.icon;

  return (
    <>
      <motion.div
        className="absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border shadow-soft sm:size-12"
        style={{
          backgroundColor: circleColor,
          left: toPercent(waypoint.x, "x"),
          top: toPercent(waypoint.y, "y"),
        }}
      >
        <motion.span style={{ color: iconColor }}>
          <WaypointIcon className="size-5 sm:size-6" weight="bold" aria-hidden="true" />
        </motion.span>
      </motion.div>
      <div
        className="absolute w-24 -translate-x-1/2 text-center sm:w-36"
        style={{
          left: toPercent(waypoint.x, "x"),
          top: toPercent(waypoint.labelY, "y"),
        }}
      >
        <p
          className="text-xs font-bold leading-4 sm:text-sm sm:leading-5"
          style={{ color: FOREGROUND_COLOR }}
        >
          {waypoint.title}
        </p>
      </div>
    </>
  );
}
