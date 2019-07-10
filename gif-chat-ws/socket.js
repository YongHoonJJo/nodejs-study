const WebSocket = require('ws')

module.exports = (server) => {
  const wss = new WebSocket.Server({ server })

  wss.on('connection', (ws, req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    console.log('Connected new Client : ', ip)
    
    ws.on('message', (message) => {
      console.log({message})
    })

    ws.on('error', (error) => {
      console.error(error)
    })
    ws.on('close', () => {
      console.log('Disconnected : ', ip)
    })

    const interval = setInterval(() => {
      if(ws.readyState === ws.OPEN) {
        ws.send('send Msg from server to client.')
      }
    }, 3000)
    ws.interval = interval
  })
}