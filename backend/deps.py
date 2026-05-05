from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

_rag = None


def set_rag(chain):
    global _rag
    _rag = chain


def get_rag():
    return _rag
