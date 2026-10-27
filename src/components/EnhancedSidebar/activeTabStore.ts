import { ACTIVE_TAB_KEY } from './constants.js'

/**
 * Per-browser-tab active tab for `storage: 'session'`, read through `useSyncExternalStore`.
 * `sessionStorage` has no same-tab change event, so writes go through `writeSessionTab`,
 * which notifies subscribers itself.
 */
const listeners = new Set<() => void>()

export const subscribeSessionTab = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Throws in private mode / with storage blocked — treated as "nothing stored". */
export const readSessionTab = (): null | string => {
  try {
    return window.sessionStorage.getItem(ACTIVE_TAB_KEY)
  } catch {
    return null
  }
}

export const writeSessionTab = (tabId: string) => {
  try {
    window.sessionStorage.setItem(ACTIVE_TAB_KEY, tabId)
  } catch {
    // Write failed (blocked or full) — drop the old value so it doesn't win over the
    // caller's React state, which still switches the tab
    try {
      window.sessionStorage.removeItem(ACTIVE_TAB_KEY)
    } catch {
      // Fully blocked — nothing is read back either
    }
  }
  listeners.forEach((listener) => listener())
}

export const setTabCookie = (tabId: string) => {
  document.cookie = `${ACTIVE_TAB_KEY}=${tabId}; path=/; max-age=31536000; SameSite=Lax`
}

/** JSON is valid JS; `<` is escaped so a value can't close the `<script>` early. */
const toScriptLiteral = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')

/**
 * Runs as the first child of the sidebar root, before the panels are parsed, and sets
 * `data-active-tab` from `sessionStorage` — so CSS shows the right panel before hydration.
 */
export const buildSessionTabScript = (tabIds: string[], serverTabId: string) =>
  `(function(r,k,ids,v){try{var s=sessionStorage.getItem(k);if(s&&ids.indexOf(s)>-1)v=s}catch(e){}r.setAttribute('data-active-tab',v)})(document.currentScript.parentElement,${toScriptLiteral(ACTIVE_TAB_KEY)},${toScriptLiteral(tabIds)},${toScriptLiteral(serverTabId)})`

const toCssString = (value: string) => JSON.stringify(value).replace(/</g, '\\3c ')

/**
 * Panel visibility for `storage: 'session'`, keyed off the root's `data-active-tab` rather
 * than inline styles from React state — the attribute is right before hydration, state isn't.
 */
export const buildSessionTabStyles = (tabIds: string[], tabViewIds: string[]) => {
  const root = '.enhanced-sidebar'
  const rules = [
    `${root} [data-tab-panel],${root} [data-tab-view]{display:none}`,
    `${root} [data-tab-default-nav]{display:contents}`,
  ]
  for (const id of tabIds) {
    const active = `${root}[data-active-tab=${toCssString(id)}]`
    rules.push(`${active} [data-tab-panel=${toCssString(id)}]{display:block}`)
  }
  for (const id of tabViewIds) {
    const active = `${root}[data-active-tab=${toCssString(id)}]`
    rules.push(`${active} [data-tab-view=${toCssString(id)}]{display:contents}`)
    rules.push(`${active} [data-tab-default-nav]{display:none}`)
  }
  return rules.join('\n')
}
