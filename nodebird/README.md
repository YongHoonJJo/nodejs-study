

#### <1> 프로젝트 구조 세팅

#### 프로젝트 구조

```
nodebird
    ├── package.json
    ├── app.js
    ├── config
    ├── migrations
    ├── models
    ├── node_modules
    ├── passport
    ├── public
    ├── routes
    ├── seeders
    └── views
```

<br>

#### 기본 패키지 설치

```
> npm init -y
> npm i -g sequelize-cli
> npm i sequelize mysql2
> sequelize init
```

> config, migrations, models, seeders 폴더가 생성된다.

<br>

```
> npm i express cookie-parser express-session morgan connect-flash pug
> npm i -g nodemon
> npm i -D nodemon
```

>morgan : 요청에 대한 정보를 콘솔에 기록<br>cookie-parser : 요청에 포함된 쿠리를 해석<br>express-session : 세션 관리용 미들웨어<br>connect-flash : 일회성 메세지들을 웹 브라우저에 나타내는 용도.

<br>

```
> npm i dotenv
```

```
# .env
COOKIE_SECRET=nodebirdsecret
```

> require('dotenv').config() 가 호출되면, .env 의 비밀키들이 process.env 에 넣어진다.

<br>



#### Reference

<https://github.com/ZeroCho/nodejs-book/tree/master/ch9>