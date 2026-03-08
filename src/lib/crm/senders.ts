export const CRM_SENDERS = [
  { id: 'vanessa', label: 'Vanessa Buckingham', email: 'vanessa@vibrationfit.com', from: '"Vanessa Buckingham" <vanessa@vibrationfit.com>' },
  { id: 'jordan', label: 'Jordan Buckingham', email: 'jordan@vibrationfit.com', from: '"Jordan Buckingham" <jordan@vibrationfit.com>' },
] as const

export type CrmSenderId = (typeof CRM_SENDERS)[number]['id']

export const DEFAULT_CRM_SENDER = CRM_SENDERS[0]

export function getSenderById(id: string) {
  return CRM_SENDERS.find((s) => s.id === id) ?? DEFAULT_CRM_SENDER
}
