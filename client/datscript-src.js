var hackfile = require('hackfile')
var datscript = require('datscript')
var websocket = require('websocket-stream')
var ndjson = require('ndjson')
var pump = require('pump')
var duplexify = require('duplexify')

var latestScript, currentElement, response = []

var socket = websocket('ws://' + window.location.host + '/plugin/datscript')
var serialize = ndjson.serialize()
var parse = ndjson.parse()

socket.on('error', function (e) {
  console.log('socket error', e)
})

socket.on('finish', function (e) {
  showError('Error: Datscript connection lost')
})

pump(serialize, socket)
pump(socket, parse)

var duplex = duplexify.obj(serialize, parse)

duplex.on('data', function (obj) {
  try {
    obj.output.split('\n').forEach(function (line) {
      if (!line.length) return
      response.push(JSON.parse(line))
    })
  } catch (e) {
    console.error('could not split data')
  }
  console.log('got response', obj, response)
  var output = currentElement.find('.output-container p')
  if (!output.length) {
    output = $('<p style="white-space: pre; border: 1px solid #ddd; padding: 5px; background-color: #fafafa; font-size: 13px; overflow: auto;"></p>')
    currentElement.find('.output-container').html(output)
  }
  currentElement.find('.output-container p').append(obj.output)
})

window.duplex = duplex

function expand (text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function showError (text) {
  currentElement.find('.caption').text(text)
}

function emit ($item, item) {
  currentElement = $item
  window.currentElement = currentElement
  var output
  var id = $item.parents('.page').attr('id') + ':' + item.id
  try {
    output = item.text
    var parsed = datscript(item.text)

    // HACK to change the datscript output to work with current gasket
    var datscriptFixed = {}
    var pipeline1 = Object.keys(parsed.gasket[0])[0]
    datscriptFixed[pipeline1.slice(9)] = parsed.gasket[0][pipeline1]
    // END HACK
    
    latestScript = datscriptFixed
    console.log('writing to socket', datscriptFixed)
    response = []
    duplex.write({id: id, gasket: datscriptFixed})
    currentElement.find('.output').text("")
  } catch (e) {
    output = expand(item.text)
    output += '\n\n<span style="background-color:#e6d6d6;">' + e.message + '</span>'
  }
  $item.append("<div style=\"background-color:#eee;padding:15px;\"><pre style=\"word-wrap: break-word;\">" + output + "</pre><p class=\"caption\"></p><p class=\"output-container\"></p></div>")
}

function bind ($item, item) {
  $item.addClass('sequence-source')
  $item.get(0).getSequenceData = function () {
    return response
  }
  return $item.dblclick(function(e) {
    if (e.shiftKey) {
      var rawScript = '<pre style=\"background-color:#eee;padding:15px;\">'
      rawScript += JSON.stringify(latestScript, null, '  ')
      rawScript += '</pre>'
      wiki.dialog('Parsed Datscript', rawScript)
      return
    }
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
