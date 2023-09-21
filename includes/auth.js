const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./db');

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await db.findUserByEmail(email, password);
    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.findUserById(id)
    .then(user => done(null, user))
    .catch(err => done(err));
});

function logout(req, res) {
  req.logout();
  res.redirect('/login'); 
}

async function register (req, res, next) {
  const { email, password } = req.body;
  try {
    const existingUser = await db.checkIfEmailExists(email);
    if (existingUser) {
      return res.status(400).send('Email already registered.');
    }
    const userId = await db.createUser(email, password);
    const user = await db.findUserByEmail(email, password);
    
    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect('/');
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  initialize: () => [
    passport.initialize(),
    passport.session()
  ],
  authenticate: passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }),
  register: register,
  logout: logout 
};
