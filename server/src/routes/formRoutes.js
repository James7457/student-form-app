const express = require("express");

const {
  createForm,
  getForms,
  getFormById,
  getPublicForm,
} = require("../controllers/formController");

const router = express.Router();


/* Create form */

router.post(
  "/",
  createForm
);


/* Get all forms */

router.get(
  "/",
  getForms
);


/* Public form */

router.get(
  "/public/:id",
  getPublicForm
);


/* Get form by ID */

router.get(
  "/:id",
  getFormById
);


module.exports = router;