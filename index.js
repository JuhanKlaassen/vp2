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
//paroolde krüpteerimiseks
const bcrypt = require("bcrypt");
//sessioonihaldur
const session = require("express-session");
//asünkroosuse võimaldaja
const asyn = require("async");

const app = express();

//määran view mootori
app.set("view engine", "ejs");
//Määran jagatavate, avalike failide kausta
app.use(express.static("public"));
//kasutame body-parserit päringute parsimiseks (kui ainult tekst, siis false, kui ka pildid jms, siis true)
app.use(bodyparser.urlencoded({extended: true}));
//seadistame fotode ülesslaadimiseks vahevara (middleware), mis määrab kataloogi, kuhu laetakse.
const upload = multer({dest: "./public/gallery/orig"});
//sessioonihaldur
app.use(session({secret: "minuAbsoluutseltSalajaneVõti", saveUninitialized: true, resave: true}));
//let mySession;

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


//uudiste osa eraldi ruuteriga
const newsRouter = require("./routes/newsRouter");
app.use("/news", newsRouter);

//eestifilm osa eraldi ruuteriga
const filmRouter = require("./routes/filmRouter");
app.use("/eestifilm", filmRouter)

app.post("/", (req, res)=>{
	let notice = null;
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log("Sisselogimise andmed pole täielikud!");
		notice = "Sisselogimise andmeid on puudu!";
		res.render("index", {notice: notice});
	}
	else {
		let sqlReq = "SELECT id,password FROM vp2users WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
				notice = "Tehnilise vea tõttu ei saa sisse logida!";
				console.log(err);
				res.render("index", {notice: notice});
			}
			else {
				if(result[0] != null){
					//kontrollime, kas sisselogimisel sisestatud paroolist saaks sellise rأ¤si nagu andmebaasis
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
						if(err){
							notice = "Tehnilise vea tõttu andmete kontrollimisel ei saa sisse logida!";
							console.log(err);
							res.render("index", {notice: notice});
						}
						else {
							//kui võrdlustulemus on positiivne
							if(compareresult){
								notice = "Oledki sisse loginud!";
								//võtame sessiooni kasutusele
								//mySession = req.session;
								//mySession.userId = result[0].id;
								req.session.userId = result[0].id;
								//res.render("index", {notice: notice});
								res.redirect("/home");
							}
							else {
								notice = "Kasutajatunnus ja/või parool oli vale!";
								res.render("index", {notice: notice});
							}
						}
					});
				}
				else {
					notice = "Kasutajatunnus või parool oli vale!";
					res.render("index", {notice: notice});
				}
			}
		});
	}
	//res.render("index");
});

app.get("/home", checkLogin, (req, res)=>{
	console.log("Sisse on loginud kasutaja : " + req.session.userId);
	res.render("home");
});

app.get("/signup", (req, res)=>{
	res.render("signup");
});

app.get("/logout", (req, res)=>{
	req.session.destroy();
	//mySession = null;
	res.redirect("/");
});


app.post("/signup", (req, res) => {
    let notice = "Ootan andmeid";
    if (!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput) {
        console.log("Andmeid puudu või parool ei klapi");
        notice = "Andmeid on puudu või paroolid ei kattu!!!!";
        res.render("signup", { notice: notice });
    } else {
        notice = "Andmed korras!";
        let emailKontroll = "SELECT email FROM vp2users WHERE email = ?";
        conn.execute(emailKontroll, [req.body.emailInput], (err, results) => {
            if (err) {
                notice = "Tehniline viga, kasutajat ei loodud.";
                res.render("signup", { notice: notice });
            } else if (results.length > 0) {
                notice = "See e-posti aadress on juba kasutusel.";
                res.render("signup", { notice: notice });
            } else {
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        notice = "Tehniline viga, kasutajat ei loodud.";
                        res.render("signup", { notice: notice });
                    } else {
                        bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash) => {
                            if (err) {
                                notice = "Tehniline viga, kasutajat ei loodud.";
                                res.render("signup", { notice: notice });
                            } else {
                                let sqlReq = "INSERT INTO vp2users (first_name, last_name, birth_date, gender, email, password) VALUES(?,?,?,?,?,?)";
                                conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result) => {
                                    if (err) {
                                        notice = "Tehniline viga andmebaasi kirjutamisel.";
                                        res.render("signup", { notice: notice });
                                    } else {
                                        notice = "Kasutaja " + req.body.emailInput + " edukalt loodud!";
                                        res.render("signup", { notice: notice });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
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
	let sqlReq = "SELECT id, file_name, alt_text FROM vp2photos WHERE privacy = ? AND deleted IS NULL ORDER BY id DESC";
	const privacy = 3;
	let photoList = [];
	conn.execute(sqlReq, [privacy], (err, result)=>{
		if(err){
			throw err;
		}
		else {
			console.log(result);
			for(let i = 0; i < result.length; i ++) {
				photoList.push({id: result[i].id,  href: "/gallery/thumb/", filename: result[i].file_name, alt: result[i].alt_text});
			}
			res.render("photosgallery", {listData: photoList});
		}
	});
	//res.render("gallery");
});


function checkLogin(req, res, next){
	if(req.session != null){
		if(req.session.userId){
			console.log("Login ok!");
			next();
		}
		else {
			console.log("Login not detected!");
			res.redirect("/");
		}
	}
	else {
		res.redirect("/");
	}
}

app.listen(5205);