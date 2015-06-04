# build time tests for datscript plugin
# see http://mochajs.org/

datscript = require '../client/datscript'
expect = require 'expect.js'

describe 'datscript plugin', ->

  describe 'expand', ->

    it 'can make itallic', ->
      result = datscript.expand 'hello *world*'
      expect(result).to.be 'hello <i>world</i>'
