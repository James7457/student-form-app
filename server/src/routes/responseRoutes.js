const express = require("express");

const {
  submitResponse,
  getFormResponses,
  exportResponsesCSV,
} = require("../controllers/responseController");

const router = express.Router();


/* Submit response */

router.post(
  "/",
  submitResponse
);


/* View responses */

router.get(
  "/form/:formId",
  getFormResponses
);


/* Export CSV */

router.get(
  "/form/:formId/csv",
  exportResponsesCSV
);


module.exports = router;