import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'
import { activateDialog } from '@/utils/dialogAccessibility'

export function useDialogAccessibility(open: () => boolean, panel: Ref<HTMLElement | null>, close: () => void) {
  let release: (() => void) | undefined
  watch(open, async (visible, _, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
      release?.()
      release = undefined
    })
    if (!visible) return
    await nextTick()
    if (!cancelled && panel.value) release = activateDialog(panel.value, close)
  }, { immediate: true, flush: 'post' })
  onBeforeUnmount(() => release?.())
}
