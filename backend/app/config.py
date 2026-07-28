from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./showcase.db"
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7
    upload_dir: str = "./static/uploads"
    public_base_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:3000"

    # Batch 2 — AI-powered submission
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5"
    capture_timeout_ms: int = 30000

    # Batch 5 — admin & production
    admin_usernames: str = ""
    capture_rate_limit_per_hour: int = 10

    # Storage backend: "local" (default, zero-config, disk-based — fine for
    # dev but wiped on every redeploy on platforms with ephemeral
    # filesystems like Railway/Render) or "s3" (S3-compatible: AWS S3,
    # Cloudflare R2, etc. — required before a real production launch).
    storage_backend: str = "local"
    s3_bucket: str | None = None
    s3_region: str = "auto"
    s3_endpoint_url: str | None = None  # set for R2/non-AWS S3-compatible providers; leave unset for AWS S3
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_public_url_base: str | None = None  # e.g. your R2 public bucket URL or a CloudFront domain

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def admin_usernames_list(self) -> list[str]:
        return [u.strip() for u in self.admin_usernames.split(",") if u.strip()]

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
