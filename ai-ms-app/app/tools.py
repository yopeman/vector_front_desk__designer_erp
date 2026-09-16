"""LangChain tools that let the Yope AI agent read & write ERP data.

Every tool talks to the same Supabase instance through the existing
PostgREST client (``app.db.db()``). Table / column names are validated
against the static registry in ``app.erp_schema`` before touching the API.

The caller's identity is carried in a ``contextvars.ContextVar`` so the
agent knows *who* it is acting for, even across HTTP requests that go
through the interrupt -> resume lifecycle.
"""

import contextvars

from langchain_core.tools import tool
from langgraph.types import interrupt

from app.db import db
from app.erp_schema import (
    ALLOWED_OPS,
    TABLES,
    access_level,
    accessible_table_names,
    column_names,
    table_columns_description,
    table_overview,
    table_real_name,
    table_schema,
    validate_columns,
)

request_ctx: contextvars.ContextVar[dict] = contextvars.ContextVar(
    "yope_agent_ctx", default={}
)


def set_request_context(ctx: dict) -> contextvars.Token:
    """Bind the caller identity for the duration of one agent run."""
    return request_ctx.set(ctx) if ctx else request_ctx.set({})


def reset_request_context(token: contextvars.Token) -> None:
    request_ctx.reset(token)


def _ctx() -> dict:
    return request_ctx.get() or {}


def _role() -> str | None:
    return (_ctx().get("role") or "").strip() or None


def _access_denied(role: str | None, table: str, need_write: bool) -> str | None:
    """Return an explanation string if the caller's role may not use `table`."""
    if table not in TABLES:
        return _unknown_table(table)
    level = access_level(role, table)
    if level == "none":
        return (
            f"Access denied: your role ({role or 'unknown'}) has no access to "
            f"table '{table}'. Call get_schema() to see the tables you can use."
        )
    if need_write and level != "rw":
        return (
            f"Access denied: your role ({role or 'unknown'}) may only read "
            f"'{table}', not modify it."
        )
    return None


def _unknown_table(table: str) -> str:
    return (
        f"Unknown table '{table}'. Know tables: {', '.join(sorted(TABLES))}. "
        "Finance-schema tables use the 'finance.<name>' form (e.g. "
        "'finance.gl_accounts'); do not confuse them with the public "
        "'finance_*' tables."
    )


def _child_builder(name: str):
    """Return the correct PostgREST builder for a (possibly schema-scoped) table."""
    schema = table_schema(name)
    real = table_real_name(name)
    if schema == "public":
        return db().table(real)
    return db().schema(schema).table(real)


def _filter_apply(builder, filters: list[dict]) -> object:
    """Apply validated AND-ed filter objects onto a PostgREST builder."""
    if not filters:
        return builder
    for spec in filters:
        col = spec["column"]
        op = spec.get("op", "eq")
        value = spec["value"]
        if op not in ALLOWED_OPS:
            raise ValueError(
                f"Unsupported operator '{op}' for column '{col}'. "
                f"Allowed: {sorted(ALLOWED_OPS)}"
            )
        if op == "eq":
            builder = builder.eq(col, value)
        elif op == "neq":
            builder = builder.neq(col, value)
        elif op == "gt":
            builder = builder.gt(col, value)
        elif op == "gte":
            builder = builder.gte(col, value)
        elif op == "lt":
            builder = builder.lt(col, value)
        elif op == "lte":
            builder = builder.lte(col, value)
        elif op == "like":
            builder = builder.like(col, value)
        elif op == "ilike":
            builder = builder.ilike(col, value)
        elif op == "in":
            if not isinstance(value, list):
                raise ValueError(f"'in' operator for '{col}' needs a list value")
            builder = builder.in_(col, value)
        elif op == "is":
            builder = builder.is_(col, value)
        elif op == "contains":
            builder = builder.contains(col, value)
    return builder


def _format_rows(rows) -> str:
    if rows is None:
        return "No results."
    if isinstance(rows, dict):
        rows = [rows]
    if not rows:
        return "No rows matched the criteria."
    import json

    return json.dumps(rows, indent=2, default=str)


# Error string shown to the model when a filter must be provided.
_NO_FILTERS_TIP = (
    "You must provide at least one filter. Refusing to apply changes to the "
    "whole table would be unsafe."
)


