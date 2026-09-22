export const BEGIN_JUST_COMPLETED_EVENT = 'vf-begin-complete'
export const BEGIN_JUST_COMPLETED_KEY = 'vf-begin-just-completed'
export const BEGIN_CELEBRATED_KEY = 'vf-begin-celebrated'

export function signalBeginComplete() {
  try {
    if (localStorage.getItem(BEGIN_CELEBRATED_KEY)) return
    sessionStorage.setItem(BEGIN_JUST_COMPLETED_KEY, '1')
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(BEGIN_JUST_COMPLETED_EVENT))
}

export function hasPendingBeginComplete() {
  try {
    return sessionStorage.getItem(BEGIN_JUST_COMPLETED_KEY) === '1'
  } catch {
    return false
  }
}

export function consumeBeginComplete() {
  try {
    sessionStorage.removeItem(BEGIN_JUST_COMPLETED_KEY)
  } catch {
    // ignore
  }
}

export function markBeginCelebrated() {
  try {
    localStorage.setItem(BEGIN_CELEBRATED_KEY, '1')
  } catch {
    // ignore
  }
}
