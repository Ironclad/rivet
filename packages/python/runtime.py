import os
import pythonmonkey as pm
import requests

rivet = pm.require('./rivet.bundle.cjs')

# filepath = os.path.expanduser('~/Desktop/Testing4.rivet-project')
# with open(filepath, 'r') as file:
#   data = file.read()

pm.globalThis['AbortController'] = pm.eval("""
  class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }
    }
    abort() {
      this.signal.aborted = true;
    }
  }
  AbortController
""")

def fetch(request):
    headers = getattr(request, 'headers', {})
    if 'Content-Type' not in headers:
        headers['Content-Type'] = 'application/json'

    headers = { k : v for k, v in iter(headers) }

    response = requests.request(
        request.method,
        request.url,
        headers=headers,
        data=request.body
    )

    return {
        "ok": response.ok,
        "status": response.status_code,
        "statusText": response.reason,
        "body": response.json(),  # assuming the response is JSON
        "headers": dict(response.headers),
    }

def streamEvents(request):
    raise NotImplementedError("Streaming is not supported.")

http_provider = {
    "supportsStreaming": False,
    "fetch": fetch,
    "streamEvents": streamEvents,
}

env = {
  "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY"),
  "OPENAI_ORGANIZATION_ID": os.environ.get("OPENAI_ORGANIZATION_ID"),
}


global_rivet_node_registry = pm.eval("(rivet) => rivet.globalRivetNodeRegistry")(rivet)
