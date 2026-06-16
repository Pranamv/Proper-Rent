"use client";

import { Bank, Buildings, HouseLine, UserCheck } from "@phosphor-icons/react";
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
  "M116,150 C172,90 204,310 270,270 C330,238 372,80 430,144 C490,196 506,272 564,230";

const TRACE_COLOR = "#EBDCC7";
const LANDLORD_COLOR = "#7B5C3A";
const LANDLORD_SURFACE_COLOR = "#F3E6D8";
const MUTED_COLOR = "#6F6456";
const FOREGROUND_COLOR = "#2A2E29";
const LANDLORD_FOREGROUND_COLOR = "#FBF7EF";

type LandlordWaypoint = {
  icon: Icon;
  label: string;
  title: string;
  body: string;
  x: number;
  y: number;
  labelY: number;
};

const WAYPOINTS = [
  {
    icon: Buildings,
    label: "Register",
    title: "Register property",
    body: "Share the property details, rent guide, and what you want help with.",
    x: 116,
    y: 150,
    labelY: 205,
  },
  {
    icon: UserCheck,
    label: "Agent review",
    title: "Agent review",
    body: "We check whether listing support, Advanced Rent, or both make sense.",
    x: 270,
    y: 270,
    labelY: 320,
  },
  {
    icon: Bank,
    label: "Choose route",
    title: "List or rent upfront",
    body: "Choose the right next step with a Proper Rent agent.",
    x: 430,
    y: 144,
    labelY: 56,
  },
  {
    icon: HouseLine,
    label: "Move forward",
    title: "Move toward a let",
    body: "Work toward a tenant, listing outcome, or rent plan.",
    x: 564,
    y: 230,
    labelY: 282,
  },
] as const satisfies readonly LandlordWaypoint[];

function toPercent(value: number, axis: "x" | "y") {
  return `${(value / (axis === "x" ? VIEW_WIDTH : VIEW_HEIGHT)) * 100}%`;
}

export function LandlordJourneyPath() {
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

  const reviewColor = useTransform(
    progress,
    [0.28, 0.42],
    [LANDLORD_SURFACE_COLOR, LANDLORD_COLOR],
  );
  const reviewIconColor = useTransform(
    progress,
    [0.28, 0.42],
    [MUTED_COLOR, LANDLORD_FOREGROUND_COLOR],
  );
  const routeColor = useTransform(
    progress,
    [0.58, 0.72],
    [LANDLORD_SURFACE_COLOR, LANDLORD_COLOR],
  );
  const routeIconColor = useTransform(
    progress,
    [0.58, 0.72],
    [MUTED_COLOR, LANDLORD_FOREGROUND_COLOR],
  );
  const letColor = useTransform(
    progress,
    [0.86, 1],
    [LANDLORD_SURFACE_COLOR, LANDLORD_COLOR],
  );
  const letIconColor = useTransform(
    progress,
    [0.86, 1],
    [MUTED_COLOR, LANDLORD_FOREGROUND_COLOR],
  );

  return (
    <aside
      aria-label="Landlord registration journey"
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
            stroke={TRACE_COLOR}
            strokeLinecap="round"
            strokeWidth={7}
          />
          <motion.path
            d={PATH_D}
            fill="none"
            stroke={LANDLORD_COLOR}
            strokeLinecap="round"
            strokeWidth={7}
            style={{ pathLength: progress }}
          />
        </svg>

        <WaypointMarker
          waypoint={WAYPOINTS[0]}
          circleColor={LANDLORD_COLOR}
          iconColor={LANDLORD_FOREGROUND_COLOR}
        />
        <WaypointMarker
          waypoint={WAYPOINTS[1]}
          circleColor={reviewColor}
          iconColor={reviewIconColor}
        />
        <WaypointMarker
          waypoint={WAYPOINTS[2]}
          circleColor={routeColor}
          iconColor={routeIconColor}
        />
        <WaypointMarker
          waypoint={WAYPOINTS[3]}
          circleColor={letColor}
          iconColor={letIconColor}
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
  waypoint: LandlordWaypoint;
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
        className="absolute w-24 -translate-x-1/2 text-center sm:w-32"
        style={{
          left: toPercent(waypoint.x, "x"),
          top: toPercent(waypoint.labelY, "y"),
        }}
      >
        <p
          className="text-xs font-semibold leading-4 sm:text-[0.8125rem] sm:leading-5"
          style={{ color: FOREGROUND_COLOR }}
        >
          {waypoint.label}
        </p>
      </div>
    </>
  );
}
