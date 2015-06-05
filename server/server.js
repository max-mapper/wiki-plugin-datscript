var websocket = require('websocket-stream')
var ndjson = require('ndjson')
var pump = require('pump')
var duplexify = require('duplexify')
var gasket = require('gasket')
var through = require('through2')

var sockets = []
var jobs = {}

module.exports = {
  startServer: function (params) {
    var wss = websocket.createServer({server: params.server, path: '/plugin/datscript'}, handle)
    
    function handle (socket) {
      var parse = ndjson.parse()
      var serialize = ndjson.serialize()
      pump(socket, parse) 
      pump(serialize, socket)
      
      var duplex = duplexify.obj(serialize, parse)
      
      sockets.push(duplex)
      
      duplex.on('data', function (obj) {
        console.error('got data from client', JSON.stringify(obj))
        // if (jobs[obj.id] && obj.gasket)
        //   return duplex.write({error: true, id: obj.id, message: 'Job already running'})
        //
        var pipelines = gasket(obj.gasket)
        var stringifier = through.obj(function (buff, enc, next) {
          console.error('pipeline debug', buff.toString())
          next(null, {output: buff.toString()})
        })
        try {
          pipelines.run('main').pipe(stringifier).pipe(duplex, {end: false})
        } catch (e) {
          console.error('pipeline failure', e)
          duplex.write({error: e.message})
        }
      })
    }
    
  }
}