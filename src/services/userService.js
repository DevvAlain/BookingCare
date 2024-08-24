import { where } from 'sequelize';
import db from '../models/index';
import bcrypt from "bcryptjs";

const salt = bcrypt.genSaltSync(10);

let hashUserPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let hashPassword = await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch (e) { 
            reject(e);
        }
    });
};

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist) {
                let user = await db.User.findOne({
                    attributes: ['email', 'roleId', 'password', 'firstName', 'lastName'],
                    where: { email: email },
                    raw: true,
                    // attributes: {
                    //     include: ['email', 'roleId'], // include muon lay th nao exclude k mun lay th nao
                    // }
                });
                if (user) {
                    let hashPassword = await bcrypt.compare(password, user.password);
                    if (hashPassword) {
                        userData.errCode = 0;
                        userData.errMsg = 'OK';

                        delete user.password;
                        userData.user = user;
                        resolve(userData);
                    } else {
                        userData.errCode = 3;
                        userData.errMsg = 'Password is incorrect';
                        resolve(userData);
                    }
                } else {
                    userData.errCode = 2;
                    userData.errMsg = 'User not found';
                    resolve(userData);
                }
            } else {
                userData.errCode = 1;
                userData.errMsg = 'Email not found';
                resolve(userData);
            }
        } catch (e) {
            reject(e);
        }
    })
};

let checkUserEmail = (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: email }
            });
            if (user) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (e) {
            reject(e);
        }
    });
};

let getAllUsers = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = '';
            if (userId === 'ALL') {
                users = await db.User.findAll({
                    attributes: {
                        exclude: ['password']
                    }
                });
            }
            if (userId && userId !== 'ALL') {
                users = await db.User.findOne({
                    where: {
                        id: userId
                    },
                    attributes: {
                        exclude: ['password']
                    }
                });
            }
            resolve(users);
        } catch (e) {
            reject(e);
        }
    })
}

let createNewUser = async (data) => {
    return new Promise (async (resolve, reject) => {
        try {
            // Check email is exist?
            let check = await checkUserEmail(data.email);
            if (check === true) {
                resolve({
                    errCode: 1,
                    errMsg: 'Email is already exist',
                });
            } else {
                let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phoneNumber: data.phoneNumber,
                    address: data.address,
                    gender: data.gender === '1' ? true : false,
                    roleId: data.roleId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                resolve({
                    errCode: 0,
                    errMsg: 'Create user success',
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Kiểm tra sự tồn tại của người dùng với userId
            let user = await db.User.findOne({
                where: { id: userId }
            });

            if (!user) {
                resolve({
                    errCode: 2,
                    errMsg: 'User not found',
                });
            } else {
                // Thực hiện xóa người dùng
                await db.User.destroy({
                    where: {
                        id: userId
                    }
                });
                resolve({
                    errCode: 0,
                    errMsg: 'Delete user success',
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};

let updateUserData = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id) {
                resolve({
                    errCode: 2,
                    errMsg: 'User ID is required',
                });
                return;
            }

            // Kiểm tra sự tồn tại của người dùng với userId
            let user = await db.User.findOne({
                where: { id: data.id },
                raw: false
            });

            if (user) {
                // Cập nhật các thông tin người dùng
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;


                // Lưu các thay đổi
                await user.save();

                resolve({
                    errCode: 0,
                    errMsg: 'Update user data success',
                });
            } else {
                resolve({
                    errCode: 2,
                    errMsg: 'User not found',
                });
            }
        } catch (e) {
            reject({
                errCode: 1,
                errMsg: 'An error occurred while updating user data',
                errorDetail: e.message,
            });
        }
    });
};

let getAllCodeService = async (typeInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!typeInput) {
                resolve({
                    errCode: 1,
                    errMsg: 'Type input is required',
                });
            } else {
                let allcode = await db.Allcode.findAll({
                    where: {
                        type: typeInput
                    }
                });
                resolve({
                    errCode: 0,
                    data: allcode
                });
            }
        } catch (e) {
            reject(e);
        }
    });
};



module.exports = {
    handleUserLogin: handleUserLogin,
    getAllUsers: getAllUsers,
    createNewUser: createNewUser,
    deleteUser: deleteUser,
    updateUserData: updateUserData,
    getAllCodeService: getAllCodeService

}