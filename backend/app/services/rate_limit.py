import asyncio
import math
from collections import defaultdict, deque
from dataclasses import dataclass
from time import monotonic


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    retry_after_seconds: int = 0


class InMemoryRateLimiter:
    """Process-local fixed-window limiter used as app defense-in-depth.

    Production deployments should still keep edge/proxy rate limits. This limiter
    prevents accidental unbounded public endpoint use when the app is run alone.
    """

    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(
        self,
        *,
        key: str,
        limit: int,
        window_seconds: int,
    ) -> RateLimitDecision:
        now = monotonic()
        window_start = now - window_seconds

        async with self._lock:
            events = self._events[key]
            while events and events[0] <= window_start:
                events.popleft()

            if len(events) >= limit:
                retry_after = max(1, math.ceil(events[0] + window_seconds - now))
                return RateLimitDecision(
                    allowed=False,
                    retry_after_seconds=retry_after,
                )

            events.append(now)
            return RateLimitDecision(allowed=True)
