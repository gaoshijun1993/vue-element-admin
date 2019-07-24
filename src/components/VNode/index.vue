<script>
export default {
  name: 'VNode',
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  render() {
    return this.node
  }
}
</script>

