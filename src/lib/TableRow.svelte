<script lang="ts">
  import { Col, Row } from '@sveltestrap/sveltestrap'
  import type { Snippet } from 'svelte'

  const { title, children }: { title: string; children: Snippet } = $props()
</script>

<Row>
  <Col xs={6} md={5} lg={4} xl={3}>{title}:</Col>
  <Col>{@render children()}</Col>
</Row>
