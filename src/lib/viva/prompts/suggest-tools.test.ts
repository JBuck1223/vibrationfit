import assert from 'node:assert/strict'
import test from 'node:test'
import { isSuggestToolsRequest, SUGGEST_TOOLS_USER_MESSAGE } from './suggest-tools'

test('matches the Suggest tools button message', () => {
  assert.equal(isSuggestToolsRequest(SUGGEST_TOOLS_USER_MESSAGE), true)
})

test('matches nearby phrasing', () => {
  assert.equal(isSuggestToolsRequest('Suggest tools from this conversation'), true)
  assert.equal(isSuggestToolsRequest('What could we do from here?'), true)
})

test('does not treat ordinary coaching as a suggest-tools turn', () => {
  assert.equal(isSuggestToolsRequest('Can you help me make a journal entry on this'), false)
  assert.equal(isSuggestToolsRequest(''), false)
})
