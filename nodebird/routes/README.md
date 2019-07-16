### routes/

#### routes/page.js

```js
/*** routes/page.js ***/
const express = require('express')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const { Post, User } = require('../models')

const router = express.Router()

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', {title: '내 정보 - NodeBird', user: req.user})
})

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', {
    title: '회원가입 - NodeBird',
    user: req.user,
    joinError: req.flash('joinError')
  })
})

router.get('/', (req, res, next) => {
  Post.findAll({
    include: { model: User, attributes: ['id', 'nick'] },
    order: [['createdAt', 'DESC']]
  })
  .then(posts => {
    res.render('main', {
      title: 'NodeBird',
      twits: posts,
      user: req.user,
      loginError: req.flash('loginError')
    })
  })
  .catch(error => {
    console.error(error)
    next(error)
  })
})

module.exports = router
```

> 회원가입, 프로필, 메인 페이지를 렌더링.
>
> 회원가입과 로그인 시 에러 메세지를 보여주기 위해 flash 메세지를 연결.
>
> req.user 는 passport.deserializeUser() 에 의해 추가된 상태이다.
>
> Post 를 조회할 때, 작성자의 아이디와 닉네임을 JOIN 해서 제공, 게시글의 순서는 최신순으로 정렬.

<br>

#### routes/middlewares.js

```js
/*** routes/middlewares.js ***/
exports.isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) { next() } 
  else { res.status(403).send('로그인 필요') }
}

exports.isNotLoggedIn = (req, res, next) => {
  if(!req.isAuthenticated()) { next() } 
  else { res.redirect('/') }
}
```

> Passport 에 의해 req 객체에 isAuthenticated() 메서드가 추가 되었으며, 이는 로그인 중일 때 true 를 리턴한다.

<br>

```js
/*** routes/auth.js ***/

router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body
  try {
    const exUser = await User.findOne({ where: { email } })
    if(exUser) {
      req.flash('joinError', '이미 가입된 이메일.')
      return res.redirect('/join')
    }

    const hash = await bcrypt.hash(password, 12)
    await User.create({ email, nick, password: hash })

    return res.redirect('/')
  } catch (error) {
    return next(error)
  }
})
```

> 회원가입 라우터.
>
> 비밀번호 암호화는 crypto 모듈의 pbkdf2 메서드를 사용해도 된다.

<br>

#### routes/auth.js

```js
/*** routes/auth.js ***/

router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if(authError) {
      console.error(authError)
      return next(authError)
    }
    if(!user) {
      req.flash('loginError', info.message)
      return res.redirect('/')
    }
    return req.login(user, (loginError) => {
      if(loginError) { return next(loginError) }
      return res.redirect('/')
    })
  })(req, res, next)
})
```

> 로그인 라우터로 passport.authenticate('local') 미들웨어가 로컬 로그인 전략을 수행한다.
>
> 미들웨어인데 라우터 미들웨어 안에 들어 있다. 이는 미들웨어어 사용자 정의 기능을 추가하고 싶을 때 이런식으로 한다. (req, res, next) 를 통해 즉시 실행함수를 만들었다. 전량 성공, 실패시 콜백함수가 실행되며, 성공시 req.login() 메서드를 호출한며, 이 메서드가 호출되면 passport.serializeUser() 를 호출한다. req.login() 의 첫번재 인자가 serializeUser 로 전달된다.
>
> req.login() 과 req.logout() 메서드는 Passport 에 의해 추가된 메서드이다.

<br>

```js
/*** routes/auth.js ***/

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout()
  req.session.destroy()
  res.redirect('/')
})
```

> 로그아웃 라우터로 req.logout() 은 req.user 객체를 제거한다.
>
> req.session.destroy() 는 req.session 객체의 내용을 제거한다.

<br>

#### routes/post.js

이미지의 경우 보통 input[type=file] 태그와 인코딩 타입이 multipart/form-data 인 form 태그를 통해 업로드 한다.

이 경우, multipart 처리용 모듈인 Multer 를 활용한다.

```js
/*** routes/post.js ***/

fs.readdir('uploads', (error) => {
  if(error) {
    console.error('uploads 폴더가 없어 uploads 폴더 생성')
    fs.mkdirSync('uploads')
  }
})
```

> uploads 폴더가 없는 경우,  생성한다.

<br>

```js
/*** routes/post.js ***/

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/')
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname)
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext)
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
})
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  console.log(req.file)
  res.json({ url: `/img/${req.file.filename}`})
})


```

> upload 는 미들웨어를 만드는 객체가 된다. 
>
> storage 옵션은 파일 저장 방식과 경로, 파일명 등을 설정.
>
> limits 옵션은 최대 이미지 파일 용량 허용치를 의미한다. 

<br>

##### upload 객체는 여러 메서드를 가지고 있다.

