<script lang="ts">
  import { Button, Container } from '@sveltestrap/sveltestrap'
  import type { SerializedTransactionInput } from './types'

  let {
    address,
    scriptAsm,
    hasApo,
    hasCtv,
    hasCat,
  }: SerializedTransactionInput = $props()

  let scriptLines = $derived(scriptAsm.split(/ (?=OP_)/))
  let showEntireScriptClicked = $state(false)
  let showEntireScript = $derived(
    showEntireScriptClicked || scriptLines.length <= 32,
  )
</script>

<Container class="p-0">
  <p class="mb-1 ellipsis">
    <span class="pe-4" class:text-muted={!address}
      >{address || '(non-standard output script)'}</span
    >
  </p>

  {#if hasApo}
    <span class="badge text-bg-success">SIGHASH_ANYPREVOUT</span>
  {/if}
  {#if hasCtv}
    <span class="badge text-bg-success">OP_CHECKTEMPLATEVERIFY</span>
  {/if}
  {#if hasCat}
    <span class="badge text-bg-success">OP_CAT</span>
  {/if}

  <p
    class="mt-2 mb-1"
    style="font-size: 0.75rem; font-family: Courier New, Courier, monospace; word-break: break-all;"
  >
    {#if scriptAsm.length === 0}
      {'<empty script>'}
    {:else if showEntireScript}
      {#each scriptLines as line}
        {line}
        <br />
      {/each}
    {:else}
      {#each scriptLines.slice(0, 20) as line}
        {line}
        <br />
      {/each}
    {/if}
  </p>
  {#if !showEntireScript}
    <Button
      color="primary"
      class="mb-1"
      outline
      on:click={() => {
        showEntireScriptClicked = true
      }}>Show all {scriptLines.length} lines</Button
    >
  {/if}
</Container>
