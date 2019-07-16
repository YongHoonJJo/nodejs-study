#### models/

```
models/user.js
models/post.js
models/hashtag.js
```

> user : 사용자 정보를 저장하는 모델<br>post : 게시글 내용과 이미지 경로를 저장하는 모델, 게시글 등록자의 아이디는 관계 설정시 시퀄라이즈가 생성해준다.<br>hashtag : 태그의 이름을 저장하는 모델 (나중에 태그로 검색하기 위한 설정)

<br>

```js
/*** models/user.js ***/
module.exports = (sequelize, DataTypes) => (
  sequelize.define('user', {
    email: { type: DataTypes.STRING(40), allowNull: true, unique: true, },
    nick: { type: DataTypes.STRING(15), allowNull: false, },
    password: { type:DataTypes.STRING(100), allowNull: true, },
    provider: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'local' },
    snsId: { type: DataTypes.STRING(30), allowNull: true } 
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci'
  })
)
```

> `timestamps: true, paranoid: true` 옵션이 true 이므로 createdAt, updatedAt, deletedAt 칼럼이 생성된다.<br>`charset: 'utf8', collate: 'utf8_general_ci'` 은 DB 문자열을 UTF8(한글 지원)으로 설정하겠다는 뜻.

<br>

```js
/*** models/posts.js ***/
module.exports = (sequelize, DataTypes) => (
  sequelize.define('post', {
    content: { type: DataTypes.STRING(140), allowNull: true, },
    img: { type: DataTypes.STRING(200), allowNull: true }
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci'
  })
)
```

> 게시글 등록자의 아이디를 담은 칼럼은 관계를 설정해주면 시퀄라이즈가 알아서 생성해준다.

<br>

```js
/*** models/hashtag.js ***/
module.exports = (sequelize, DataTypes) => (
  sequelize.define('hashtag', {
    title: { type: DataTypes.STRING(15), allowNull: false, unique: true }
  }, {
    timestamps: true,
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci'
  })
)
```

> 해시캐그 모델을 따로 두는 이유는 태그로 검색을 하기 위함.

<br>

```js
/*** models/index.js ***/
const Sequelize = require('sequelize')
const env = process.env.NODE_ENV || 'development'
const config = require('../config/config')[env]

const sequelize = new Sequelize(
  config.database, config.username, config.password, config
)

const db = { sequelize, Sequelize }
db.User = require('./user')(sequelize, Sequelize)
db.Post = require('./post')(sequelize, Sequelize)
db.Hashtag = require('./hashtag')(sequelize, Sequelize)

db.User.hasMany(db.Post)
db.Post.belongsTo(db.User)
db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag'})
db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag'})
db.User.belongsToMany(db.User, {
  foreignKey: 'followingId',
  as: 'Followers',
  through: 'Follow'
})
db.User.belongsToMany(db.User, {
  foreignKey: 'followrId',
  as: 'Followings',
  through: 'Follow'
})

module.exports = db
```

> Sequelize 클래스 import.<br>stage 에 따른 config/config.json import<br>sequelize 객체 생성 (database, username, password, {host, dialet})<br>const db = { sequelize, Sequelize } 생성<br>db 객체에 모델 삽입<br>db 객체의 모델들 간의 관계 설정

<br>

##### 모델간 관계 설정

```
User 와 Post 는 일대다 관계 => hasMany() 와 belongsTo() 로 연결
Post 와 Hashtag 는 다대다 관계 => belongsToMany() 로 정의
User 테이블(같은 테이블)끼리의 다대다 관계 => belongsToMany() 로 정의
```

> 다대다 관계에서는 중간에 관계테이블이 생성된다. 또한, Post와 Hashtag 모델의 관계에서 시퀄라이즈는 post 데이터에는 getHashtags(), addHashtags() 등의 메서드를 추가하고, hashtag 데이터에는 getPosts(), addPosts() 등의 메서드를 추가한다.
>
> 같은 테이블 간 다대다 관계에서는 모델 이름과 칼럼 이름을 따로 설정해야 한다. through 옵션으로 생성할 모델 이름을 설정하고, foreignKey 옵션으로 해당 모델에서 각 테이블에 해당하는 칼럼을 설정한다. as 옵션은 JOIN 작업 시 사용하는 이름이며 이를 바탕으로 getFollowings(), getFollowers(), addFollowing(), addFollower() 등이 메서드가 추가된다.

<br>

User, Hashtag, Post, 그리고 다대다 관계에 의해 생성되는 PostHashtag, Follow . 5개의 모델이 생성되었다.

<img width="655" alt="nodebird_dev_ERD" src="https://user-images.githubusercontent.com/13485924/61271581-fd41bc00-a7df-11e9-80e2-af98c2fd43a3.png">



<br>

#### Sequelize 를 통한 데이터베이스 생성

```
> sequelize db:create

Loaded configuration file "config/config.json".
Using environment "development".
Database nodebird_dev created.
```

> 위 명령어를 통해 데이터베이스를 생성할 수 있으며, config/config.json 을 바탕으로 생성이 된다. 
>
> stage 의 경우 NODE_ENV 에 의해 결정되는 것 같다.

<br>

```js
/*** config/config.json ***/
{
  "development": {
    "username": "root",
    "password": "csedbadmin",
    "database": "nodebird_dev",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "nodebird_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "nodebird_prod",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}


```