```
single 는 하나의 이미지를 업로드할 때 사용. req.file 객체를 생성. 나머지 정보는 req.body 로.
array, fields 는 여러 개의 이미지를 업로드할 때 사용, req.files 객체를 생성.
array 는 속성 하나에 이미지를 여러 개 업로드, fields 는 여러 개의 속성에 이미지를 하나씩 업로드.
none 은 이미지를 올리지 않고 데이터만 multipart 형식으로 전송할 때 사용. 모든 정보를 req.body 로.
```

<br>

```js
/*** routes/post.js ***/

const upload2 = multer()
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    const { content, url: img } = req.body
    const { id: userId } = req.user
    const post = await Post.create({ content, img, userId })
    const hashtags = content.match(/#[^\s]*/g)
    if(hashtags) {
      const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({
        where: { title: tag.slice(1).toLowerCase() }
      })))
      await post.addHashtags(result.map(r => r[0]))
    }
    res.redirect('/')
  } catch (error) {
    console.error(error)
    next(error)
  }
})
```

> 게시글 저장 후 해시캐그를 추출. 추출한 해시태그를 다시 DB에 저장하고, post.addHashtags() 메서드로 게시글과 해시태그의 관계를 PostHashtag 테이블에 저장한다.
>
> 해시태그 파싱 정규식 : `#[^\s#]*` 와의 차이 알아보기.

<br>

```js
/*** routes/post.js ***/

router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag
  if(!query) {
    return res.redirect('/')
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } })
    let posts = []
    if(hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }]})
    }
    return res.render('main', {
      title: `${query} | NodeBird`,
      user: req.user,
      twits: posts
    })
  } catch (error) {
    console.error(error)
    return next(error)
  }
})
```

> 해시태그 검색.
>
> 해시태그가 존재하는지 검색 후, 있다면 시퀄라이즈에서 제공하는 getPosts 메서드로 모든 게시글을 가져온다. 가져올 때는 작성자 정보를 JOIN 한다

<br>

#### routes/user.js

```js
/*** routes/user.js ***/

const express = require('express')

const { isLoggedIn } = require('./middlewares')
const { User } = require('../models')

const router = express.Router()

router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }})
    await user.addFollowing(parseInt(req.params.id, 10))
    res.send('success')
  } catch (error) {
    console.error(error)
    next(error)
  }
})

module.exports = router
```

> 팔로우할 사용자를 DB에서 조회한 다음, 시퀄라이즈에서 추가한 addFlollowing() 메서드로 현재 로그인한 사용자와의 관계를 지정한다.

#### routes/page.js

```js
/*** routes/page.js ***/
const express = require('express')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const { Post, User } = require('../models')

const router = express.Router()

router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', {title: '내 정보 - NodeBird', user: req.user})
})

router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', {
    title: '회원가입 - NodeBird',
    user: req.user,
    joinError: req.flash('joinError')
  })
})

router.get('/', (req, res, next) => {
  Post.findAll({
    include: { model: User, attributes: ['id', 'nick'] },
    order: [['createdAt', 'DESC']]
  })
  .then(posts => {
    res.render('main', {
      title: 'NodeBird',
      twits: posts,
      user: req.user,
      loginError: req.flash('loginError')
    })
  })
  .catch(error => {
    console.error(error)
    next(error)
  })
})

module.exports = router
```

> 회원가입, 프로필, 메인 페이지를 렌더링.
>
> 회원가입과 로그인 시 에러 메세지를 보여주기 위해 flash 메세지를 연결.
>
> req.user 는 passport.deserializeUser() 에 의해 추가된 상태이다.
>
> Post 를 조회할 때, 작성자의 아이디와 닉네임을 JOIN 해서 제공, 게시글의 순서는 최신순으로 정렬.

<br>

#### routes/middlewares.js

```js
/*** routes/middlewares.js ***/
exports.isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) { next() } 
  else { res.status(403).send('로그인 필요') }
}

exports.isNotLoggedIn = (req, res, next) => {
  if(!req.isAuthenticated()) { next() } 
  else { res.redirect('/') }
}
```

> Passport 에 의해 req 객체에 isAuthenticated() 메서드가 추가 되었으며, 이는 로그인 중일 때 true 를 리턴한다.

<br>

```js
/*** routes/auth.js ***/

router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body
  try {
    const exUser = await User.findOne({ where: { email } })
    if(exUser) {
      req.flash('joinError', '이미 가입된 이메일.')
      return res.redirect('/join')
    }

    const hash = await bcrypt.hash(password, 12)
    await User.create({ email, nick, password: hash })

    return res.redirect('/')
  } catch (error) {
    return next(error)
  }
})
```

> 회원가입 라우터.
>
> 비밀번호 암호화는 crypto 모듈의 pbkdf2 메서드를 사용해도 된다.

<br>

#### routes/auth.js

