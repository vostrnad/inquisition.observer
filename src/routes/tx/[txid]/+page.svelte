<script lang="ts">
  import Transaction from '$lib/Transaction.svelte'
  import type { PageData } from './$types'

  const { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>Transaction {data.txid} - inquisition.observer</title>
</svelte:head>

{#if 'error' in data}
  {#if data.error === 404}
    Transaction not found
  {:else if data.error === 400}
    Invalid TXID
  {:else}
    Unexpected error
  {/if}
{:else}
  <Transaction {...data} />
{/if}
