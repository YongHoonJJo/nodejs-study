### 웹소켓을 이용한 실시간 데이터 전송 



##### 패키지 설치

```
> npm init -y
> npm i connect-flash cookie-parser dotenv express express-session morgan pug ws
> npm i -D nodemon
```

<br>

#### Socket.IO 

Socket.IO 는 ws 을 활용한 라이브러리.

<br>

##### 패키지 설치

```
> npm i socket.io
```

```js
/*** socket.js ***/
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
```

socket.io 패키지를 불러봐 익스프레스 서버와 연결, 옵션은 클라이언트와 연결할 수 있는 경로를 의미.

io 에 이벤트 리스너 등록. 

connection 은 클라이언트가 접속했을 때 발생.

socket.request 객체를 통해 요청 객체에 접근할 수 있다.

socket.request.res 로는 응답 객체에 접근 가능.

socket.id 는 소켓 고유의 아이디를 가져올 수 있다. (이 소켓의 주인을 식별)

<br>

socket 에도 이벤트 리스너 등록

disconnect 는 클라이언트가 연결을 끊었을 때 발생

error 는 통신 과정 중 에러가 발생했을 때 발생.

reply 는 커스텀 이벤트로 클라이언트에서 reply 이벤트명으로 데이터를 보낼 때 서버에서 수신하게 된다.

socket.emit() 메서드는 첫번째 인자로 이벤트 이름을, 두번째 인자로 데이터를 입력받는다. 즉, 위의 코드는 클라이언트에게 news 라는 이벤트 이름으로 Hello Socket.IO 라는 데이터를 클라이언트에게 보내는 것. 이에 대응하는 클라이언트의 코드는 아래와 같다.

<br>

##### 클라이언트 코드 일부

```js
<script src=”/socket.io/socket.io.js”></script>

var socket = io.connect('http://localhost:8005', {
  path: '/socket.io',
  // transports: ['websocket'] 
});
socket.on('news', function (data) {
  console.log(data);
  socket.emit('reply', 'Hello Node.JS');
});
```

첫번재 줄은 Socket.IO에서 클라인트로 제공하는 스크립트이다.

ws 과는 달리 http 프로토콜을 사용하는데, 이는 Socket.IO는 폴링 방식으로 서버와 연결하기 때문이다. 폴링 연결 후, 웹 소켓을 사용할 수 있으면 웹 소켓으로 업그레이드 한다고 한다.

path 옵션은 서버의 path 옵션과 동일해야 통신이 가능하다.

transports: ['websocket']  옵션을 추가하면, 처음부터 웹 소켓만 사용하게 된다.

news 라는 이벤트를 등록한 상태이며, 마찬가지로 emit() 메서드를 통해 서버에게 응답할 수 있다.

<br>

#### 실시간 GIF 채팅방

##### 패키지 설치

```
> npm i mongoose multer axios color-hash
```

> multer, axios : 이미지를 업로드하고 서버에 HTTP 요청을 하기 위한 용도.
>
> color-hash : 랜덤 색상을 구현해주는 모듈

<br>

##### 스키마 생성

```
schemas/room.js
schemas/chat.js
schemas/index.js
```

```js
/*** schemas/chat.js ***/

const { Schema } = mongoose
const { Types: { ObjectId } } = Schema
const chatSchema = new Schema({
  room: {
    type: ObjectId,
    required: true,
    ref: 'Room'
  },
  //...
})
```

> room 필드는 Room 스키마와 연결하여 Room 컬렉션의 ObjectId 가 들어가게 된다.

<br>

##### 서버의 socket.js 에 웹 소켓 이벤트를 연결