# ---------------------------------------------------------------------------
# Informational tools
# ---------------------------------------------------------------------------


@tool
def get_schema(table: str = "") -> str:
    """Return the ERP schema. With no argument, lists every table and its purpose.

    With a table name, returns all of that table's columns and their meaning so
    you can build precise filters. Call this whenever you are unsure of which
    table, column or status value to use.
    """
    if not table:
        role = _role()
        readable = accessible_table_names(role)
        return (
            "Yope ERP tables by module (only the tables your role may use are "
            f"listed, {len(readable)} readable):\n"
            + table_overview(role)
            + "\n\nCall get_schema('<table>') for any table's columns."
        )
    if table not in TABLES:
        return _unknown_table(table)
    denied = _access_denied(_role(), table, need_write=False)
    if denied:
        return denied
    try:
        return table_columns_description(table)
    except ValueError as exc:
        return str(exc)


@tool
def get_caller() -> str:
    """Return the identity of the ERP user currently chatting with the agent.

    Useful when a request is about 'me', 'my orders', 'my department', or when
    deciding what that user is allowed to do.
    """
    ctx = _ctx()
    if not ctx:
        return "No caller context is available."
    return (
        f"user_id: {ctx.get('user_id')}\n"
        f"username: {ctx.get('username')}\n"
        f"name: {ctx.get('name')}\n"
        f"email: {ctx.get('email')}\n"
        f"role: {ctx.get('role')}\n"
        f"department_id: {ctx.get('department_id')}"
    )


@tool
def query_records(
    table: str,
    filters: list[dict] | None = None,
    columns: str = "*",
    order_by: dict | None = None,
    limit: int = 20,
    offset: int = 0,
) -> str:
    """Read data from an ERP table using PostgREST.

    Args:
        table: name of the table (e.g. 'orders', 'clients', 'finance_sales').
        filters: list of {"column": str, "op": str, "value": any} objects,
            all combined with AND. Allowed ops: eq, neq, gt, gte, lt, lte,
            like, ilike, in (value is a list), is (value True/False/None),
            contains (for JSON/array columns).
        columns: comma-separated projection. Use '*' for all, or embed related
            tables like '*, clients(name, phone)'. Related-table names must be
            real ERP tables.
        order_by: optional {"column": str, "desc": bool}.
        limit: max rows to return (1..100, default 20).
        offset: rows to skip (default 0).
    """
    if table not in TABLES:
        return _unknown_table(table)
    denied = _access_denied(_role(), table, need_write=False)
    if denied:
        return denied
    known = column_names(table)
    tokens = [t.strip() for t in columns.split(",") if t.strip()]
    for tok in tokens:
        name_part = tok.split("(", 1)[0].strip()
        if name_part != "*" and name_part not in known and name_part not in TABLES:
            return (
                f"Cannot project unknown column '{name_part}'. "
                f"Valid columns for {table}: {', '.join(sorted(known))}. "
                f"Embedded relations must be real tables."
            )

    builder = _child_builder(table).select(columns)

    if filters:
        try:
            builder = _filter_apply(builder, filters)
        except ValueError as exc:
            return str(exc)
    if offset:
        builder = builder.offset(offset)
    if limit < 1:
        limit = 1
    builder = builder.limit(min(limit, 100))
    if order_by:
        col = order_by.get("column", "")
        if not col or col not in known:
            return (
                f"Invalid order_by column '{col}'. Valid columns: "
                f"{', '.join(sorted(known))}"
            )
        builder = builder.order(col, desc=bool(order_by.get("desc")))

    try:
        result = builder.execute()
    except Exception as exc:  # noqa: BLE001
        return f"Query failed on table '{table}': {exc}"
    return _format_rows(result.data)


# ---------------------------------------------------------------------------
# Write tools
# ---------------------------------------------------------------------------


@tool
def insert_record(table: str, data: dict) -> str:
    """Create a new record in an ERP table.

    Args:
        table: name of the table.
        data: the fields to create, e.g. {"name": "...", "status": "New"}.
            Omit id/generated/defaulted columns; leave them for the database.
    """
    if table not in TABLES:
        return _unknown_table(table)
    denied = _access_denied(_role(), table, need_write=True)
    if denied:
        return denied
    validate_columns(table, set(data))
    try:
        result = _child_builder(table).insert(data).execute()
    except Exception as exc:  # noqa: BLE001
        return f"Insert failed on '{table}': {exc}"
    return _format_rows(result.data)


