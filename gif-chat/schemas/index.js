const mongoose = require('mongoose')

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV } = process.env
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@localhost:27017/admin`

module.exports = () => {
  const connect = () => {
    if(NODE_ENV !== 'production') {
      mongoose.set('debug', true)
    }

    mongoose.connect(MONGO_URL, {
      dbName: 'gifchat'
    }, (error) => {
      if(error) {
        console.log('Connection Error ', error)
      } else {
        console.log('MongoDB Connected')
      }
    })
  }
  connect()

  mongoose.connection.on('error', (error) => {
    console.error('connect Error', error)
  })

  mongoose.connection.on('disconnected', () => {
    console.log('disconnected. connect again')
    // connect()
  })

  require('./chat') // chat 스키마와 room 스키마를 연결
  require('./room') // chat 스키마와 room 스키마를 연결
}