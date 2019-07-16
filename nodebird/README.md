

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
> sequelize init // npx sequelize-cli init
```

> This will create following folders<br>`config`, contains config file, which tells CLI how to connect with database<br>`models`, contains all models for your project<br>`migrations`, contains all migration files<br>`seeders`, contains all seed files

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

#### <2> DB 세팅

아래의 세 파일 생성

```
models/user.js
models/post.js
models/hashtag.js
```

> user : 사용자 정보를 저장하는 모델<br>post : 게시글 내용과 이미지 경로를 저장하는 모델, 게시글 등록자의 아이디는 관계 설정시 시퀄라이즈가 생성해준다.<br>hashtag : 태그의 이름을 저장하는 모델 (나중에 태그로 검색하기 위한 설정)

<br>

model/index.js 수정

```
- Sequelize 클래스 import.
- stage 에 따른 config/config.json import
- sequelize 객체 생성 (database, username, password, {host, dialet})
- const db = { sequelize, Sequelize } 생성
- db 객체에 모델 삽입
- db 객체의 모델들 간의 관계 설정
```

<br>

##### 모델간 관계 설정

```
User 와 Post 는 일대다 관계 => hasMany() 와 belongsTo() 로 연결
Post 와 Hashtag 는 다대다 관계 => belongsToMany() 로 정의
User 테이블(같은 테이블)끼리의 다대다 관계 => belongsToMany() 로 정의
```

> 같은 테이블 간 다대다 관계에서는 모델 이름과 칼럼 이름을 따로 설정해야 한다.<br>through 옵션으로 생성할 모델 이름을 설정.<br>foreignKey 옵션으로 해당 모델에서 각 테이블에 해당하는 칼럼을 설정<br>as 옵션은 JOIN 작업 시 사용하는 이름

<br>

이로써 총 5개의 모델을 설정하였다.

직접 설정한 User, Hashtag, Post, 그리고 다대다 관계에 의해 생성되는 PostHashtag, Follow .

<br>

##### Sequelize 를 통한 데이터베이스 생성

시퀄라이즈는 config.json 을 읽어 데이터베이스를 생성할 수 있다.

```json
{
  "development": {
    "username": "root",
    "password": "csedbadmin",
    "database": "nodebird_dev",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  //...
}

```

```
> sequelize db:create

Loaded configuration file "config/config.json".
Using environment "development".
Database nodebird_dev created.
```

> NODE_ENV 에 의해 결정되는 것 같다.

<br>

##### 모델을 서버와 연결하기

app.js 에서 models/index.js 의 db.sequelize 객체를 import 후 sync() 호출. 그리고 서버를 실행한다.

```
> npm start
```

> 시퀄라이즈는 테이블 생성 쿼리문에 IF NOT EXISTS 를 넣기 때문에, 테이블이 없을 때만 생성해준다.

<br>

#### <3> Passport 모듈

```
> npm i passport passport-local passport-kakao bcrypt
```



```js
/*** app.js ***/
const passport = require('passport')
const passportConfig = require('./passport')
passportConfig(passport)
app.use(passport.initialize())
app.use(passport.session())
```

> 위의 코드를 추가하여 Passport 모듈을 app.js 와 연결.<br>passport.initialize() 은 req 객체에 passport 설정을 담는다.<br>passport.session() 은 req.session 객체에 passport 정보를 저장한며, req.session 객체는 express-session 에서 생성되기 때문에, passport 미들웨어는 express-session 미들웨어보다 뒤에 연결해야 한다.

<br>

```js
/*** passport/index.js ***/
const local = require('./localStrategy')
const kakao = require('./kakaoStrategy')
const { User } = require('../models')

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.fine({ where: { id } })
      .then(user => done(null, user))
      .catch(err => done(err))
  })

  local(passport)
  kakao(passport)
}
```

> serializeUser() 메서드는 req.session객체에 어떤 데이터를 저장할지 선택한다. 세션에 사용자 정보를 모두 저장하면 세션의 용량이 커지고, 데이터 일관성에 문제가 발생하기 때문에, 사용자의 아이디만 저장할고 명령한 것.
>
> deserializeUser() 메서드는 매번 요청할 때마다 실행된다. passport.session() 미들웨어가 이 메서드를 호출한다. 위의 메서드에서 세션에 저장했던 아이디를 받아 DB 에서 사용자 정보를 조회한다. 그리고 그 정보는 req.user 에 저장되기 때문에 앞으로 req.user 를 통해 로그인한 사용자의 정보를 가져올 수 있다.
>
> 로그인 요청 - passport.authenticat() 호출 - 로그인 전략 수행 - 로그인 성공 시 사용자 정보 객체와 함께 req.login 호출 - req.login() 메서드가 passport.serializeUser() 호출 - req.session에 사용자 아이디만 저장 - 로그인 완료
>
> 로그인 이후 : 모든 요청에 passport.session() 미들웨어가 passport.deserializeUser() 메서드 호출 - req.session에 저장된 아이디로 DB에서 사용자 조회 - 조회된 사용자 정보를 req.user 에 저장 - 라우터에서 req.user 객체 사용 가능
>
> 또한, Passport 는 req 객체에 isAuthenticated() 를 추가하는데 로그인 중이면 true 를 리턴한다.

<br>

#### <4> Multer 모듈로 이미지 업로드 구현

```
> npm i multer
```





#### Reference

<https://github.com/ZeroCho/nodejs-book/tree/master/ch9>

<http://docs.sequelizejs.com/manual/migrations.html>