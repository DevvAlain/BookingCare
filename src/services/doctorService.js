require('dotenv').config();
import db from '../models/index';
import { where } from 'sequelize';
import _, { includes } from 'lodash';
import { raw } from 'body-parser';
import emailService from './emailService';



const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;


let getTopDoctorHome = (limitInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = await db.User.findAll({
                limit: limitInput,
                where: { roleId: 'R2' },
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password']
                },
                include: [
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },
                ],
                raw: true,
                nest: true
            });
            resolve({
                errCode: 0,
                data: users
            });
        } catch (e) {
            reject(e);
        }
    });
};

let getAllDoctors = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: { roleId: 'R2' },
                attributes: {
                    exclude: ['password', 'image']
                },
            });
            resolve({
                errCode: 0,
                data: doctors
            });
        } catch (e) {
            reject(e);
        }
    });
};

let saveDetailInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputData.doctorId || !inputData.contentHTML
                || !inputData.contentMarkdown || !inputData.action
                || !inputData.selectedPrice || !inputData.selectedPayment
                || !inputData.selectedProvince || !inputData.nameClinic
                || !inputData.addressClinic || !inputData.note
                || !inputData.specialtyId
            ) {
                resolve({
                    errCode: 1,
                    errMsg: 'Input data is required'
                });
            } else {
                // upsert to Markdown
                if (inputData.action === 'CREATE') {
                    await db.Markdown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkdown: inputData.contentMarkdown,
                        description: inputData.description,
                        doctorId: inputData.doctorId
                    });
                    resolve({
                        errCode: 0,
                        errMsg: 'Doctor information created successfully!'
                    });
                } else if (inputData.action === 'EDIT') {
                    let doctorMarkdown = await db.Markdown.findOne({
                        where: { doctorId: inputData.doctorId },
                        raw: false
                    });
                    if (doctorMarkdown) {
                        doctorMarkdown.contentHTML = inputData.contentHTML;
                        doctorMarkdown.contentMarkdown = inputData.contentMarkdown;
                        doctorMarkdown.description = inputData.description;
                        await doctorMarkdown.save();
                        resolve({
                            errCode: 0,
                            errMsg: 'Doctor information updated successfully!'
                        });
                    } else {
                        resolve({
                            errCode: 2,
                            errMsg: 'Doctor not found!'
                        });
                    }
                }

                //upsert to Doctor_info table
                let doctorInfo = await db.Doctor_Info.findOne({
                    where: {
                        doctorId: inputData.doctorId,
                    },
                    raw: false
                })
                if (doctorInfo) {
                    //update
                    doctorInfo.doctorId = inputData.doctorId;
                    doctorInfo.priceId = inputData.selectedPrice;
                    doctorInfo.provinceId = inputData.selectedProvince;
                    doctorInfo.paymentId = inputData.selectedPayment;
                    doctorInfo.addressClinic = inputData.addressClinic;
                    doctorInfo.nameClinic = inputData.nameClinic;
                    doctorInfo.note = inputData.note;
                    doctorInfo.specialtyId = inputData.specialtyId;
                    await doctorInfo.save();
                } else {
                    //create
                    await db.Doctor_Info.create({
                        doctorId: inputData.doctorId,
                        priceId: inputData.selectedPrice,
                        provinceId: inputData.selectedProvince,
                        paymentId: inputData.selectedPayment,
                        addressClinic: inputData.addressClinic,
                        nameClinic: inputData.nameClinic,
                        note: inputData.note,
                        specialtyId: inputData.specialtyId,
                    });
                }
            }
        } catch (e) {
            reject(e);
        }
    });
};


