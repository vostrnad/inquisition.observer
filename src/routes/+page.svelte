<script lang="ts">
  import TransactionList from '$lib/TransactionList.svelte'
  import type { PageData } from './$types'

  const { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>inquisition.observer</title>
</svelte:head>

<h1>Bitcoin Inquisition Explorer</h1>

<p>
  Welcome to inquisition.observer! On this site, you'll find every transaction
  made on the Bitcoin signet that spends a UTXO created using one of the
  deployed soft forks.
</p>

<p class="mb-1">As of block {data.blocks} there are:</p>
<ul>
  <li>
    {data.apo} transactions that use <code>SIGHASH_ANYPREVOUT</code> (<code
      >APO</code
    >,
    <a
      target="_blank"
      rel="noreferrer"
      href="https://github.com/bitcoin/bips/blob/master/bip-0118.mediawiki"
      >BIP118</a
    >)
  </li>
  <li>
    {data.ctv} transactions that use <code>OP_CHECKTEMPLATEVERIFY</code> (<code
      >OP_CTV</code
    >,
    <a
      target="_blank"
      rel="noreferrer"
      href="https://github.com/bitcoin/bips/blob/master/bip-0119.mediawiki"
      >BIP119</a
    >)
  </li>
  <li>
    {data.cat} transactions that use <code>OP_CAT</code> (<a
      target="_blank"
      rel="noreferrer"
      href="https://github.com/bitcoin/bips/blob/master/bip-0347.mediawiki"
      >BIP347</a
    >)
  </li>
</ul>

<TransactionList />
