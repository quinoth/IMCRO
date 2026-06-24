import os
from pathlib import Path
import tempfile

from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


def _default_test_database_url() -> str:
    test_dir = Path(tempfile.mkdtemp(prefix="mky_pytest_"))
    return f"sqlite:///{test_dir.as_posix()}/mky_pytest.db"


def _assert_safe_test_database_url(raw_url: str, source: str) -> None:
    try:
        parsed = make_url(raw_url)
    except ArgumentError as exc:
        raise RuntimeError(f"{source} is not a valid SQLAlchemy database URL.") from exc

    driver = parsed.drivername.lower()
    database = (parsed.database or "").lower()
    if driver.startswith("sqlite"):
        return
    if driver.startswith("postgresql") and (
        "test" in database or "pytest" in database
    ):
        return

    masked_url = parsed.render_as_string(hide_password=True)
    raise RuntimeError(
        f"{source} points to a non-test database ({masked_url}). "
        "Refusing to run tests because some tests drop and recreate tables. "
        "Use TEST_DATABASE_URL with sqlite or a PostgreSQL database name "
        "containing 'test' or 'pytest'."
    )


test_database_url = os.environ.get("TEST_DATABASE_URL") or _default_test_database_url()
_assert_safe_test_database_url(test_database_url, "TEST_DATABASE_URL")
os.environ["DATABASE_URL"] = test_database_url
