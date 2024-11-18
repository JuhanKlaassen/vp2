const express = require("express");
const router = express.Router();
const bodyparser = require("body-parser");
const general = require("../generalFnc");
const {filmHome,
	filmChar,
	addChar,
	addingChar,
	addCon,
	viewRelation} = require("../controllers/filmController")

router.use(general.checkLogin);

router.route("/").get(filmHome);

router.route("/tegelased").get(filmChar);

router.route("/lisa").get(addChar);

router.route("/lisa").post(addingChar);

router.route("/lisaseos").get(addCon);

router.route("personrelations/:id").get(viewRelation);

module.exports = router;