const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice'); // tool for creating html with inline css
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

const generateHTML = (filename, options = {}) => {
    // renderFile fn will run from an unknown dir,
    // that's why we need special variable __dirname to get it's actual place
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);

    const htmlWithInlineCss = juice(html);
    return htmlWithInlineCss;
};

exports.send = async (options) => {
    const html = generateHTML(options.filename, options);
    const text = htmlToText.fromString(html);
    const mailOptions = {
        from: 'Kiss Cs <noreply@kisscs.com>',
        to: options.user.email,
        subject: options.subject,
        html,
        text
    };

    const sendMail = promisify(transport.sendMail, transport);

    return sendMail(mailOptions);
};
