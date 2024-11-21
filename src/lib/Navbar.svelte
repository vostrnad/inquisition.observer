<script lang="ts">
  import { Navbar, NavbarBrand } from '@sveltestrap/sveltestrap'
  import { invalidateAll } from '$app/navigation'
</script>

<Navbar color="body-tertiary" container expand="md" class="shadow-sm">
  <NavbarBrand
    href="/"
    on:click={() => {
      void invalidateAll()
    }}>inquisition.observer</NavbarBrand
  >
</Navbar>