```js
/*** routes/auth.js ***/

router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if(authError) {
      console.error(authError)
      return next(authError)
    }
    if(!user) {
      req.flash('loginError', info.message)
      return res.redirect('/')
    }
    return req.login(user, (loginError) => {
      if(loginError) { return next(loginError) }
      return res.redirect('/')
    })
  })(req, res, next)
})
```

> 로그인 라우터로 passport.authenticate('local') 미들웨어가 로컬 로그인 전략을 수행한다.
>
> 미들웨어인데 라우터 미들웨어 안에 들어 있다. 이는 미들웨어어 사용자 정의 기능을 추가하고 싶을 때 이런식으로 한다. (req, res, next) 를 통해 즉시 실행함수를 만들었다. 전량 성공, 실패시 콜백함수가 실행되며, 성공시 req.login() 메서드를 호출한며, 이 메서드가 호출되면 passport.serializeUser() 를 호출한다. req.login() 의 첫번재 인자가 serializeUser 로 전달된다.
>
> req.login() 과 req.logout() 메서드는 Passport 에 의해 추가된 메서드이다.

<br>

```js
/*** routes/auth.js ***/

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout()
  req.session.destroy()
  res.redirect('/')
})
```

> 로그아웃 라우터로 req.logout() 은 req.user 객체를 제거한다.
>
> req.session.destroy() 는 req.session 객체의 내용을 제거한다.

<br>

#### routes/post.js

이미지의 경우 보통 input[type=file] 태그와 인코딩 타입이 multipart/form-data 인 form 태그를 통해 업로드 한다.

이 경우, multipart 처리용 모듈인 Multer 를 활용한다.

```js
/*** routes/post.js ***/

fs.readdir('uploads', (error) => {
  if(error) {
    console.error('uploads 폴더가 없어 uploads 폴더 생성')
    fs.mkdirSync('uploads')
  }
})
```

> uploads 폴더가 없는 경우,  생성한다.

<br>

```js
/*** routes/post.js ***/

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/')
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname)
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext)
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
})
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {
  console.log(req.file)
  res.json({ url: `/img/${req.file.filename}`})
})


```

> upload 는 미들웨어를 만드는 객체가 된다. 
>
> storage 옵션은 파일 저장 방식과 경로, 파일명 등을 설정.
>
> limits 옵션은 최대 이미지 파일 용량 허용치를 의미한다. 

<br>

##### upload 객체는 여러 메서드를 가지고 있다.

```
single 는 하나의 이미지를 업로드할 때 사용. req.file 객체를 생성. 나머지 정보는 req.body 로.
array, fields 는 여러 개의 이미지를 업로드할 때 사용, req.files 객체를 생성.
array 는 속성 하나에 이미지를 여러 개 업로드, fields 는 여러 개의 속성에 이미지를 하나씩 업로드.
none 은 이미지를 올리지 않고 데이터만 multipart 형식으로 전송할 때 사용. 모든 정보를 req.body 로.
```

<br>

```js
/*** routes/post.js ***/

const upload2 = multer()
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    const { content, url: img } = req.body
    const { id: userId } = req.user
    const post = await Post.create({ content, img, userId })
    const hashtags = content.match(/#[^\s]*/g)
    if(hashtags) {
      const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({
        where: { title: tag.slice(1).toLowerCase() }
      })))
      await post.addHashtags(result.map(r => r[0]))
    }
    res.redirect('/')
  } catch (error) {
    console.error(error)
    next(error)
  }
})
```

> 게시글 저장 후 해시캐그를 추출. 추출한 해시태그를 다시 DB에 저장하고, post.addHashtags() 메서드로 게시글과 해시태그의 관계를 PostHashtag 테이블에 저장한다.
>
> 해시태그 파싱 정규식 : `#[^\s#]*` 와의 차이 알아보기.

<br>

```js
/*** routes/post.js ***/

router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag
  if(!query) {
    return res.redirect('/')
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } })
    let posts = []
    if(hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }]})
    }
    return res.render('main', {
      title: `${query} | NodeBird`,
      user: req.user,
      twits: posts
    })
  } catch (error) {
    console.error(error)
    return next(error)
  }
})
```

> 해시태그 검색.
>
> 해시태그가 존재하는지 검색 후, 있다면 시퀄라이즈에서 제공하는 getPosts 메서드로 모든 게시글을 가져온다. 가져올 때는 작성자 정보를 JOIN 한다

<br>

#### routes/user.js

```js
/*** routes/user.js ***/

const express = require('express')

const { isLoggedIn } = require('./middlewares')
const { User } = require('../models')

const router = express.Router()

router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }})
    await user.addFollowing(parseInt(req.params.id, 10))
    res.send('success')
  } catch (error) {
    console.error(error)
    next(error)
  }
})

module.exports = router
```

> 팔로우할 