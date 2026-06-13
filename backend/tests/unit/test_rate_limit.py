import asyncio

from app.services.rate_limit import InMemoryRateLimiter


def test_rate_limiter_blocks_after_limit_and_reports_retry_after() -> None:
    asyncio.run(run_rate_limiter_test())


async def run_rate_limiter_test() -> None:
    limiter = InMemoryRateLimiter()

    first = await limiter.check(key="chat:testclient", limit=1, window_seconds=60)
    second = await limiter.check(key="chat:testclient", limit=1, window_seconds=60)

    assert first.allowed is True
    assert first.retry_after_seconds == 0
    assert second.allowed is False
    assert second.retry_after_seconds > 0
