var websocket = require('websocket-stream')
var ndjson = require('ndjson')
var pump = require('pump')

module.exports = {
  startServer: function (params) {
    var wss = websocket.createServer({server: params.server, path: '/plugin/datscript'}, handle)
    
    function handle(socket) {
      socket.pipe(process.stdout)
      var jsonParser = ndjson.parse()
      var jsonSocket = pump(socket, jsonParser)
      jsonSocket.on('data', function (obj) {
        console.log(obj)
      })
    }
    
  }
}