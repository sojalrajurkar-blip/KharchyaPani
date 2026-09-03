from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.mock_provider import MockAIProvider

def get_ai_provider() -> BaseAIProvider:
    """Factory function resolving active AI provider from environment configuration."""
    effective_provider = settings.get_effective_ai_provider()

    if effective_provider == "gemini":
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            return GeminiProvider()
        # Fall back gracefully to MockAIProvider if key is empty
        return MockAIProvider()

    # Default to MockAIProvider for offline / mock modes
    return MockAIProvider()
