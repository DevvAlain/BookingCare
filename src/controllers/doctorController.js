import doctorService from '../services/doctorService';


let getTopDoctorHome = async (req, res) => {
    let limit = req.query.limit;
    if (!limit) limit = 10;
    try {
        let response = await doctorService.getTopDoctorHome(+limit);
        return res.status(200).json(response);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
};

let getAllDoctors = async (req, res) => {
    try {
        let doctors = await doctorService.getAllDoctors();
        return res.status(200).json(doctors);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
};

let postInforDoctor = async (req, res) => {
    try {
        let response = await doctorService.saveDetailInforDoctor(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
};

let getDetailDoctorById = async (req, res) => {
    try {
        let info = await doctorService.getDetailDoctorById(req.query.id);
        return res.status(200).json(info)
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
};

let createSchedule = async (req, res) => {
    try {
        let response = await doctorService.createSchedule(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
};

let getScheduleByDate = async (req, res) => {
    try {
        let response = await doctorService.getScheduleByDate(req.query.doctorId, req.query.date);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
};

let getExtraInfoDoctorById = async (req, res) => {
    try {
        let response = await doctorService.getExtraInfoDoctorById(req.query.doctorId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
};

let getProfileDoctorById = async (req, res) => {
    try {
        let response = await doctorService.getProfileDoctorById(req.query.doctorId);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
}

module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    postInforDoctor: postInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    createSchedule: createSchedule,
    getScheduleByDate: getScheduleByDate,
    getExtraInfoDoctorById: getExtraInfoDoctorById,
    getProfileDoctorById: getProfileDoctorById

}