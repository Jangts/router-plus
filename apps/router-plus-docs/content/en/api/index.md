# API Reference

Applies to **0.8.0**. Native sources own live values; page states describe address contracts.

Router Plus splits public entries by purpose. Core loads no React, Vue or DOM code; framework adapters, DOM interactions and store bridges load from separate subpaths.

| Entry | Content | Use case |
| --- | --- | --- |
| `@jangts/router-plus` | `createRouterPlus`, page contracts, commands, connections, plugins, core types | Framework-independent Core |
| `@jangts/router-plus/react` | Assembly, Provider, hooks, links, retained rendering, route generation, overlay | React applications |
| `@jangts/router-plus/vue` | Plugin, composables, links, retained views, route generation, overlay | Vue applications |
| `@jangts/router-plus/overlay` | DOM target runtime, default overlay, history bridge, styles | Browser interaction capabilities |
| `@jangts/router-plus/stores/{redux,zustand,jotai}` | Native creators and existing-store registration | Existing stores |
| `@jangts/router-plus/testing` | Memory connection, instance host, fake bridge | Isolated tests |

## Page index

- [Core API](/en/api/core): construction, target resolution, commands, debug facade and the default matcher;
- [Core types](/en/api/types): page definitions, receipts, connections, plugins and interaction contracts;
- [React entry](/en/api/react): assembly, hooks, components and route generation;
- [Vue entry](/en/api/vue): plugin, composables, components and route generation;
- [Overlay entry](/en/api/overlay): DOM runtime, default overlay and styles;
- [Store integration](/en/api/stores): Zustand, Redux Toolkit and Jotai;
- [Testing utilities](/en/api/testing): memory connection, host and fake bridge.

## Command results

`navigate`, `setState`, `callState`, `highlight` and other commands return `CommandResult`:

```ts
type CommandResult =
  | { ok: true; value?: unknown }
  | {
      ok: false;
      reason: CommandReason;
      message?: string;
      navigationId?: string;
      stage?: string;
      committed?: boolean;
    };
```

`reason` distinguishes failure causes:

| reason | Meaning |
| --- | --- |
| `invalid-target` / `unknown-page` / `invalid-param` / `invalid-tab` | Target, page or parameter cannot be resolved |
| `unsupported-scheme` / `unknown-action` | Link protocol or business action is not registered |
| `target-not-found` | Interaction target is absent from the active root |
| `state-readonly` / `state-unsupported` / `state-unknown` | State cannot be written, capability is missing or the key is unknown |
| `unsupported-command` / `not-connected` / `not-ready` | Command is unavailable or the connection is not ready |
| `blocked` / `cancelled` / `failed` / `timeout` / `superseded` / `noop` | Guard rejection, cancellation, failure, timeout, replacement or no change |

## Import examples

```ts
import { createRouterPlus, createPageLink } from '@jangts/router-plus';
import type { PageDefinition, PageContext, CommandResult } from '@jangts/router-plus';
import { createReactRouterPlus } from '@jangts/router-plus/react';
import { createVueRouterPlus } from '@jangts/router-plus/vue';
import { installDomRuntime } from '@jangts/router-plus/overlay';
import { registerZustandState } from '@jangts/router-plus/stores/zustand';
import { createMemoryConnection } from '@jangts/router-plus/testing';
```

Core `apiVersion` is the integer `1`; it is independent of package semver and only that version is accepted.

[Consumer testing: DOM-free, Vue and React batch fixtures](/en/guide/testing).
