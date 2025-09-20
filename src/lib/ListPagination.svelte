<script lang="ts">
  import {
    Pagination,
    PaginationItem,
    PaginationLink,
  } from '@sveltestrap/sveltestrap'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'

  const {
    pageNumber,
    pageSize,
    total,
    href = '',
  }: {
    pageNumber: number
    pageSize: number
    total: number
    href?: string
  } = $props()

  const totalPages = $derived(Math.ceil(total / pageSize))

  const buttons = $derived(
    totalPages <= 6
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : pageNumber <= 3
        ? [1, 2, 3, 4, null]
        : pageNumber >= totalPages - 2
          ? [null, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
          : [null, pageNumber - 1, pageNumber, pageNumber + 1, null],
  )

  const setPage = (num: number | null) => {
    if (num === null) return
    const query = new SvelteURLSearchParams(page.url.search)
    query.set('page', num.toString())
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    void goto(`?${query.toString()}`)
  }
</script>

<Pagination class="my-2" listClassName="justify-content-center mb-0">
  <PaginationItem disabled={pageNumber <= 1}>
    <PaginationLink {href} first on:click={() => setPage(1)} />
  </PaginationItem>
  <PaginationItem disabled={pageNumber <= 1}>
    <PaginationLink {href} previous on:click={() => setPage(pageNumber - 1)} />
  </PaginationItem>
  <!-- eslint-disable-next-line svelte/require-each-key -->
  {#each buttons as button}
    <PaginationItem disabled={button === null} active={button === pageNumber}>
      <PaginationLink {href} on:click={() => setPage(button)}
        >{button === null ? '...' : button}</PaginationLink
      >
    </PaginationItem>
  {/each}
  <PaginationItem disabled={pageNumber >= totalPages}>
    <PaginationLink {href} next on:click={() => setPage(pageNumber + 1)} />
  </PaginationItem>
  <PaginationItem disabled={pageNumber >= totalPages}>
    <PaginationLink {href} last on:click={() => setPage(totalPages)} />
  </PaginationItem>
</Pagination>
