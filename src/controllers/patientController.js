import patientService from '../services/patientService';

let createBookAppointment = async (req, res) => {
    try {
        let response = await patientService.createBookAppointment(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        })
    }
};

let postVerifyBookAppointment = async (req, res) => {
    try {
        let response = await patientService.postVerifyBookAppointment(req.body);
        return res.status(200).json(response);
    } catch (e) {
        return res.status(200).json({
            errCode: -1,
            errMsg: 'An error occurred on the server'
        });
    }
};


module.exports = {
    createBookAppointment: createBookAppointment,
    postVerifyBookAppointment: postVerifyBookAppointment
}