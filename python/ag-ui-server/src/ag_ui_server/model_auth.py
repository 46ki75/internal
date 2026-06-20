# boto3 ships partial type information for its dynamic clients, so this module
# opts down to basic type checking.
# pyright: basic
"""Authenticate the Claude Agent SDK against a Claude Pro/Max subscription.

The Claude Agent SDK speaks the Anthropic Messages API through its bundled CLI.
We authenticate it with a ``claude setup-token`` OAuth token (subscription auth),
stored as an SSM SecureString so no model credential lives in the image or in
plain environment variables. The token is read once at startup and exported as
``CLAUDE_CODE_OAUTH_TOKEN`` before the first ``query()``.
"""

from __future__ import annotations

import os

import boto3

from .config import Config


def fetch_oauth_token(config: Config) -> str:
    """Read the ``claude setup-token`` OAuth token from SSM (SecureString)."""
    ssm = boto3.client("ssm", region_name=config.oauth_token_region)
    response = ssm.get_parameter(Name=config.oauth_token_param, WithDecryption=True)
    return response["Parameter"]["Value"]


def configure_sdk_env(token: str) -> None:
    """Export the environment the SDK's bundled CLI reads when it spawns.

    ``CLAUDE_CODE_OAUTH_TOKEN`` sits *below* ``ANTHROPIC_AUTH_TOKEN`` /
    ``ANTHROPIC_API_KEY`` in the CLI's auth precedence, so any leftover
    ``ANTHROPIC_*`` would outrank the subscription token and route around it.
    Clear them first. The SDK reads these when it spawns its CLI subprocess, so
    they must be set before the first ``query()``.
    """
    os.environ["CLAUDE_CODE_OAUTH_TOKEN"] = token
    for name in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL"):
        os.environ.pop(name, None)
