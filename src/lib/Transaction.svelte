<script lang="ts" module>
  const formatDate = (date: Date) => {
    const year = date.getUTCFullYear()
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = date.getUTCDate().toString().padStart(2, '0')
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }
</script>

<script lang="ts">
  import {
    Button,
    Container,
    ListGroup,
    ListGroupItem,
  } from '@sveltestrap/sveltestrap'
  import { resolve } from '$app/paths'
  import TableRow from './TableRow.svelte'
  import TransactionInput from './TransactionInput.svelte'
  import type { SerializedTransaction } from './types'

  const { txid, vsize, block, inputs }: SerializedTransaction = $props()

  let showAllInputs = $state(inputs.length < 12)
</script>

<Container class="shadow-sm border rounded p-3">
  <h5 style="display: flex;">
    <a
      href={resolve(`/tx/${txid}`)}
      class="text-decoration-none text-body ellipsis">Transaction {txid}</a
    >
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <a
      class="ps-2"
      href={`https://mempool.space/signet/tx/${txid}`}
      target="_blank"
      rel="noreferrer"
      style="display: flex; align-items: center;"
      title="Open in mempool.space"
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-box-arrow-up-right"
        viewBox="0 0 16 16"
      >
        <path
          fill-rule="evenodd"
          d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"
        />
        <path
          fill-rule="evenodd"
          d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"
        />
      </svg></a
    >
  </h5>

  <Container class="p-0 my-2">
    <TableRow title="Timestamp"
      >{formatDate(new Date(block.time * 1000))} UTC</TableRow
    >
    <TableRow title="Included in block">{block.height}</TableRow>
    <TableRow title="Virtual size"
      >{Intl.NumberFormat('en').format(vsize)}
      <span class="text-muted text-small">vB</span>
    </TableRow>
  </Container>

  <ListGroup class="mt-2">
    {#each showAllInputs ? inputs : inputs.slice(0, 8) as input (input.inputIndex)}
      {#if typeof input.scriptAsm === 'string'}
        <ListGroupItem><TransactionInput {...input} /></ListGroupItem>
      {:else}
        <ListGroupItem color="secondary" class="ellipsis"
          >{input.address}</ListGroupItem
        >
      {/if}
    {/each}
  </ListGroup>
  {#if !showAllInputs}
    <Button
      color="primary"
      class="mt-2"
      outline
      on:click={() => {
        showAllInputs = true
      }}>Show all {inputs.length} inputs</Button
    >
  {/if}
</Container>
