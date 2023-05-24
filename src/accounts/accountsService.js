const { omit } = require('lodash');
const cloudinary = require('cloudinary').v2;
const { cloudinary: cloudinaryConfig } = require('../../config');
const { ACCOUNT_TYPES } = require('../../constant');
const { deleteFile } = require('./helper');
const Account = require('../../model/account');
const { NotFoundError } = require('../../utils/customError');
const Mentor = require('../../model/mentor');
const Student = require('../../model/student');
const Model = {
  mentor: Mentor,
  student: Student,
};
const { validateCredentials } = require('../../utils/helper');
cloudinary.config({
  cloud_name: cloudinaryConfig.name,
  api_key: cloudinaryConfig.key,
  api_secret: cloudinaryConfig.secret,
});

async function accountExists(email) {
  const account = await Account.findOne({ email });

  if (account) {
    return true;
  }

  return false;
}

async function getStudents() {
  const students = await Account.find({
    accountType: ACCOUNT_TYPES.STUDENT,
  }).populate('owner');

  return students;
}

async function getMentors() {
  const mentors = await Account.find({
    accountType: ACCOUNT_TYPES.MENTOR,
  }).populate('owner');

  return mentors;
}

async function getSingleAccount(id) {
  const account = await Account.findById(id).populate('owner');

  return account;
}

async function uploadProfilePicture({ id, filepath }) {
  try {
    const account = await Account.findById(id);
    if (!account) {
      const error = new NotFoundError('Account not found!');
      return error;
    }

    const cloudinaryUpload = await cloudinary.uploader.upload(filepath, {
      public_id: `${cloudinaryConfig.folder}/images/profile-pictures/${id}`,
    });

    account.profilePicture = cloudinaryUpload.secure_url;
    await account.save();

    deleteFile(filepath);

    return account;
  } catch (error) {
    return error;
  }
}

async function updateAccount({ id, payload }) {
  const student = await Account.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
    context: 'query',
  }).populate('owner');

  return student;
}

async function changeAccountPassword({ id, password }) {
  let account = await Account.findById(id).populate('owner');
  if (!account) {
    return false;
  }

  // save password from request
  account.password = password;
  await account.save();

  // prepare response data
  omit(account.toObject(), ['password']);
  account = omit(account.toObject(), ['password']);

  return account;
}

async function deleteAccount({ id, password }) {
  let account = await Account.findById(id).populate('owner');

  let deletedAccount = await validateCredentials(account.email, password);

  if (!deletedAccount) {
    throw new UnAuthorizedError('Invalid credentials!');
  }
  account.isDeleted = true;
  account.save();

  return account;
}

async function createAccount({ category, altSchoolId, ...payload }) {
  const obj = (altSchoolId && { altSchoolId }) || {};
  const { _id: owner } = await Model[category.toLowerCase()].create(obj);
  const account = await Account.create({
    ...payload,
    owner,
    accountType: category,
  });
  await account.populate('owner');
  return account;
}

module.exports = {
  accountExists,
  createAccount,
  changeAccountPassword,
  getMentors,
  getSingleAccount,
  getStudents,
  updateAccount,
  uploadProfilePicture,
  deleteAccount,
};
