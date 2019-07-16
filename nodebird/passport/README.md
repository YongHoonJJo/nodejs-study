#### Passport/

app.js 와 연결했던 Passport 모듈

```js
/*** passport/index.js ***/
const local = require('./localStrategy')
const kakao = require('./kakaoStrategy')
const { User } = require('../models')

// passportConfig
module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.findOne({ 
        where: { id }, 
        include: [{ 
          model: User,
          attributes: ['id', 'nick'],
          as: 'Followers'
        }, {
          model: User,
          attributes: ['id', 'nick'],
          as: 'Followings'
        }] 
      })
      .then(user => done(null, user)) // req.user 에 저장
      .catch(err => done(err))
  })

  local(passport)
  kakao(passport)
}
```

> serializeUser() 메서드는 req.session객체에 어떤 데이터를 저장할지 선택한다. 세션에 사용자 정보를 모두 저장하면 세션의 용량이 커지고, 데이터 일관성에 문제가 발생하기 때문에, 사용자의 아이디만 저장할고 명령한 것.
>
> deserializeUser() 메서드는 매번 요청할 때마다 실행된다. (캐싱을 통해 성능 향상 가능)<br> passport.session() 미들웨어가 이 메서드를 호출한다. 위의 메서드에서 세션에 저장했던 아이디를 받아 DB 에서 사용자 정보를 조회하고 그 정보는 req.user 에 저장되기 때문에, 앞으로 req.user 를 통해 로그인한 사용자의 정보를 가져올 수 있다. 팔로워와 팔로잉 목록도 저장을 한다.
>
> 로그인 요청 - passport.authenticat() 호출 - 로그인 전략 수행 - 로그인 성공 시 사용자 정보 객체와 함께 req.login 호출 - req.login() 메서드가 passport.serializeUser() 호출 - req.session에 사용자 아이디만 저장 - 로그인 완료
>
> 로그인 이후 : 모든 요청에 passport.session() 미들웨어가 passport.deserializeUser() 메서드 호출 - req.session에 저장된 아이디로 DB에서 사용자 조회 - 조회된 사용자 정보를 req.user 에 저장 - 라우터에서 req.user 객체 사용 가능
>
> 또한, Passport 는 req 객체에 isAuthenticated() 를 추가하는데 로그인 중이면 true 를 리턴한다.

<br>

#### 로컬 로그인

```js
/*** passport/localStrategy.js ***/
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

const { User } = require('../models')

module.exports = (passport) => {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, async (email, password, done) => {
    try {
      const exUser = await User.findOne({ where: { email } })
      if(exUser) {
        const result = await bcrypt.compare(password, exUser.password)
        if(result) {
          done(null, exUser)
        } else {
          done(null, false, { message: '비밀번호 일치하지 않음'})
        }
      } else {
        done(null, false, { message: '가입되지 않은 회원'})
      }
    } catch (error) {
      console.error(error)
      done(error)
    }
  }))
}
```

> LocalStrategy 의 첫 번째 인자에서는 전략에 관한 설정을 하는데, 프로퍼티에 해당하는 값에는 req.body 의 프로퍼티를 적어준다. email 은 req.body.email 에 해당한다.
>
> 두 번째 인자는 실제 전략을 수행하는 함수를 전달한다. 첫번째 인자에서 설정한 내용들을 매개변수로 받는다. 마지막 매개변수인 done 은 passport.authenticate 의 콜백함수가 된다.

<br>

```js
/*** routes/auth.js ***/
outer.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    //...
    return req.login(user, (loginError) => {
      //...
      return res.redirect('/')
    })
  })(req, res, next)
})
```

<br>

#### 카카오 로그인

```js
/*** passport/kakaoStrategy.js ***/
const KakaoStrategy = require('passport-kakao').Strategy

const { User } = require('../models')

module.exports = (passport) => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,
    callbackURL: '/auth/kakao/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try { 
      const exUser = await User.findOne({ where: { snsId: profile.id, provider: 'kakao' } })
      if(exUser) {
        done(null, exUser)
      } else {
        const newUser = await User.create({
          email: profile._json && profile._json.kaccount_email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao'
        })
        done(null, newUser)
      }
    } catch (error) {
      console.error(error)
      done(error)
    }
  }))
}
```

> KakaoStrategy 의 첫 번째 인자로는 카카오 로그인에 대한 설정으로 clientID 는 카카오에서 발급해주는 아이디이며, 노출되어선 안된다. callbackURL 은 카카오로부터 인증 결과를 받을 라우터 주소로 라우터의 경로로 사용된다.
>
> 두 번재 인자는 전략을 수행하는 함수로 우선 기존에 카카오로 로그인한 사용자가 있는지 조회를 한고, 없다면 회원가입을 진행한다. 카카오에서는 인증 후 callbackURL 에 적힌 주소로 accesstocken, refreshToken, profile 을 보내주는데, profile 에는 사용자 정보가 들어있다. 여기의 내용을 확인 후 원하는 내용을 저장하면 된다.

<br>

```js
/*** routes/auth.js ***/
router.get('/kakao', passport.authenticate('kakao'))

router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',
}), (req, res) => {
  res.redirect('/')
})
```

> router.get('/kakao') 에 접근하면 카카오 로그인 과정이 시작된다. 로그인 창으로 리다이렉트 되며, 그 결과를  router.get('/kakao/callback') 가 받는다. 이 라우터에서는 카카오 로그인 전략을 수행하는데, passport.authenticate('kakao') 에 콜백함수를 등록하지 않는다. 카카오 로그인은 내부적으로 req.login 을 호출하기 때문에 우리가 직접 호출할 필요가 없기 때문이다. 단지 실패했을 때, 성공했을 때 어떻게 해야할지를 명시해준다.

<br>

kakaoStrategy.js 의 clientID 는 <https://developers.kakao.com> 에서 발급 가능하다. (앱 만들기 후 REST API 키)

플랫폼 추가 메뉴에서 Redirect Path 를 설정하는데 여기서는  /auth/kakao/callback 이 된다.