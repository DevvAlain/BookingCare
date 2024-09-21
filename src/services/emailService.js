require('dotenv').config();

const nodemailer = require("nodemailer");



let sendSimpleEmail = async (dataSend) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
            user: process.env.EMAIL_APP,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    // async..await is not allowed in global scope, must use a wrapper

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Devv Dylan 👻" <vuduc870@gmail.com>', // sender address
        to: dataSend.reciverEmail, // list of receivers
        subject: "Thông tin đặt lịch khám bệnh", // Subject line
        html: getBodyHTMLEmail(dataSend),
    });
};

let getBodyHTMLEmail = (dataSend) => {
    let result = ''
    if (dataSend.language === 'vi') {
        result =
            `
        <h3>Xin chào ${dataSend.patientName}!</h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên Devv Dylan</p>
        <p>Thông tin đặt lịch khám bệnh:</p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Bác sĩ: ${dataSend.doctorName}</b></div>

        <p>Nếu các thông tin đúng, vui lòng click đường link bên dưới để xác nhận và hoàn tất thủ tục đặt lịch khám bệnh.</p>
        <div>
           <a href=${dataSend.redirectLink} target="_blank">Click here</a> 
        </div>

        <div>Xin chân thành cảm ơn</div>
        `
    }
    if (dataSend.language === 'en') {
        result =
            `
        <h3>Dear ${dataSend.patientName}!</h3>
        <p>You received this email because you booked an online medical appointment on Devv Dylan</p>
        <p>Appointment information:</p>
        <div><b>Time: ${dataSend.time}</b></div>
        <div><b>Doctor: ${dataSend.doctorName}</b></div>

        <p>If the information is correct, please click the link below to confirm and complete the appointment procedure.</p>
        <div>
           <a href=${dataSend.redirectLink} target="_blank">Click here</a> 
        </div>

        <div>Thanks so much</div>
        `
    }

    return result
};
let getBodyHTMLEmailRemedy = (dataSend) => {

    let result = ''
    if (dataSend.language === 'vi') {
        result =
            `
        <h3>Xin chào ${dataSend.patientName} !</h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên Devv Dylan</p>
        <p>Thông tin don thuoc gui trong file dinh kem:</p>     

        <div>Xin chân thành cảm ơn</div>
        `
    }
    if (dataSend.language === 'en') {
        result =
            `
        <h3>Dear ${dataSend.patientName}!</h3>
        <p>You received this email because you booked an online medical appointment on Devv Dylan</p>
        <p>Appointment information:</p>

        <div>Thanks so much</div>
        `
    }

    return result
}
let sendAttachment = async (dataSend) => {
    return new Promise(async (resolve, reject) => {
        try {



            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // Use `true` for port 465, `false` for all other ports
                auth: {
                    user: process.env.EMAIL_APP,
                    pass: process.env.EMAIL_APP_PASSWORD,
                },
            });

            // async..await is not allowed in global scope, must use a wrapper

            // send mail with defined transport object
            let info = await transporter.sendMail({
                from: '"Devv Dylan 👻" <vuduc870@gmail.com>', // sender address
                to: dataSend.email, // list of receivers
                subject: "ket qua dat lich kham benh", // Subject line
                html: getBodyHTMLEmailRemedy(dataSend),
                attachments: [
                    {
                        filename: `remeedy - ${dataSend.patientId} - ${new Date().getTime()}.png`,
                        content: dataSend.imgBase64.split('base64,')[1],
                        encoding: 'base64'
                    }
                ]
            });
            resolve()
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    sendSimpleEmail: sendSimpleEmail,
    sendAttachment: sendAttachment
}