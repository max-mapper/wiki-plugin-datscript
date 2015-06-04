var websocket = require('websocket-stream')
var ndjson = require('ndjson')
var pump = require('pump')
var duplexify = require('duplexify')

module.exports = {
  startServer: function (params) {
    var wss = websocket.createServer({server: params.server, path: '/plugin/datscript'}, handle)
    
    function handle (socket) {
      var parse = ndjson.parse()
      var serialize = ndjson.serialize()
      pump(socket, parse)
      pump(serialize, socket)
      
      var duplex = duplexify.obj(serialize, parse)
      duplex.on('data', function (obj) {
        console.log('got data', obj)
        obj.hello = 'from server'
        duplex.write(obj)
      })
    }
    
  }
}