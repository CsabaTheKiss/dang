const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

exports.send = async (options) => {
    const mailOptions = {
        from: 'Kiss Cs <noreply@kisscs.com>',
        to: options.user.email,
        subject: options.subject,
        html: 'this will be filled later',
        text: 'later'
    };

    const sendMail = promisify(transport.sendMail, transport);

    return sendMail(mailOptions);
};
