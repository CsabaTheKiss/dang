const passport = require('passport'); // to handle user login

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out!');
    res.redirect('/');
}

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) { // fn added by passport on req
        next();
        return;
    }
    req.flash('error', 'Oops you must be logged in to do that!');
    res.redirect('/login');
};
