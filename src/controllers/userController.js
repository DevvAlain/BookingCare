import userService from '../services/userService';
const { updateUserData } = require('../services/userService');


let handleLogin = async (req, res) => {
    try {
        let email = req.body.email;
        let password = req.body.password;

        if (!email || !password) {
            return res.status(500).json({
                errCode: 1,
                message: 'Missing input parameter'
            });
        };

        let userData = await userService.handleUserLogin(email, password);  

        return res.status(200).json({
            errCode: userData.errCode,
            message: userData.errMsg,
            user: userData.user ? userData.user : {}
        });
    } catch (e) {
        console.error(e); // Log error
        res.status(500).json({
            errCode: -1,
            message: 'An error occurred on the server'
        });
    }
};

let handleGetAllUsers = async (req, res) => {
    let id = req.query.id; // ALL: lay tat ca user, id: lay chinh xac user do ra

    if (!id) {
        return res.status(200).json({
            errCode: 1,
            errMsg: 'Missing required parameters',
            users: []
        })
    }

    let users = await userService.getAllUsers(id);
    return res.status(200).json({
        errCode: 0,
        errMsg: 'OK',
        users: users
    })
}

let handleCreateNewUser = async (req, res) => { 
    let message = await userService.createNewUser (req.body);
    return res.status(200).json(message);
}

let handleEditUser = async (req, res) => {
    let data = req.body;
    try {
        let message = await updateUserData(data);
        return res.status(200).json(message);
    } catch (error) {
        return res.status(500).json({
            errCode: 1,
            errMsg: 'Failed to update user data',
            errorDetail: error.message,
        });
    }
};

let handleDeleteUser = async (req, res) => {
    if (!req.body.id) {
        return res.status(200).json({
            errCode: 1,
            message: 'Missing required parameters'
        });
    }
    let message = await userService.deleteUser (req.body.id);
    return res.status(200).json(message);
}


module.exports = {
    handleLogin: handleLogin,
    handleGetAllUsers: handleGetAllUsers,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,

}
