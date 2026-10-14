const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]'
const dialogs: symbol[] = []
let previousOverflow = ''

/** Keep keyboard focus in the topmost dialog and restore its opening control. */
export function activateDialog(panel: HTMLElement, close: () => void): () => void {
  const id = Symbol('dialog')
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  if (dialogs.length === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  dialogs.push(id)
  const isTop = () => dialogs.at(-1) === id
  const controls = () => Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector))
    .filter(el => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert]')
      && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden')
  const focusFirst = () => (controls()[0] || panel).focus({ preventScroll: true })
  const onKeydown = (event: KeyboardEvent) => {
    if (!isTop() || event.defaultPrevented) return
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      const items = controls()
      const first = items[0]
      const last = items.at(-1)
      if (!first || !last) {
        event.preventDefault()
        panel.focus()
      } else if (!panel.contains(document.activeElement) || document.activeElement === panel) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }
  const onFocus = (event: FocusEvent) => {
    if (isTop() && !panel.contains(event.target as Node)) focusFirst()
  }
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('focusin', onFocus)
  focusFirst()

  let released = false
  return () => {
    if (released) return
    released = true
    const restoreFocus = isTop()
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('focusin', onFocus)
    dialogs.splice(dialogs.indexOf(id), 1)
    if (dialogs.length === 0) document.body.style.overflow = previousOverflow
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true })
  }
}
