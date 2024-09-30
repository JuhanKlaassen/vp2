
	const monthNamesEt = ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"]; 
	const weekdayNamesEt = ["pühapäev", "esmaspäev", "teisipäev", "kolmapäev", "neljapäev", "reede", "laupäev"];
	
//function dateFormatted(){
	const dateFormattedEt = function() {
		let timeNow = new Date();
		let dateNow = timeNow.getDate();
		let monthNow = timeNow.getMonth();
		let yearNow = timeNow.getFullYear();
		let dateEt = dateNow + ". " + monthNamesEt[monthNow] + " " + yearNow;
		return dateEt;
	};
	
const weekDayEt = function() {
		let dayPrgu = new Date();
		let dayNow = dayPrgu.getDay();
		let dayEt = weekdayNamesEt[dayNow];
		return dayEt;
}
const timeFormattedEt = function() {
    let kellNow = new Date();
    let hourNow = kellNow.getHours();
    let minuteNow = kellNow.getMinutes().toString().padStart(2, '0');
    let secondNow = kellNow.getSeconds().toString().padStart(2, '0');
    let timePrgu = hourNow + ":" + minuteNow + ":" + secondNow;
    return timePrgu;
};

const partOfDay = function() {
    let dpart = "suvaline aeg"; 
    let now = new Date();
    let hourNow = now.getHours();
    let dayNow = now.getDay(); 
    if (dayNow >= 1 && dayNow <= 5) {
        if (hourNow > 8 && hourNow <= 16) {
            dpart = "kooliaeg";  
        } else  if (hourNow > 16 && hourNow <= 24) {
            	dpart = "puhkeaeg";  
			} else if (hourNow < 8) {
				dpart = "uneaeg";
        }
    } else {
		if (hourNow > 8 && hourNow <= 24) {
            dpart = "puhkeaeg" 
		} else { dpart = "uneaeg"
		}
    }

    return dpart;  
};
module.exports = {
    dateFormattedEt: dateFormattedEt,
    weekDayEt: weekDayEt,
    timeFormattedEt: timeFormattedEt,
    weekdayNamesEt: weekdayNamesEt,
    monthNamesEt: monthNamesEt,
    dayPart: partOfDay                 
};