```js
/*** socket.js ***/
const SocketIO = require('socket.io')
const axios = require('axios')

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: '/socket.io' })
  app.set('io', io)
  const room = io.of('/room')
  const chat = io.of('/chat')
  io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res, next)
  })
  
  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속')
    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제')
    })
  })

  chat.on('connection', (socket) => {
    console.log('chat 네임스페이스에 접속')
    const req = socket.request
    const { headers: { referer } } = req
    const roomId = referer.split('/')[referer.split('/').length - 1].replace(/\?.+/, '')
    socket.join(roomId)

    socket.to(rookId).emit('join', {
      user: 'system',
      chat: `${req.session.color} 님 입장!!`
    })

    socket.on('disconnect', () => {
      console.log('chat 네임스페이스 접속 해제')
      socket.leave(roomId)

      const currentRoom = socket.adapter.rooms[roomId]
      const userCount = currentRoom ? currentRoom.length : 0
      if(userCount === 0) {
        axios.delete(`http://localhost:8005/room/${roomId}`)
          .then(() => {
            console.log('방 제거 요청 성공')
          })
          .catch((error) => {
            console.error(error)
          })
      } else {
        socket.to(rookId).emit('exit', {
          user: 'system',
          chat: `${req.session.color} 님 퇴장`
        })
      }
    })
  })
}
```

> `app.set('io', io)` 은 라우터에서 io 객체를 사용할 수 있게 저장. `req.app.get('io')` 로 접근 가능.
>
> `const room = io.of('/room')` 는 Socket.IO에 네임스페이스를 부여하는 메서드로, 같은 네임스페이스끼리만 데이터를 전달한다. /room 은 채팅방 생성 및 삭제에 관한 정보를, /chat 은 채팅 메세지를 전달.
>
> 네임스페이스마다 각각 이벤트 리스너를 등록할 수 있다.
>
> Socket.IO 에는 namespace 보다 더 세부적인 개념으로 room 이란 것이 존재해서, 같은 namespace 안에서도 같은 room 에 있는 소켓끼리만 데이터를 주고받을 수 있다. join() 과 leave() 메서드는 room 의 아이디를 인자로 받으며, socket.request.headers.referer 를 통해 현재 웹 페이지의 URL 및 방 아이디를 가져올 수 있다.
>
> io.use() 메서드를 통해 미들웨어를 등록할 수 있으며, 모든 웹 소켓 연결시마다 실행된다.
>
> socket.to(roomId) 는 roomId 에 해당하는 room 에 데이터를 보낸다.
>
> 현재 방의 참여자 수가 0명이면 방을 제거하는 HTTP 요청을 보낸다. socket.adapter.rooms[roomId] 에는 참여중인 소켓 정보가 들어있다. 

<br>

##### 라우터 일부 코드 분석

```js
/*** routes/index.js ***/

router.post('/room', async (req, res, next) => {
  const { title, max, password } = req.body
  try {
    const room = new Room({
      title, max, password,
      owner: req.session.color 
    })

    const newRoom = await room.save()
    const io = req.app.get('io')
    io.of('/room').emit('newRoom', newRoom) 
    res.redirect(`/room/${newRoom._id}?password=${password}`)
  } catch (error) {
    console.error(error)
    next(error)
  }
})
```

> `io.of('/room').emit('newRoom', newRoom)` 는  /room namespace 에 연결한 모든 클라이언트에게 데이터를 보내는 메서드. 네임스페이스가 따로 없는 경우 io.emit() 메서드로 모든 클라이언트에게 데이터를 보낼 수 있다.

<br>

```js
router.get('/room/:id', async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id})
    const io = req.app.get('io')
    if(!room) {
      req.flash('roomError', '존재하지 않는 방')
    }

    if(room.password && room.password !== req.query.password) {
      req.flash('roomError', '비밀번호가 틀렸습니다.')
      return res.redirect('/')
    }

    const { rooms } = io.of('/chat').adapter
    if(rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
      req.flash('roomError', '허용 인원 초과')
      return res.redirect('/')
    }

    //...
  }
})
```

> `io.of('/chat').adapter.rooms` 에는 방 목록이 들어있다.





#### Reference

<https://github.com/ZeroCho/nodejs-book/tree/master/ch11>