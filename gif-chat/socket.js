const SocketIO = require('socket.io')

module.exports = (server) => {
  const io = SocketIO(server, { path: '/socket.io'})

  io.on('connection', (socket) => {
    const req = socket.request
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    console.log('Connected : ', ip, socket.id, req.ip)

    socket.on('disconnect', () => {
      console.log('Disconnected : ', ip, socket.id)
      clearInterval(socket.interval)
    })

    socket.on('error', (error) => {
      console.error(error)
    })

    socket.on('reply', (data) => {
      console.log({data})
    })

    socket.interval = setInterval(() => {
      socket.emit('news', 'Hello Socket.IO')
    }, 3000)
  })
}