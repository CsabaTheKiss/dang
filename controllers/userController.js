const mongoose = require('mongoose');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Login' });
}

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register' });
}

exports.validateRegister = (req, res, next) => {
    // removes all king of possible scripts from the body
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.checkBody('email', 'That Email is not valid!').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Confirmed password cannot be empty!').notEmpty();
    req.checkBody('password-confirm', 'Oops! Your passwords do not match!').equals(req.body.password);

    // getting the errors above, if any
    const errors = req.validationErrors();

    if (errors) {
        req.flash('error', errors.map(err => err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
        return; // stop the fn from running
    }
    next(); // no errors, call the next middleware on the line
}
