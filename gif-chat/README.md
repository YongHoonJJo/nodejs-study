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





#### Reference

<https://github.com/ZeroCho/nodejs-book/tree/master/ch11>