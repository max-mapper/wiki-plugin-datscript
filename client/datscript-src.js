var hackfile = require('hackfile')
var websocket = require('websocket-stream')
var ndjson = require('ndjson')
var pump = require('pump')
var duplexify = require('duplexify')

var latestScript

var socket = websocket('ws://' + window.location.host + '/plugin/datscript')
var serialize = ndjson.serialize()
var parse = ndjson.parse()

pump(serialize, socket)
pump(socket, parse)

var duplex = duplexify.obj(serialize, parse)

window.duplex = duplex

function expand (text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function emit ($item, item) {
  var output
  try {
    var parsed = hackfile(item.text)
    output = item.text
    latestScript = parsed
    duplex.write(latestScript)
  } catch (e) {
    output = expand(item.text)
    output += '\n\n<span style="background-color:#e6d6d6;">' + e.message + '</span>'
  }
  return $item.append("<pre style=\"background-color:#eee;padding:15px;word-wrap: break-word;\">" + output + "</pre>")
}

function bind ($item, item) {
  return $item.dblclick(function() {
    return wiki.textEditor($item, item)
  })
}

if (typeof window !== "undefined" && window !== null) {
  window.plugins.datscript = {
    emit: emit,
    bind: bind
  }
}

if (typeof module !== "undefined" && module !== null) {
  module.exports = {
    expand: expand
  }
}
