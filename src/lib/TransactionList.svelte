<script lang="ts">
  import { FormGroup, Input } from '@sveltestrap/sveltestrap'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { delay } from '$lib/utils/async'
  import ListPagination from './ListPagination.svelte'
  import Transaction from './Transaction.svelte'
  import type { SerializedTransaction } from './types'

  interface PageResponse {
    results: SerializedTransaction[]
    total: number
  }

  let data: PageResponse | undefined = $state()
  let loading = $state(true)

  const fetchPage = async (
    newPageNumber: number,
    newFilter: string | undefined,
  ) => {
    const url = new URL(`/api/latest/${newPageNumber - 1}`, page.url.origin)

    if (newFilter) {
      url.searchParams.set('type', newFilter)
    }

    loading = true

    data = await delay(
      300,
      fetch(url).then(async (res) => res.json() as Promise<PageResponse>),
    )

    loading = false
  }

  const pageNumber = $derived(Number(page.url.searchParams.get('page') ?? 1))
  const filter = $derived(page.url.searchParams.get('type') ?? '')

  $effect(() => {
    void fetchPage(pageNumber, filter)
  })
</script>

<div>
  <h3>Most recent transactions</h3>

  <FormGroup>
    <Input
      type="select"
      class="w-auto"
      value={filter}
      on:change={(e) => {
        const query = new SvelteURLSearchParams(page.url.search)
        if (e.currentTarget.value) {
          query.set('type', e.currentTarget.value)
        } else {
          query.delete('type')
        }
        query.delete('page')
        // eslint-disable-next-line svelte/no-navigation-without-resolve
        void goto(`?${query.toString()}`)
      }}
    >
      <option value="">All</option>
      <option value="apo">SIGHASH_ANYPREVOUT</option>
      <option value="ctv">OP_CHECKTEMPLATEVERIFY</option>
      <option value="cat">OP_CAT</option>
      <option value="csfs">OP_CHECKSIGFROMSTACK</option>
      <option value="ikey">OP_INTERNALKEY</option>
    </Input>
  </FormGroup>

  {#if !data && loading}
    <div class="d-flex justify-content-center">
      <div class="spinner-border text-secondary m-4" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  {/if}

  <div
    class="children-mb-3"
    style:transition="opacity 0.5s"
    style:opacity={loading ? '0.2' : '1'}
    style:pointer-events={loading ? 'none' : 'initial'}
  >
    {#if data}
      {#each data.results as tx (tx.txid)}
        <Transaction {...tx} />
      {/each}

      <ListPagination {pageNumber} pageSize={20} total={data.total} />
    {/if}
  </div>
</div>
