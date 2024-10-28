const express = require("express");
const dateTime = require("./dateTime");
const fs = require("fs");
//et saada kõik päringust kätte:
const bodyparser = require("body-parser");
//andmebaasi andmed
const dbInfo = require("../../vp2024config")
// suhtlemine andmebaasiga
const mysql = require("mysql2");
//fotode ülesslaadimiseks
const multer = require("multer");
//fotomaniuplatsiooniks
const sharp = require("sharp");

const app = express();

//määran view mootori
app.set("view engine", "ejs");
//Määran jagatavate, avalike failide kausta
app.use(express.static("public"));
//kasutame body-parserit päringute parsimiseks (kui ainult tekst, siis false, kui ka pildid jms, siis true)
app.use(bodyparser.urlencoded({extended: true}))
//seadistame fotode ülesslaadimiseks vahevara (middleware), mis määrab kataloogi, kuhu laetakse.
const upload = multer({dest: "./public/gallery/orig"});

//loon andmebaasiühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

app.get("/", (req, res)=>{
	//res.send("Express läks käima!");
	//console.log(dbInfo.configData.host);
	res.render("index");
});


app.get("/timenow", (req, res)=>{
	const weekdayNow = dateTime.weekDayEt();
	const dateNow = dateTime.dateFormattedEt();
	const timeNow = dateTime.timeFormattedEt();
	res.render("timenow", {nowWD: weekdayNow, nowD: dateNow, nowT: timeNow});
});

app.get("/vanasonad", (req, res)=>{
	let folkWisdom = [];
	fs.readFile("public/textfiles/vanasonad.txt", "utf8", (err, data)=>{
		if(err){
			throw err;	
		}
		else{
			folkWisdom = data.split(";");
			res.render("justlist", {h2: "Vanasõnad", listData: folkWisdom
			});
		}
	});
});

app.get("/regvisit", (req, res)=>{
	res.render("regvisit")
});

app.post("/regvisit", (req, res)=>{
	const aegHetkel = new Date().toLocaleString("et-EE");
	//console.log(req.body)
	//avan txt faili selliselt, et kui seda pole olemas, luuakse
	fs.open("public/textfiles/log.txt", "a", (err, file) => {
		if(err){
			throw err;
		}
		else {
			fs.appendFile("public/textfiles/log.txt", req.body.firstNameInput + " " + req.body.lastNameInput + " " + aegHetkel + ";", (err)=>{
				if(err){
					throw err;
				}
				else {
					console.log("Faili kirjutati!");
					res.render("regvisit");
				}
			});
		}
	});
	//res.render("regvisit")
});

app.get("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = ""
	res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
});

app.post("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = ""
	//kontrollin kas kõik vajalikud andmed on olemas
	if(!req.body.firstNameInput || !req.body.lastNameInput){
		//console.log("Osa andmeid puudub!");
		notice = "Osa andmeid on puudu!"
		firstName = req.body.FirstNameInput;
		lastName = req.body.lastNameInput;
		res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
	}
	else {
		let sqlReq = "INSERT INTO vp2visitlog (first_name, last_name) VALUES (?,?)";
		conn.query(sqlReq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlRes)=>{
			if(err){
				firstName = req.body.firstNameInput;
				lastName = req.body.lastNameInput;
				notice = "Tehnilistel põhjustel, süsteem lakkas töötamast :("
				res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
				throw err;
			}
			else {
				firstName = req.body.firstNameInput;
				lastName = req.body.lastNameInput;
				notice = "Andmed Salvestati!";
				res.render("regvisitdb", {notice: notice, firstName: firstName, lastName: lastName});
			}
		});
	}
});

app.get("/kulalisedDB", (req, res) => {
    let sqlReq = "SELECT first_name, last_name FROM vp2visitlog";
    conn.query(sqlReq, (err, results) => {
        if (err){
            return res.render("kulalisedDB", { notice: "Tehnilistel põhjustel, süsteem lakkas töötamast :(", names: [] });
        }
        res.render("kulalisedDB", { notice: "", names: results });
    });
});

app.get("/kulalised", (req, res) => {
	let visitorsList = [];
	fs.readFile("public/textfiles/log.txt", "utf8", (err, data) => {
		if (err) {
			throw err;
		} 
		else {
			visitorsList = data.split(";")
			res.render("kulalised", { visitorData: visitorsList });
		}
	});
});

app.get("/eestifilm", (req, res)=>{
	res.render("eestifilm")
});
app.get("/eestifilm/tegelased", (req, res)=>{
	//loon andmebaasi päringus
	let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
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
});

app.get("/eestifilm/lisa", (req, res)=>{
	res.render("addperson")
});

app.post("/eestifilm/lisa", (req, res) => {
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
});

app.get("/photoupload", (req, res)=>{
	res.render("photoupload")
});

app.post("/photoupload", upload.single("photoInput"), (req, res)=>{
	console.log(req.body);
	console.log(req.file);
	const fileName = "vp_" + Date.now() + ".jpg";
	fs.rename(req.file.path, req.file.destination + "/" + fileName, (err)=>{
		console.log("Faili nime muutmise viga: " + err);
	});
	sharp(req.file.destination + "/" + fileName).resize(800,600).jpeg({quality: 90}).toFile("./public/gallery/normal/" + fileName);
	sharp(req.file.destination + "/" + fileName).resize(100,100).jpeg({quality: 90}).toFile("./public/gallery/thumb/" + fileName);
	//salvestame info andmebaasi
	let sqlReq = "INSERT INTO vp2photos (file_name, orig_name, alt_text, privacy, user_id) VALUES(?,?,?,?,?)";
	const userId = 1;
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId], (err, result)=>{
		if(err) {
			throw(err);
		}
		else {
			res.render("photoupload");
		}
	});
});

app.get("/photosgallery", (req, res)=>{
	let sqlReq = "SELECT file_name, alt_text FROM vp2photos WHERE privacy == ? AND deleted is NULL ORDER BY id DESC";
	const privacy = 3;
	let photoList = [];
	conn.query(sqlReq, [privacy], (err, result)=>{
		if(err){
			throw(err);
		}
		else{
			console.log(result);
			result.forEach(photo => {
				photoList.push({}href: "gallery/thumb/" + photo.file_name, alt: photo.alt_text);
			}
			res.render("photosgallery", {listData: photoList});
		}
	});
});


app.listen(5205);