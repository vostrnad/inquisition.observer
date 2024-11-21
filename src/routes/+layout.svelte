<script lang="ts">
  import { Container } from '@sveltestrap/sveltestrap'
  import Navbar from '$lib/Navbar.svelte'
</script>

<svelte:head>
  {#if import.meta.env.VITE_UMAMI_ENABLED}
    <script
      defer
      src="https://umami.vstr.cz/script.js"
      data-website-id="9d63ffd5-b6b9-47a9-bc7d-f1bf9d48eda8"
    ></script>{/if}
</svelte:head>

<div class="min-vh-100 d-flex flex-column">
  <Navbar />

  <Container class="flex-grow-1 shadow-sm p-3">
    <slot />
  </Container>

  <footer class="p-3 bg-body-tertiary text-muted text-center">
    <a
      target="_blank"
      rel="noreferrer"
      href="https://github.com/vostrnad/inquisition.observer"
      class="text-decoration-none d-flex justify-content-center"
    >
      <picture class="d-flex">
        <source
          srcset="/github-mark.svg"
          media="(prefers-color-scheme: light)"
        />
        <source
          srcset="/github-mark-white.svg"
          media="(prefers-color-scheme: dark)"
        />
        <img alt="GitHub" style="width: 24px;" src="/github-mark.svg" />
      </picture>
      <span
        class="text-decoration-underline text-body ms-2"
        style="margin-top: -2px;">inquisition.observer on GitHub</span
      >
    </a>
  </footer>
</div>

<style>
  :global(body) {
    overflow-y: scroll;
  }

  :global(.ellipsis) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.text-small) {
    font-size: 0.85rem;
  }

  :global(.children-mb-3 > *) {
    margin-bottom: 1rem !important;
  }

  :global(.children-mb-3 > :last-child) {
    margin-bottom: 0 !important;
  }

  :global(h1) {
    margin-bottom: 1rem;
  }

  :global(code) {
    padding-inline: 1px;
  }

  :global(.badge) {
    --bs-badge-border-radius: 0.25rem;
  }

  :global(.pagination) {
    --bs-pagination-disabled-bg: var(--bs-pagination-bg);
    --bs-pagination-disabled-border-color: var(--bs-pagination-border-color);
  }
</style>
