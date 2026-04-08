import { ref, onUnmounted, type Ref } from 'vue';

export interface UseDropdownOptions {
  /** Delay in ms before closing after selection. Default: 300 */
  closeDelay?: number;
  /** Enable click-outside handling. Default: false */
  clickOutside?: boolean;
}

/**
 * Reusable composable for dropdown open/close logic.
 *
 * Provides:
 * - `isOpen` ref controlling visibility
 * - `open()`, `close()`, `toggle()` helpers
 * - `selectAndClose(callback)` that runs a callback then closes after a delay
 * - `onClickOutside(elementRef)` setup with automatic cleanup on unmount
 */
export function useDropdown(options: UseDropdownOptions = {}) {
  const { closeDelay = 300, clickOutside = false } = options;

  const isOpen = ref(false);

  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  function open() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    isOpen.value = true;
  }

  function close() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    isOpen.value = false;
  }

  function toggle() {
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  }

  /**
   * Run a callback (typically emitting a selection) then schedule a delayed close.
   * Cancels any previously pending close timer.
   */
  function selectAndClose(callback: () => void) {
    callback();
    if (closeTimer) {
      clearTimeout(closeTimer);
    }
    closeTimer = setTimeout(() => {
      isOpen.value = false;
      closeTimer = null;
    }, closeDelay);
  }

  /**
   * Sets up a click-outside listener on the given element ref.
   * Automatically removes the listener when the component unmounts.
   */
  function onClickOutside(elementRef: Ref<HTMLElement | null>) {
    if (!clickOutside) return;

    function handler(event: MouseEvent) {
      const el = elementRef.value;
      if (el && !el.contains(event.target as Node)) {
        close();
      }
    }

    document.addEventListener('click', handler);
    onUnmounted(() => {
      document.removeEventListener('click', handler);
    });
  }

  return {
    isOpen,
    open,
    close,
    toggle,
    selectAndClose,
    onClickOutside,
  };
}
