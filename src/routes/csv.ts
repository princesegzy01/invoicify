import express from "express";
import moment from "moment";
import _ from "lodash";



const fs = require("fs");

const multer = require("multer");
const csv = require("fast-csv");

const upload = multer({ dest: "tmp/csv/" });

const router = express.Router();

/* GET home page. */
router.post("/", upload.single("csvdata"), (req: express.Request , res: express.Response, next) => {

    // container to handle all processed bill
    const fileRows: any[] = [];

    let x = 0;
        csv.parseFile(req.file.path).on("data", (data: string[]) => {

			let dataLine: any[] = data;
	
			if (x === 0 ) {

				// add extra colum headers to the headings
				dataLine.push("cost");
				dataLine.push("num hrs");
			} else {

				const fullStartDate = dataLine[3] + " " +  dataLine[4];
				const fullEndDate = dataLine[3] + " " +  dataLine[5];

				// get hour differences between the start time and end time.
				const num_hours = getHourDifference(fullStartDate, fullEndDate);

				// get the lawyer billbable rate per hour
				let billableRate: number = parseFloat(dataLine[1]);

				// get the total cost by multiplying 
				// billable hour by the hours spent
				let totalBill: number = billableRate * num_hours;

				// push the 2 new colum to the bill array
				dataLine.push(totalBill);
				dataLine.push(num_hours);
			}
			
			// push each processed bill to a new array
			fileRows.push(dataLine);

			x += 1; 

    	}).on("end", () => {
                
			// delete the heading from the csv array
			fileRows.shift();
			const dataBody = fileRows;

			// create a bill array
			let billArray: object[] = [];

			// loop through all bills and create a bill objects from it
			dataBody.forEach((element) => { 

				const billObj = {
					employee : element[0],
					hour_rate : element[1],
					project : element[2],
					cost : element[6],
					num_hrs : element[7],
				};

				billArray.push(billObj);
			});

			// group all similar bills based on the projects 
			const groupData = _.groupBy(billArray, (b) => b.project);

			// get all the project keys
			const companykeys = Object.keys(groupData);

			// create each company container
			let  companyData: any[] = [];

			// loop through each keys ans store each company bills in an array of aray
			companykeys.forEach((key) => {
				companyData.push(groupData[key]);
			});

			// remove temp file
			fs.unlinkSync(req.file.path);   

			// send data along with the invoice
			res.render("invoice", { data: companyData });
	});
});

function getHourDifference(start: string, end: string) {

	const mStart = moment(start);
	const mEnd = moment(end);
		
	const numHours = mEnd.diff(mStart, "hours");
	return numHours;
}

module.exports = router;
