const mysql = require("mysql2");
const dbInfo = require("../../../vp2024config")
const asyn = require("async");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

//@desc home page for eestiFilm
//@route GET /api/eestifilm
//@access private

const filmHome = (req, res)=>{
	res.render("eestifilm")
};

//@desc view characters
//@route GET /api/eestifilm
//@access private

const filmChar = (req, res)=>{
	//loon andmebaasi päringus
	let sqlReq = "SELECT id, first_name, last_name, birth_date FROM person";
	conn.query(sqlReq, (err, sqlRes)=>{
		if(err){
			//res.render("tegelased", {persons: [first_name: "Ei", last_name: "leidnud", birth_date: "VIGA"]});
			throw err;
		}
		else{
			//console.log(sqlres);
			res.render("tegelased", {persons: sqlRes})
		}
	});
	//res.render("tegelased")
};

//@desc add characters
//@route GET /api/eestifilm
//@access private

const addChar = (req, res)=>{
	res.render("addperson");
};

//@desc adding characters
//@route POST /api/eestifilm
//@access private

const addingChar = (req, res) => {
    let notice = "";
    let firstName = req.body.firstNameInput;
    let lastName = req.body.lastNameInput;
    let birthDate = req.body.birthDateInput;
    let filmTitle = req.body.Title;
    let productionYear = req.body.productionYear;
    let duration = req.body.duration;
    let filmDescription = req.body.description;
    let positionName = req.body.positionName;
    let positionDescription = req.body.positionDescription;

    if (req.body.personSubmit) {
        let sqlReq = "INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)";
        conn.query(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, sqlRes) => {
            if (err) {
                notice = "Midagi läks tegelase lisamisel valesti :(";
                res.render("addperson", { notice: notice });
                throw err;
            } else {
                notice = "Tegelane lisatud!";
                res.render("addperson", { notice: notice });
            }
        });
    } else if (req.body.filmSubmit) {
        let sqlReq = "INSERT INTO movie (title, production_year, duration, description) VALUES (?,?,?,?)";
        conn.query(sqlReq, [req.body.filmTitle, req.body.productionYear, req.body.duration, req.body.filmDescription], (err, sqlRes) => {
            if (err) {
                notice = "Midagi läks filmi lisamisel valesti :(";
                res.render("addperson", { notice: notice });
                throw err;
            } else {
                notice = "Film lisatud!";
                res.render("addperson", { notice: notice });
            }
        });
    } else if (req.body.roleSubmit) {
        let sqlReq = "INSERT INTO `position` (position_name, description) VALUES (?, ?)";
        conn.query(sqlReq, [positionName, positionDescription], (err, sqlRes) => {
            if (err) {
                notice = "Midagi läks tegelase rolli lisamisel valesti :(";
                res.render("addperson", {notice: notice});
                throw err;
            } else {
                notice = "Roll lisatud!";
                res.render("addperson", {notice: notice});
            }
        });
    }
};

//@desc add connection
//@route GET /api/eestifilm
//@access private

const addCon = (req, res)=>{
	//kasutades async moodulit panen mitu andmebaasipäringut paraleelset toimima
	//loon SQL päringute (lausa tegevuste ehk funksioonide) loendi
	const myQueries = [
		function(callback){
			conn.execute("SELECT id, first_name, last_name, birth_date FROM person", (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},		
		function(callback){
			conn.execute("SELECT id, title, production_year FROM movie", (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			conn.execute("SELECT id, position_name FROM position", (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
	];
	//paneme need tegevused paralleelset tööle, tulemuse saab kui kõik tehtud
	//Välundiks üks koondlist
	asyn.parallel(myQueries, (err, results)=>{
		if(err){
			throw err;
		} else{
			console.log(results);
			res.render("addrelation", {personList: results[0], movieList: results[1], positionList: results[2]});
		}
	});
/* 	let sqlReq = "SELECT id, first_name, last_name, birth_date FROM person";
	conn.execute(sqlReq, (err, result)=>{
		if(err){
			throw err;
		}
		else{
			console.log(result);
			res.render("addrelation", {personList: result});
		}
	}); */
	//res.render("addrelation");
};

//@desc view relation
//@route GET /api/eestifilm
//@access private

const viewRelation = (req, res)=>{
	console.log(req.params);
	res.render("personrelations");
};

module.exports = {
	filmHome,
	filmChar,
	addChar,
	addingChar,
	addCon,
	viewRelation
};