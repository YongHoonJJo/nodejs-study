

#### <1> 프로젝트 구조 세팅

#### 프로젝트 구조

```
nodebird
    ├── package.json
    ├── app.js
    ├── config
    ├── models
    ├── passport
    ├── public
    ├── routes
    └── views
```

<br>

#### 기본 패키지 설치

```
> npm init -y
> npm i -g sequelize-cli
> npm i sequelize mysql2
> sequelize init // npx sequelize-cli init
```

> This will create following folders<br>`config`, contains config file, which tells CLI how to connect with database<br>`models`, contains all models for your project<br>`migrations`, contains all migration files<br>`seeders`, contains all seed files

<br>

```
> npm i express cookie-parser express-session morgan connect-flash pug
> npm i -g nodemon
> npm i -D nodemon
```

>morgan : 요청에 대한 정보를 콘솔에 기록<br>cookie-parser : 요청에 포함된 쿠카를 해석<br>express-session : 세션 관리용 미들웨어<br>connect-flash : 일회성 메세지들을 웹 브라우저에 나타내는 용도.

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

#### Sequelize 를 통한 데이터베이스 생성

시퀄라이즈는 config.json 을 읽어 데이터베이스를 생성할 수 있다.

```
> sequelize db:create

Loaded configuration file "config/config.json".
Using environment "development".
Database nodebird_dev created.
```

<br>

#### 모델을 서버와 연결하기

```js
/*** app.js ***/
const { sequelize } = require('./models')
sequelize.sync()
```

> 시퀄라이즈는 테이블 생성 쿼리문에 IF NOT EXISTS 를 넣기 때문에, 테이블이 없을 때만 테이블을 생성해준다.

<br>

#### Passport 모듈 설치

```
> npm i passport passport-local passport-kakao bcrypt
```

<br>

#### Multer 모듈로 이미지 업로드 

```
> npm i multer
```

<br>

#### 공식문서

Passport : <http://www.passportjs.org>

Multer : <https://github.com/expressjs/multer>

Dotenv : <https://github.com/motdotla/dotenv>

Passport-local : <https://github.com/jaredhanson/passport-local>

Passport-kakao : <https://www.npmjs.com/package/passport-kakao>

Bycript : <https://www.npmjs.com/package/bcrypt>

<br>

#### Reference

<https://github.com/ZeroCho/nodejs-book/tree/master/ch9>