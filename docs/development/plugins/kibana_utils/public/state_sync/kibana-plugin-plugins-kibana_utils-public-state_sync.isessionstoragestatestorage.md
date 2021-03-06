<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [kibana-plugin-plugins-kibana\_utils-public-state\_sync](./kibana-plugin-plugins-kibana_utils-public-state_sync.md) &gt; [ISessionStorageStateStorage](./kibana-plugin-plugins-kibana_utils-public-state_sync.isessionstoragestatestorage.md)

## ISessionStorageStateStorage interface

[IStateStorage](./kibana-plugin-plugins-kibana_utils-public-state_sync.istatestorage.md) for storing state in browser  [guide](https://github.com/elastic/kibana/blob/master/src/plugins/kibana_utils/docs/state_sync/storages/session_storage.md)

<b>Signature:</b>

```typescript
export interface ISessionStorageStateStorage extends IStateStorage 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [get](./kibana-plugin-plugins-kibana_utils-public-state_sync.isessionstoragestatestorage.get.md) | <code>&lt;State = unknown&gt;(key: string) =&gt; State &#124; null</code> |  |
|  [set](./kibana-plugin-plugins-kibana_utils-public-state_sync.isessionstoragestatestorage.set.md) | <code>&lt;State&gt;(key: string, state: State) =&gt; void</code> |  |

