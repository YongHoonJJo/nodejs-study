### 웹소켓을 이용한 실시간 데이터 전송 



##### 패키지 설치

```
> npm init -y
> npm i connect-flash cookie-parser dotenv express express-session morgan pug
> npm i -D nodemon
```

<br>

##### ws 모듈 설치

```
> npm i ws
```

```js
/*** app.js ***/
//...
const webSocket = require('./socket')

//...
const server = app.listen(PORT, () => { ... })

webSocket(server)
```

> 웹 소켓을 익스프레스 서버에 연결

<br>

##### socket.js 코드 분석

```js
/*** socket.js ***/
const WebSocket = require('ws')

module.exports = (server) => {
  const wss = new WebSocket.Server({ server })

  wss.on('connection', (ws, req) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    console.log('Connected new Client : ', ip)
    
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
```

<br>

ws 모듈을 불러온 후 익스프레스 서버를 웹소켓 서버와 연결.

익스프레스(HTTP)와 웹 소켓(WS)는 같은 포트를 공유할 수 있기 때문에 별도의 작업이 필요하지 않다.

연결 후에는 웹 소켓 서버(wss)에 이벤트 리스너를 등록한다.

connection 이벤트는 클라이언트가 서버와 웹 소켓을 연결할 때 발생.

<br>

익스프레스 서버와 연결한 후, 웹 소켓 객체에 이벤트 리스너를 연결한다.

message는 클라이언트로부터 메세지가 왔을 때 발생.

error는 웹 소켓 연결 중 문제가 생겼을 때 발생.

close 는 클라이언트와 연결이 끊겼을 때 발생.

<br>

setInterval 은 3초마다 모든 클라이언트에게 메세지를 보내는 역할.

웹 소켓에는 CONNECTING, OPEN, CLOSING, CLOSED 의 상태가 있는데, OPEN 일 때만 메세지를 보낼 수 있으며, close 이벤트에서 setInterval을 clearInterval 로 정리한다고 한다. 

<br>

클라이언트의 IP를 확인하는 방법 중 하나

```js
const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
```

> 익스프레스에서 IP를 확인할 때, proxy-addr 패키지를 사용하기 때문에, 이 패키지를 직접 사용해도 된다고 함.
>
> 크롬에서 로컬 호스트로 접속한 경우, IP가 ::1 로 뜬다.

<br>

##### 클라이언트 코드 일부

```js
var webSocket = new WebSocket("ws://localhost:8005");
webSocket.onopen = function () {
  console.log('서버와 웹소켓 연결 성공!');
}
webSocket.onmessage = function (event) {
  console.log(event.data);
  webSocket.send('클라이언트에서 서버로 답장을 보냅니다');
}
```

> 서버 연결 성공 시 onopen 이벤트 리스너가 호출된다.
>
> 서버로부터 메세지가 오는 경우, onmessage 이벤트 리스너가 호출된다.