let getDetailDoctorById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter'
                })
            } else {
                let data = await db.User.findOne({
                    where: { id: id },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {
                            model: db.Markdown,
                            attributes: ['description', 'contentHTML', 'contentMarkdown']
                        },

                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Doctor_Info,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                if (data && data.image) {
                    data.image = Buffer.from(data.image, 'base64').toString('binary');
                }
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
};

let createSchedule = (scheduleData) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!scheduleData.arrSchedule || !scheduleData.arrSchedule.length) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter: arrSchedule'
                });
                return;
            }

            // Extract doctorId and date from the first schedule item
            const doctorId = scheduleData.arrSchedule[0].doctorId;
            const date = scheduleData.arrSchedule[0].date;

            // Check for missing doctorId or date
            if (!doctorId) {
                console.error('doctorId is missing:', scheduleData);
                resolve({
                    errCode: 2,
                    errMsg: 'Missing required parameter: doctorId'
                });
                return;
            }
            if (!date) {
                resolve({
                    errCode: 3,
                    errMsg: 'Missing required parameter: date'
                });
                return;
            }

            let schedule = scheduleData.arrSchedule.map(time => {
                time.maxNumber = MAX_NUMBER_SCHEDULE;
                return time;
            });

            // Fetch existing schedules for the doctor on the specified date
            let existing = await db.Schedule.findAll({
                where: { doctorId: doctorId, date: date },
                attributes: ['timeType', 'date', 'doctorId', 'maxNumber'],
                raw: true
            });

            // Adjust existing schedules' dates to ensure proper comparison
            existing = existing.map(time => {
                time.date = new Date(time.date).getTime(); // Ensure date is in the same format
                return time;
            });

            // Use _.differenceWith to find schedules that need to be created
            let toCreate = _.differenceWith(schedule, existing, (a, b) => {
                return a.timeType === b.timeType && a.date === b.date;
            });

            // If there are new schedules, insert them into the database
            if (toCreate && toCreate.length > 0) {
                await db.Schedule.bulkCreate(toCreate);
            }
            resolve({
                errCode: 0,
                errMsg: 'Schedule created successfully!'
            });
        } catch (e) {
            reject({
                errCode: -1,
                errMsg: 'An error occurred while creating the schedule'
            });
        }
    });
};

let getScheduleByDate = (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter'
                })
                return;
            } else {
                let dataSchedule = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date
                    },
                    include: [// lay cai chung
                        { model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.User, as: 'doctorData', attributes: ['firstName', 'lastName'] },
                    ],
                    raw: false,
                    nest: true
                })
                if (!dataSchedule) dataSchedule = [];
                resolve({
                    errCode: 0,
                    data: dataSchedule
                })
            }
        } catch (e) {
            reject(e);
        }
    })
};

let getExtraInfoDoctorById = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter'
                })
                return;
            } else {
                let data = await db.Doctor_Info.findOne({
                    where: {
                        doctorId: doctorId
                    },
                    attributes: {
                        exclude: ['id', 'doctorId']
                    },
                    include: [
                        { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                    ],
                    raw: false,
                    nest: true
                })
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
};

let getProfileDoctorById = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter'
                })
                return;
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: doctorId
                    },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {
                            model: db.Markdown,
                            attributes: ['description', 'contentHTML', 'contentMarkdown']
                        },
                        {
                            model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi']
                        },
                        {
                            model: db.Doctor_Info,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                if (data && data.image) {
                    data.image = Buffer.from(data.image, 'base64').toString('binary');
                }
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e)
        }
    })
};

let getListPatientForDoctor = (doctorId, date) => {

    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter'
                })
                return;
            } else {
                let data = await db.Booking.findAll({
                    where: {
                        statusId: 'S2',
                        doctorId: doctorId,
                        date: date
                    },
                    include: [
                        {
                            model: db.User, as: 'patientData',
                            attributes: ['email', 'firstName', 'address', 'gender'],
                            include: [
                                {
                                    model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi']
                                },
                            ]
                        },
                        {
                            model: db.Allcode, as: 'timeTypeDataPatient',
                            attributes: ['valueEn', 'valueVi']
                        }
                    ],
                    raw: false,
                    nest: true
                })
                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e)
        }
    })
};

let sendRemedy = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.patientId || !data.timeType) {
                resolve({
                    errCode: 1,
                    errMsg: 'Missing required parameter'
                })
                return;
            } else {
                //update patient status
                let appointment = await db.Booking.findOne({
                    where: {
                        patientId: data.patientId,
                        doctorId: data.doctorId,
                        timeType: data.timeType,
                        statusId: 'S2'
                    },
                    raw: false
                })

                if (appointment) {
                    appointment.statusId = 'S3'
                    await appointment.save();
                }
                //send email remedy
                await emailService.sendAttachment(data);
                resolve({
                    errCode: 0,
                    errMsg: 'Ok'
                })
            }
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    saveDetailInforDoctor: saveDetailInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    createSchedule: createSchedule,
    getScheduleByDate: getScheduleByDate,
    getExtraInfoDoctorById: getExtraInfoDoctorById,
    getProfileDoctorById: getProfileDoctorById,
    getListPatientForDoctor: getListPatientForDoctor,
    sendRemedy: sendRemedy
}