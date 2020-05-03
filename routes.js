const express = require('express');
const router = express.Router();
const db = require('./db');
const { User, Course} = db.models;
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const { check, validationResult } = require('express-validator');

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async (req, res, next)=>{
    try {
      await cb(req, res, next);
    } catch(err){
      next(err);
    }
  };
};

/* User Authentication Middleware */
const authenticateUser = asyncHandler(async (req, res, next) => {
  let message = null;   // initial state of error message variable.
  // Parse the user's credentials from the Authorization header.
  const credentials = auth(req);
  // If the user's credentials are available...
  if (credentials) {
    // Attempt to retrieve the user from the data store by their email address.
    const users = await User.findAll();
    const user = users.find(u => u.emailAddress === credentials.name);
    // If a user was successfully retrieved from the data store...
    if (user) {
      // Use the bcryptjs npm package to compare the user's password (from the Authorization header) to the user's password that was retrieved from the data store.
      const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
      // If the passwords match...
      if (authenticated) {
        // Then store the retrieved user object on the request object so any middleware functions that follow this middleware function will have access to the user's information.
        console.log(`Authentication successful for username: ${user.emailAddress}`);
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.emailAddress}`;
      }
    } else {
      message = `User not found for username: ${credentials.name}`;
    }
  } else {
    message = 'Auth header not found';
  }
  // If user authentication failed (if there are error messages stored in the variabel)...
  if (message) {
    console.warn(message);
    // Return a response with a 401 Unauthorized HTTP status code.
    res.status(401).json({ message: 'Access Denied' });
  } else {
    // Or if user authentication succeeded...
    // Call the next() method.
    next();
  }
});

/* GET the current authenticated user. */
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const user = req.currentUser;
  const authUser = await User.findByPk(user.id, {
        attributes: [
            'firstName', 
            'lastName', 
            'emailAddress'
        ]
    });
  res.status(200).json(authUser);
}));

/* POST a new user. */
router.post('/users', [
  check('firstName')
    .exists()
    .withMessage('Please provide a value for "firstName"'),
  check('lastName')
    .exists()
    .withMessage('Please provide a value for "lastName"'),
  check('emailAddress')
    .isEmail()
    .withMessage('Please provide a valid email address for "emailAddress"'),
  check('password')
    .exists()
    .withMessage('Please provide a value for "password"'),
  ], asyncHandler (async (req, res) => {
    const errors = validationResult(req);
    // If there are validation errorr, return the validation errors to the client.
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ errors: errorMessages });
    } else {
        // Hash the password and create new user.
        req.body.password = bcryptjs.hashSync(req.body.password);
        user = await User.create(req.body);
        res.location('/');
        res.status(201).end();
    }
}));

/* GET all courses listing (including the user that owns each course). */
router.get('/courses', asyncHandler(async (req, res) => {
  const courseList = await Course.findAll({
    include: [
      {model: User,
       attributes: [
            'id',
            'firstName', 
            'lastName', 
            'emailAddress'
        ]
      },
    ],
  });
  res.status(200).json(courseList);
}));

/* GET individual course (including the user that owns the course) for the provided course ID */
router.get("/courses/:id", asyncHandler(async (req, res) => {
  const course = await Course.findByPk(req.params.id, {
    attributes: [
        'id',  
        'title', 
        'description', 
        'estimatedTime', 
        'materialsNeeded'
    ],
    include: [
      {model: User,
       attributes: [
            'id',
            'firstName', 
            'lastName', 
            'emailAddress'
        ]
      },
    ],
    });
    if(course) {
      res.status(200).json(course); 
    } else {
      res.status(404).json({ message: "Course Not Found" });
    }
})); 

/* POST a new course. */
router.post('/courses', authenticateUser, [
  check('title')
    .exists()
    .withMessage('Please provide a value for "title"'),
  check('description')
    .exists()
    .withMessage('Please provide a value for "description"'),
  ], asyncHandler (async (req, res) => {
  const errors = validationResult(req);
// If there are validation errorr, return the validation errors to the client.
    if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({ errors: errorMessages });
  } else {
      // Otherwise, add the new course.
      course = await Course.create(req.body);
      res.location('courses/' + course.id);
      res.status(201).end();
    }
}));

/* Update a course. */
router.put('/courses/:id', authenticateUser, [
  check('title')
    .exists()
    .withMessage('Please provide a value for "title"'),
  check('description')
    .exists()
    .withMessage('Please provide a value for "description"'),
  ], asyncHandler (async (req, res) => {
  const errors = validationResult(req);
  // If there are validation errorr, return the validation errors to the client.
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    res.status(400).json({ errors: errorMessages });
  } else {
      // Check if the course actually exists; if so, update the course with the new information.
      course = await Course.findByPk(req.params.id);
      if(course) {
        await course.update(req.body);
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Course Not Found" });
      }
    }
}));

/* Delete individual course. */
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req ,res) => {
  const course = await Course.findByPk(req.params.id);
  if(course) {
    await course.destroy();
    res.status(204).end();
  } else {
    res.status(404).json({ message: "Course Not Found" });
  }
}));

module.exports = router;