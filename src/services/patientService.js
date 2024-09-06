import db from '../models/index';
require('dotenv').config();
import emailService from './emailService';
import { v4 as uuidv4 } from 'uuid';

let buildUrlEmail = (doctorId, token) => {
    let result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}`
    return result;
}
let createBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType || !data.date
                || !data.fullName

            ) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter'
                })
                return;
            } else {
                let token = uuidv4();

                await emailService.sendSimpleEmail({
                    reciverEmail: data.email,
                    patientName: data.fullName,
                    time: data.timeString,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrlEmail(data.doctorId, token)
                });

                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3'
                    },
                });

                //create booking
                if (user && user[0]) {
                    await db.Booking.findOrCreate({
                        where: { patientId: user[0].id },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                            token: token
                        },
                    })
                }
                resolve({
                    errCode: 0,
                    errMsg: 'Patient booking appointment successfully'
                })
            }
            resolve({
                errCode: 0,
                data: data
            })
        } catch (e) {
            reject(e)
        }
    })
};

let postVerifyBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.token || !data.doctorId) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter'
                });
                return;
            } else {
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        token: data.token,
                        statusId: 'S1'
                    },
                    raw: false // raw: false so we can use the save method of sequelize
                });

                if (appointment) {
                    appointment.statusId = 'S2';
                    await appointment.save(); // Corrected from 'booking.save'
                    resolve({
                        errCode: 0,
                        errMsg: 'Patient verified booking appointment successfully'
                    });
                } else {
                    resolve({
                        errCode: 2,
                        errMsg: 'Appointment has been activated or does not exist'
                    });
                }
            }
        } catch (e) {
            console.error('Error in postVerifyBookAppointment service:', e);
            reject(e);
        }
    });
};


module.exports = {
    createBookAppointment: createBookAppointment,
    postVerifyBookAppointment: postVerifyBookAppointment
}