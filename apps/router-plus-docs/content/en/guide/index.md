# Router Plus guide

Router Plus adds navigation, native state access, query synchronization, retained views and interactions to React and Vue applications. The application owns its native router, components and live state; RP registers access and navigation rules.

## Reading paths

| Task | Start here |
| --- | --- |
| Compose a dashboard, async catalog, requests, guards and retention | [Application recipes](application-integration) |
| Install, connect a framework, own instances and configure HMR | [Integration and lifecycle](getting-started) |
| Define page identity, address state and retained instances | [Pages and instances](pages-and-instances) |
| Navigate, resolve links and read commit receipts | [Navigation and results](navigation) |
| Create or register native state, bind queries and retain views | [Native state and query parameters](state-and-tabs) |
| Read, write, call, inspect and sequence registered sources | [State access and command sequences](state-access) |
| Connect Zustand, Redux, Jotai and Vue setup stores | [Store integration](stores) |
| Configure guards, protocols and plugins | [Guards and plugins](guards-and-plugins) |
| Install overlays, highlights, tours, focus and scrolling | [Highlights and tours](interactions) |
| Isolate SSR requests, restore addresses and test navigation | [SSR and testing](state-ssr-and-testing) |
| Look up exact types, fields and methods | [API reference](/en/api/) |

## Requirements

Node.js >=22.12.0. Use React >=18, React DOM >=18 and React Router DOM >=6; or Vue >=3.5 and Vue Router >=4.0.16. Frameworks and routers are optional peers: install the stack you use and resolve the same dependency copies in the application and RP.

```sh
# React and React DOM already installed
npm install @jangts/router-plus react-router-dom

# Vue already installed
npm install @jangts/router-plus vue-router
```

## Configuration ownership

- `pages` describes destinations. `PageDefinition.states` can describe address state before its native source mounts.
- `useRp*` creates native sources; `useReactState` / `useVueState` registers existing sources. The final ID/options argument is optional. An ID exposes access without automatically storing native state in history.
- `query` declares address synchronization. Retaining components and DOM requires both page `retain` and a framework rendering host.

Tabs, panel visibility and form fields all use ordinary native state. Business validation, authorization, data loading and submission remain application responsibilities.
