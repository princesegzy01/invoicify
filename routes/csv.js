"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var moment_1 = __importDefault(require("moment"));
var lodash_1 = __importDefault(require("lodash"));
var fs = require("fs");
var multer = require("multer");
var csv = require("fast-csv");
var upload = multer({ dest: "tmp/csv/" });
var router = express_1.default.Router();
/* GET home page. */
router.post("/", upload.single("csvdata"), function (req, res, next) {
    // container to handle all processed bill
    var fileRows = [];
    var x = 0;
    csv.parseFile(req.file.path).on("data", function (data) {
        var dataLine = data;
        if (x === 0) {
            // add extra colum headers to the headings
            dataLine.push("cost");
            dataLine.push("num hrs");
        }
        else {
            var fullStartDate = dataLine[3] + " " + dataLine[4];
            var fullEndDate = dataLine[3] + " " + dataLine[5];
            // get hour differences between the start time and end time.
            var num_hours = getHourDifference(fullStartDate, fullEndDate);
            // get the lawyer billbable rate per hour
            var billableRate = parseFloat(dataLine[1]);
            // get the total cost by multiplying 
            // billable hour by the hours spent
            var totalBill = billableRate * num_hours;
            // push the 2 new colum to the bill array
            dataLine.push(totalBill);
            dataLine.push(num_hours);
        }
        // push each processed bill to a new array
        fileRows.push(dataLine);
        x += 1;
    }).on("end", function () {
        // delete the heading from the csv array
        fileRows.shift();
        var dataBody = fileRows;
        // create a bill array
        var billArray = [];
        // loop through all bills and create a bill objects from it
        dataBody.forEach(function (element) {
            var billObj = {
                employee: element[0],
                hour_rate: element[1],
                project: element[2],
                cost: element[6],
                num_hrs: element[7],
            };
            billArray.push(billObj);
        });
        // group all similar bills based on the projects 
        var groupData = lodash_1.default.groupBy(billArray, function (b) { return b.project; });
        // get all the project keys
        var companykeys = Object.keys(groupData);
        // create each company container
        var companyData = [];
        // loop through each keys ans store each company bills in an array of aray
        companykeys.forEach(function (key) {
            companyData.push(groupData[key]);
        });
        // remove temp file
        fs.unlinkSync(req.file.path);
        // send data along with the invoice
        res.render("invoice", { data: companyData });
    });
});
function getHourDifference(start, end) {
    var mStart = moment_1.default(start);
    var mEnd = moment_1.default(end);
    var numHours = mEnd.diff(mStart, "hours");
    return numHours;
}
module.exports = router;