@tool
def update_record(table: str, filters: list[dict], data: dict) -> str:
    """Update existing row(s) in an ERP table that match the filters.

    Args:
        table: name of the table.
        filters: the same AND-ed filter objects as query_records. AT LEAST ONE
            filter is REQUIRED so you never touch the whole table by accident.
        data: fields to change.
    """
    if table not in TABLES:
        return _unknown_table(table)
    denied = _access_denied(_role(), table, need_write=True)
    if denied:
        return denied
    validate_columns(table, set(data))
    if not filters:
        return _NO_FILTERS_TIP
    builder = _child_builder(table).update(data)
    try:
        builder = _filter_apply(builder, filters)
        result = builder.execute()
    except ValueError as exc:
        return str(exc)
    except Exception as exc:  # noqa: BLE001
        return f"Update failed on '{table}': {exc}"
    return _format_rows(result.data)


@tool
def delete_record(table: str, filters: list[dict], confirm: str = "no") -> str:
    """Delete row(s) in an ERP table that match the filters.

    Args:
        table: name of the table.
        filters: the same AND-ed filter objects as query_records. AT LEAST ONE
            FILTER IS REQUIRED.
        confirm: set to 'yes' only after the user has explicitly confirmed the
            deletion. Anything else is refused.
    """
    if table not in TABLES:
        return _unknown_table(table)
    denied = _access_denied(_role(), table, need_write=True)
    if denied:
        return denied
    if not filters:
        return _NO_FILTERS_TIP
    if confirm != "yes":
        return (
            "Deletion refused: you must ask the user explicitly to confirm "
            "which exact records to delete and how many will be affected, "
            "then pass confirm='yes' only after they agree."
        )
    builder = _child_builder(table).delete()
    try:
        builder = _filter_apply(builder, filters)
        result = builder.execute()
    except ValueError as exc:
        return str(exc)
    except Exception as exc:  # noqa: BLE001
        return f"Delete failed on '{table}': {exc}"
    rows = _format_rows(result.data)
    count = len(result.data) if isinstance(result.data, list) else -1
    return f"Deleted {count} row(s).\n{rows}"


# ---------------------------------------------------------------------------
# RAG over uploaded attachments
# ---------------------------------------------------------------------------


@tool
def search_attachments(query: str) -> str:
    """Semantically search the documents the user uploaded to this chat session.

    Pass the user's question (or a key phrase) as `query`; the most relevant
    excerpts from uploaded PDFs/DOCX/TXT/... files are returned so you can cite
    them in your answer. Returns empty when the session has no attachments.
    """
    session_id = _ctx().get("session_id")
    if not session_id:
        return "No active chat session."
    try:
        from app import ai
        from app.db import db as _db

        embedding = ai.embedding_vector(query)
        result = (
            _db()
            .rpc(
                "match_ai_attachments",
                {
                    "session_uuid": session_id,
                    "query_embedding": embedding,
                    "match_count": 3,
                },
            )
            .execute()
        )
        rows = result.data or []
    except Exception:  # noqa: BLE001
        return "Attachment search unavailable (embedding service offline)."
    if not rows:
        return "No matching document excerpts found in this session's attachments."
    return "\n\n".join(
        f"[{row.get('file_name', 'attachment')}]\n{row.get('content', '')}"
        for row in rows
    )


# ---------------------------------------------------------------------------
# Human-in-the-loop
# ---------------------------------------------------------------------------


@tool
def ask_user(question: str) -> str:
    """Ask the user a clarifying question and wait for their answer.

    Use this whenever User's request is ambiguous, lacks a required detail
    (client/order/invoice references, dates, statuses, item names, ...), or
    when you need explicit approval before mutating or deleting data. The
    player is paused until the user responds; the resume value is returned.
    """
    return interrupt({"type": "ask_user", "question": question})


def all_tools() -> list:
    return [
        get_schema,
        get_caller,
        query_records,
        insert_record,
        update_record,
        delete_record,
        search_attachments,
        ask_user,
    ]